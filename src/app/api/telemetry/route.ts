import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setLatestReading } from '@/lib/liveBus';
import {
  getLucknowLiveWeather,
  syncLucknowTelemetryToDb,
  generateDynamicLucknowReading,
  LUCKNOW_COORDS,
} from '@/lib/lucknowWeather';

export const dynamic = 'force-dynamic';

// In-memory EMA smoothing for hardware sensor-side ingestion
let serverSmoothedGas: number | null = null;
let serverSmoothedUV: number | null = null;
let serverSmoothedRain: number | null = null;
let serverRainStatus = 'NO RAIN';

function smoothServerGas(val: number): number {
  if (isNaN(val)) return serverSmoothedGas ?? 120;
  if (serverSmoothedGas === null) {
    serverSmoothedGas = val;
    return val;
  }
  serverSmoothedGas = Math.round(serverSmoothedGas * 0.75 + val * 0.25);
  return serverSmoothedGas;
}

function smoothServerUV(v: number): { voltage: number; index: number } {
  if (isNaN(v)) return { voltage: 0, index: 0 };
  if (serverSmoothedUV === null) {
    serverSmoothedUV = v;
  } else {
    serverSmoothedUV = parseFloat((serverSmoothedUV * 0.75 + v * 0.25).toFixed(2));
  }
  const index = parseFloat((serverSmoothedUV * 2.5).toFixed(1));
  return { voltage: serverSmoothedUV, index };
}

function smoothServerRain(val: number): { value: number; status: string } {
  if (isNaN(val)) return { value: 850, status: 'NO RAIN' };
  if (serverSmoothedRain === null) {
    serverSmoothedRain = val;
  } else {
    serverSmoothedRain = Math.round(serverSmoothedRain * 0.7 + val * 0.3);
  }
  if (serverSmoothedRain < 450) {
    serverRainStatus = 'RAIN DETECTED';
  } else if (serverSmoothedRain > 550) {
    serverRainStatus = 'NO RAIN';
  }
  return { value: serverSmoothedRain, status: serverRainStatus };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Get live Lucknow baseline for accurate fallbacks if sensors disconnect
    const lucknowMeta = await getLucknowLiveWeather();

    let temperature = Number(body.temperature);
    let humidity = Number(body.humidity);

    // If DHT11 sensor is down (reads 0 or NaN), use real Lucknow ambient baseline
    if (isNaN(temperature) || temperature <= 0) {
      temperature = lucknowMeta.temperature;
    }
    if (isNaN(humidity) || humidity <= 0) {
      humidity = lucknowMeta.humidity;
    }

    const rawRain = parseInt(body.rainValue ?? body.rainfall ?? (lucknowMeta.precipitation > 0 ? 300 : 880), 10);
    const rainFiltered = smoothServerRain(rawRain);

    const irValue = parseInt(body.irValue ?? 1, 10);
    const irStatus = String(body.irStatus || (irValue === 0 ? 'OBJECT DETECTED' : 'NO OBJECT'));

    const rawGas = parseInt(body.gasValue ?? body.aqi ?? lucknowMeta.aqi, 10);
    const gasValue = smoothServerGas(rawGas);

    let airQuality = body.airQuality;
    if (!airQuality || airQuality === 'UNKNOWN') {
      if (gasValue <= 50) airQuality = 'GOOD';
      else if (gasValue <= 100) airQuality = 'GOOD';
      else if (gasValue <= 200) airQuality = 'MODERATE';
      else if (gasValue <= 300) airQuality = 'POOR';
      else airQuality = 'VERY POOR';
    }

    const uvRaw = body.uvRaw !== undefined ? parseInt(body.uvRaw, 10) : null;
    const rawUvVoltage = Number(body.uvVoltage ?? body.uv_voltage ?? (lucknowMeta.uvIndex / 2.5));
    const uvFiltered = smoothServerUV(rawUvVoltage);

    const reading = await prisma.sensorReading.create({
      data: {
        temperature: parseFloat(temperature.toFixed(2)),
        humidity: parseFloat(humidity.toFixed(2)),
        rainValue: rainFiltered.value,
        rainStatus: rainFiltered.status,
        irValue,
        irStatus,
        gasValue,
        airQuality,
        uvRaw,
        uvVoltage: uvFiltered.voltage,
        uvIndex: uvFiltered.index,
      },
    });

    // Notify connected SSE clients and cache latest reading
    setLatestReading(reading);

    return NextResponse.json(
      {
        success: true,
        message: 'Telemetry recorded successfully',
        data: reading,
        location: LUCKNOW_COORDS,
        weatherMeta: lucknowMeta,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error recording sensor telemetry:', error);
    return NextResponse.json(
      { error: 'Failed to record sensor reading', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const range = searchParams.get('range') || '24h';
    const forceSync = searchParams.get('sync') === 'true';

    // 1. Automatically sync live Lucknow weather to database if stale or forced
    await syncLucknowTelemetryToDb(forceSync);

    // 2. Fetch fresh weather metadata for Lucknow
    const lucknowMeta = await getLucknowLiveWeather(forceSync);

    let startDate: Date | undefined;
    const now = new Date();

    if (range === '1h') {
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
    } else if (range === '6h') {
      startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    } else if (range === '24h') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const whereClause = startDate ? { createdAt: { gte: startDate } } : {};

    const [latest, historyDesc, totalCount] = await Promise.all([
      prisma.sensorReading.findFirst({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sensorReading.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.sensorReading.count(),
    ]);

    const history = historyDesc.reverse().map((h) => ({
      ...h,
      temperature: parseFloat(h.temperature.toFixed(1)),
      humidity: parseFloat(h.humidity.toFixed(1)),
      gasValue: Math.round(h.gasValue),
      uvIndex: parseFloat(h.uvIndex.toFixed(1)),
      uvVoltage: parseFloat(h.uvVoltage.toFixed(2)),
    }));

    // Calculate quick stats over the selected history
    let summary = null;
    if (history.length > 0) {
      const temps = history.map((h) => h.temperature);
      const hums = history.map((h) => h.humidity);
      const gases = history.map((h) => h.gasValue);
      const uvs = history.map((h) => h.uvIndex);

      summary = {
        tempMin: parseFloat(Math.min(...temps).toFixed(1)),
        tempMax: parseFloat(Math.max(...temps).toFixed(1)),
        tempAvg: parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)),
        humMin: parseFloat(Math.min(...hums).toFixed(1)),
        humMax: parseFloat(Math.max(...hums).toFixed(1)),
        humAvg: parseFloat((hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1)),
        gasMin: Math.min(...gases),
        gasMax: Math.max(...gases),
        gasAvg: Math.round(gases.reduce((a, b) => a + b, 0) / gases.length),
        uvMin: parseFloat(Math.min(...uvs).toFixed(1)),
        uvMax: parseFloat(Math.max(...uvs).toFixed(1)),
        uvAvg: parseFloat((uvs.reduce((a, b) => a + b, 0) / uvs.length).toFixed(1)),
      };
    }

    return NextResponse.json({
      success: true,
      location: LUCKNOW_COORDS,
      weatherMeta: lucknowMeta,
      latest: latest || generateDynamicLucknowReading(lucknowMeta),
      history,
      summary,
      totalCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching telemetry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch telemetry data', details: error.message },
      { status: 500 }
    );
  }
}

