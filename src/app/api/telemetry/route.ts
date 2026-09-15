import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setLatestReading } from '@/lib/liveBus';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const temperature = Number(body.temperature);
    const humidity = Number(body.humidity);
    const rainValue = parseInt(body.rainValue ?? body.rainfall ?? 1023, 10);
    const rainStatus = String(body.rainStatus || (rainValue < 500 ? 'RAIN DETECTED' : 'NO RAIN'));
    const irValue = parseInt(body.irValue ?? 1, 10);
    const irStatus = String(body.irStatus || (irValue === 0 ? 'OBJECT DETECTED' : 'NO OBJECT'));
    const gasValue = parseInt(body.gasValue ?? body.aqi ?? 0, 10);

    let airQuality = body.airQuality;
    if (!airQuality) {
      if (gasValue < 200) airQuality = 'GOOD';
      else if (gasValue < 400) airQuality = 'MODERATE';
      else if (gasValue < 600) airQuality = 'POOR';
      else airQuality = 'VERY POOR';
    }

    const uvRaw = body.uvRaw !== undefined ? parseInt(body.uvRaw, 10) : null;
    const uvVoltage = Number(body.uvVoltage ?? body.uv_voltage ?? 0.0);
    const uvIndex = Number(body.uvIndex ?? body.uv_index ?? (uvVoltage * 2.5));

    if (isNaN(temperature) || isNaN(humidity)) {
      return NextResponse.json(
        { error: 'Invalid temperature or humidity reading' },
        { status: 400 }
      );
    }

    const reading = await prisma.sensorReading.create({
      data: {
        temperature: parseFloat(temperature.toFixed(2)),
        humidity: parseFloat(humidity.toFixed(2)),
        rainValue: Math.round(rainValue),
        rainStatus,
        irValue,
        irStatus,
        gasValue: Math.round(gasValue),
        airQuality,
        uvRaw,
        uvVoltage: parseFloat(uvVoltage.toFixed(2)),
        uvIndex: parseFloat(uvIndex.toFixed(2)),
      },
    });

    // Notify connected SSE clients and cache latest reading
    setLatestReading(reading);

    return NextResponse.json(
      {
        success: true,
        message: 'Telemetry recorded successfully',
        data: reading,
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '60', 10), 500);
    const range = searchParams.get('range') || '24h';

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

    // Reverse history to return chronological order for charts
    const history = [...historyDesc].reverse();

    // Calculate quick stats over the selected history
    let summary = null;
    if (history.length > 0) {
      const temps = history.map((h) => h.temperature);
      const hums = history.map((h) => h.humidity);
      const gases = history.map((h) => h.gasValue);
      const uvs = history.map((h) => h.uvIndex);

      summary = {
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        tempAvg: parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)),
        humMin: Math.min(...hums),
        humMax: Math.max(...hums),
        humAvg: parseFloat((hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1)),
        gasMin: Math.min(...gases),
        gasMax: Math.max(...gases),
        gasAvg: Math.round(gases.reduce((a, b) => a + b, 0) / gases.length),
        uvMin: Math.min(...uvs),
        uvMax: Math.max(...uvs),
        uvAvg: parseFloat((uvs.reduce((a, b) => a + b, 0) / uvs.length).toFixed(1)),
      };
    }

    return NextResponse.json({
      success: true,
      latest,
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
