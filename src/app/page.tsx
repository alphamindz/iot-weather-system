'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { AirQualityMeter } from '@/components/AirQualityMeter';
import { UVIndexMeter } from '@/components/UVIndexMeter';
import { RainDetectorCard } from '@/components/RainDetectorCard';
import { HistoryChart } from '@/components/HistoryChart';
import { DataTable } from '@/components/DataTable';
import { HardwareModal } from '@/components/HardwareModal';

interface Reading {
  id: number;
  temperature: number;
  humidity: number;
  rainValue: number;
  rainStatus: string;
  irValue: number;
  irStatus: string;
  gasValue: number;
  airQuality: string;
  uvRaw?: number | null;
  uvVoltage: number;
  uvIndex: number;
  createdAt: string;
}

interface Summary {
  tempMin: number;
  tempMax: number;
  tempAvg: number;
  humMin: number;
  humMax: number;
  humAvg: number;
  gasMin: number;
  gasMax: number;
  gasAvg: number;
  uvMin: number;
  uvMax: number;
  uvAvg: number;
}

export default function WeatherDashboard() {
  const [latest, setLatest] = useState<Reading | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [range, setRange] = useState<string>('24h');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState<boolean>(false);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  // Fetch telemetry from REST API
  const fetchTelemetry = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/telemetry?range=${range}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        if (data.latest) setLatest(data.latest);
        if (data.history) setHistory(data.history);
        if (data.summary) setSummary(data.summary);
        if (data.totalCount !== undefined) setTotalCount(data.totalCount);
      }
    } catch (err) {
      console.error('Failed to fetch telemetry data:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [range]);

  // Initial load and range change
  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Real-time updates via Server-Sent Events (SSE)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource('/api/telemetry/live');

      eventSource.addEventListener('reading', (e) => {
        try {
          const newReading: Reading = JSON.parse(e.data);
          setIsLive(true);
          setLatest(newReading);

          setHistory((prev) => {
            // Keep last 100 entries
            const updated = [...prev, newReading];
            return updated.slice(-100);
          });

          setTotalCount((prev) => prev + 1);
        } catch (err) {
          console.error('Error parsing SSE reading packet:', err);
        }
      });

      eventSource.onopen = () => {
        setIsLive(true);
      };

      eventSource.onerror = () => {
        setIsLive(false);
      };
    } catch {
      setIsLive(false);
    }

    // Polling fallback every 4 seconds to ensure consistency
    fallbackTimer = setInterval(() => {
      fetchTelemetry(true);
    }, 4000);

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [fetchTelemetry]);

  // Temperature conversions
  const displayTemp = (celsius: number) => {
    if (tempUnit === 'F') {
      return parseFloat(((celsius * 9) / 5 + 32).toFixed(1));
    }
    return celsius.toFixed(1);
  };

  // Compute Heat Index approximate (°C)
  const computeHeatIndex = (T: number, R: number) => {
    return (
      -8.78469475556 +
      1.61139411 * T +
      2.33854883889 * R -
      0.14611605 * T * R -
      0.012308094 * T * T -
      0.0164248277778 * R * R +
      0.002211732 * T * T * R +
      0.00072546 * T * R * R -
      0.000003582 * T * T * R * R
    );
  };

  // Fallback initial values if no reading in database yet
  const activeReading: Reading = latest || {
    id: 0,
    temperature: 24.5,
    humidity: 58.0,
    rainValue: 840,
    rainStatus: 'NO RAIN',
    irValue: 1,
    irStatus: 'NO OBJECT',
    gasValue: 145,
    airQuality: 'GOOD',
    uvRaw: 220,
    uvVoltage: 1.08,
    uvIndex: 2.7,
    createdAt: new Date().toISOString(),
  };

  const heatIndex = computeHeatIndex(
    activeReading.temperature,
    activeReading.humidity
  );

  const isObjectDetected =
    activeReading.irStatus?.toUpperCase().includes('OBJECT') &&
    !activeReading.irStatus?.toUpperCase().includes('NO OBJECT');

  return (
    <main className="container">
      {/* Top Header */}
      <Header
        isLive={isLive}
        lastUpdated={latest ? latest.createdAt : null}
        totalRecords={totalCount}
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        onRefresh={() => fetchTelemetry(false)}
        isRefreshing={isRefreshing}
      />

      {/* Hero Sensor Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Temperature Card */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              zIndex: 10,
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--accent-cyan)',
              border: '1px solid var(--border-glass)',
              borderRadius: '6px',
              padding: '0.2rem 0.5rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Switch to °{tempUnit === 'C' ? 'F' : 'C'}
          </button>
          <MetricCard
            title="Temperature"
            value={displayTemp(activeReading.temperature)}
            unit={`°${tempUnit}`}
            icon="🌡️"
            accentColor="#06b6d4"
            secondaryText={`Feels like ${displayTemp(heatIndex)}°${tempUnit} &bull; DHT11 Sensor`}
            minVal={
              summary
                ? tempUnit === 'F'
                  ? parseFloat(((summary.tempMin * 9) / 5 + 32).toFixed(1))
                  : summary.tempMin
                : undefined
            }
            maxVal={
              summary
                ? tempUnit === 'F'
                  ? parseFloat(((summary.tempMax * 9) / 5 + 32).toFixed(1))
                  : summary.tempMax
                : undefined
            }
            avgVal={
              summary
                ? tempUnit === 'F'
                  ? parseFloat(((summary.tempAvg * 9) / 5 + 32).toFixed(1))
                  : summary.tempAvg
                : undefined
            }
            statusBadge={{
              text:
                activeReading.temperature > 30
                  ? 'HOT'
                  : activeReading.temperature < 18
                  ? 'COOL'
                  : 'NORMAL',
              type:
                activeReading.temperature > 30
                  ? 'warning'
                  : activeReading.temperature < 18
                  ? 'info'
                  : 'success',
            }}
          />
        </div>

        {/* Humidity Card */}
        <MetricCard
          title="Relative Humidity"
          value={activeReading.humidity.toFixed(1)}
          unit="%"
          icon="💧"
          accentColor="#3b82f6"
          secondaryText="Atmospheric water vapor &bull; DHT11 Sensor"
          minVal={summary?.humMin}
          maxVal={summary?.humMax}
          avgVal={summary?.humAvg}
          statusBadge={{
            text:
              activeReading.humidity > 70
                ? 'HUMID'
                : activeReading.humidity < 35
                ? 'DRY'
                : 'OPTIMAL',
            type:
              activeReading.humidity > 70
                ? 'warning'
                : activeReading.humidity < 35
                ? 'info'
                : 'success',
          }}
        />

        {/* Air Quality Card */}
        <AirQualityMeter
          gasValue={activeReading.gasValue}
          airQuality={activeReading.airQuality}
        />

        {/* UV Index Card */}
        <UVIndexMeter
          uvIndex={activeReading.uvIndex}
          uvVoltage={activeReading.uvVoltage}
        />
      </div>

      {/* Row 2: Secondary Specialized Sensors */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Raindrop Sensor */}
        <RainDetectorCard
          rainValue={activeReading.rainValue}
          rainStatus={activeReading.rainStatus}
        />

        {/* IR Proximity & Obstacle Detection */}
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: isObjectDetected
                ? 'linear-gradient(90deg, transparent, #f59e0b, transparent)'
                : 'linear-gradient(90deg, transparent, #10b981, transparent)',
            }}
          />

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span
                  style={{
                    fontSize: '1.35rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  🎯
                </span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  IR Obstacle Detector
                </span>
              </div>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  background: isObjectDetected
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(16, 185, 129, 0.15)',
                  color: isObjectDetected
                    ? 'var(--accent-amber)'
                    : 'var(--accent-emerald)',
                  border: `1px solid ${
                    isObjectDetected
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'rgba(16, 185, 129, 0.3)'
                  }`,
                  letterSpacing: '0.05em',
                }}
              >
                {isObjectDetected ? 'TRIGGERED' : 'CLEAR'}
              </span>
            </div>

            <div style={{ margin: '0.6rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: isObjectDetected
                      ? 'var(--accent-amber)'
                      : 'var(--accent-emerald)',
                    lineHeight: 1,
                  }}
                >
                  {activeReading.irStatus}
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.35rem',
                }}
              >
                Infrared Optical Beam Status (Pin 3: {activeReading.irValue})
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: '1rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>{isObjectDetected ? '⚠️' : '✅'}</span>
            <span>
              {isObjectDetected
                ? 'Object or obstruction detected directly in front of station sensor array.'
                : 'Infrared line-of-sight is unobstructed. Sensor perimeter clear.'}
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Trend & Fluctuations Chart */}
      <div style={{ marginBottom: '1.5rem' }}>
        <HistoryChart
          data={history}
          range={range}
          onRangeChange={(r) => setRange(r)}
        />
      </div>

      {/* Row 4: Telemetry Table */}
      <div style={{ marginBottom: '2.5rem' }}>
        <DataTable readings={history} />
      </div>

      {/* Hardware Connection Modal */}
      <HardwareModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1.5rem 0',
          borderTop: '1px solid var(--border-glass)',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div>
          <strong>AeroPulse IoT</strong> &bull; Meteorological Telemetry System
        </div>
        <div>
          Powered by Arduino Uno &bull; Prisma 5 ORM &bull; SQLite &bull; Next.js App Router
        </div>
      </footer>
    </main>
  );
}
