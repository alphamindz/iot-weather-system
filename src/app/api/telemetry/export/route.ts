import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const readings = await prisma.sensorReading.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const headers = [
      'ID',
      'Timestamp',
      'Temperature (C)',
      'Humidity (%)',
      'Rain Value',
      'Rain Status',
      'IR Value',
      'IR Status',
      'Gas AQI',
      'Air Quality',
      'UV Voltage (V)',
      'UV Index',
    ];

    const rows = readings.map((r) => [
      r.id,
      r.createdAt.toISOString(),
      r.temperature,
      r.humidity,
      r.rainValue,
      `"${r.rainStatus}"`,
      r.irValue,
      `"${r.irStatus}"`,
      r.gasValue,
      `"${r.airQuality}"`,
      r.uvVoltage,
      r.uvIndex,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join(
      '\n'
    );

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="weather_telemetry_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to export telemetry data', details: error.message },
      { status: 500 }
    );
  }
}
