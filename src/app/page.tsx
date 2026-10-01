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

interface WeatherMeta {
  city: string;
  state: string;
  country: string;
  coordinates: string;
  condition: string;
  conditionIcon: string;
  weatherCode: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  rain: number;
  uvIndex: number;
  aqi: number;
  pm25: number;
  pm10: number;
  co: number;
  isDay: boolean;
  fetchedAt: string;
}

interface LocationInfo {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  coordinates: string;
  displayName: string;
}

export default function WeatherDashboard() {
  const [latest, setLatest] = useState<Reading | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [weatherMeta, setWeatherMeta] = useState<WeatherMeta | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [range, setRange] = useState<string>('24h');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState<boolean>(false);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('aeropulse_theme') as 'dark' | 'light' | null) || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.className = savedTheme;
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('aeropulse_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.body.className = nextTheme;
  };

  // Fetch telemetry and Lucknow weather metadata from REST API
  const fetchTelemetry = useCallback(async (silent = false, forceSync = false) => {
    if (!silent) {
      if (forceSync) setIsSyncing(true);
      else setIsRefreshing(true);
    }
    try {
      const syncQuery = forceSync ? '&sync=true' : '';
      const res = await fetch(`/api/telemetry?range=${range}&limit=100${syncQuery}`);
      if (res.ok) {
        const data = await res.json();
        if (data.latest) setLatest(data.latest);
        if (data.history) setHistory(data.history);
        if (data.summary) setSummary(data.summary);
        if (data.totalCount !== undefined) setTotalCount(data.totalCount);
        if (data.weatherMeta) setWeatherMeta(data.weatherMeta);
        if (data.location) setLocation(data.location);
      }
    } catch (err) {
      console.error('Failed to fetch telemetry data:', err);
    } finally {
      if (!silent) {
        setIsRefreshing(false);
        setIsSyncing(false);
      }
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

    // Polling fallback every 6 seconds to ensure continuous live data
    fallbackTimer = setInterval(() => {
      fetchTelemetry(true);
    }, 6000);

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [fetchTelemetry]);

  // Manual force sync with real Lucknow weather API
  const handleSyncLucknow = () => {
    fetchTelemetry(false, true);
  };

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

  // Dynamic reading fallback based on Lucknow baseline
  const activeReading: Reading = latest || {
    id: 0,
    temperature: weatherMeta?.temperature ?? 28.5,
    humidity: weatherMeta?.humidity ?? 73.0,
    rainValue: weatherMeta && weatherMeta.precipitation > 0 ? 320 : 880,
    rainStatus: weatherMeta && weatherMeta.precipitation > 0 ? 'RAIN DETECTED' : 'NO RAIN',
    irValue: 1,
    irStatus: 'NO OBJECT',
    gasValue: weatherMeta?.aqi ?? 128,
    airQuality: 'MODERATE',
    uvRaw: 220,
    uvVoltage: parseFloat(((weatherMeta?.uvIndex ?? 4.0) / 2.5).toFixed(2)),
    uvIndex: weatherMeta?.uvIndex ?? 4.0,
    createdAt: new Date().toISOString(),
  };

  const heatIndex = weatherMeta?.apparentTemperature ?? computeHeatIndex(
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
        locationName={location ? `${location.city}, ${location.state}` : 'Lucknow, Uttar Pradesh'}
        weatherCondition={weatherMeta?.condition ?? 'Clear Sky'}
        weatherIcon={weatherMeta?.conditionIcon ?? '☀️'}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        onRefresh={() => fetchTelemetry(false)}
        onSyncLucknow={handleSyncLucknow}
        isRefreshing={isRefreshing}
        isSyncing={isSyncing}
      />

      {/* Lucknow Station Meteorological Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              fontSize: '2rem',
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'var(--item-bg)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {weatherMeta?.conditionIcon || '🌤️'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Lucknow Meteorological Center
              </h2>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                ● REAL-TIME SYNC
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Coordinates: <strong>26.8467° N, 80.9462° E</strong> &bull; Elevation: <strong>123 m</strong> &bull; Current:{' '}
              <strong style={{ color: 'var(--accent-cyan)' }}>{weatherMeta?.condition || 'Clear Sky'}</strong>
            </p>
          </div>
        </div>

        {/* Live Lucknow Environmental Chips */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {weatherMeta?.pressure && (
            <div
              style={{
                background: 'var(--item-bg)',
                border: '1px solid var(--border-glass)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Pressure: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{weatherMeta.pressure.toFixed(1)} hPa</strong>
            </div>
          )}

          {weatherMeta?.windSpeed !== undefined && (
            <div
              style={{
                background: 'var(--item-bg)',
                border: '1px solid var(--border-glass)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Wind: </span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {weatherMeta.windSpeed} km/h {weatherMeta.windDirection}
              </strong>
            </div>
          )}

          {weatherMeta?.apparentTemperature !== undefined && (
            <div
              style={{
                background: 'var(--item-bg)',
                border: '1px solid var(--border-glass)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Feels Like: </span>
              <strong style={{ color: 'var(--accent-cyan)' }}>
                {displayTemp(weatherMeta.apparentTemperature)}°{tempUnit}
              </strong>
            </div>
          )}

          <button
            onClick={handleSyncLucknow}
            disabled={isSyncing}
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.42rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: isSyncing ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)',
            }}
          >
            <span>{isSyncing ? '⏳' : '⚡'}</span>
            <span>{isSyncing ? 'Updating...' : 'Sync Lucknow Data'}</span>
          </button>
        </div>
      </div>

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
        <MetricCard
          title="Temperature"
          value={displayTemp(activeReading.temperature)}
          unit={`°${tempUnit}`}
          icon="🌡️"
          accentColor="#06b6d4"
          topAction={
            <button
              onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
              title={`Switch unit to °${tempUnit === 'C' ? 'F' : 'C'}`}
              style={{
                background: 'var(--item-bg)',
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
              °{tempUnit === 'C' ? 'F' : 'C'}
            </button>
          }
          secondaryText={`Feels like ${displayTemp(heatIndex)}°${tempUnit} • Real Lucknow Ambient`}
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
              activeReading.temperature > 32
                ? 'HOT'
                : activeReading.temperature < 20
                  ? 'COOL'
                  : 'PLEASANT',
            type:
              activeReading.temperature > 32
                ? 'warning'
                : activeReading.temperature < 20
                  ? 'info'
                  : 'success',
          }}
        />

        {/* Humidity Card */}
        <MetricCard
          title="Relative Humidity"
          value={activeReading.humidity.toFixed(1)}
          unit="%"
          icon="💧"
          accentColor="#3b82f6"
          secondaryText="Atmospheric water vapor &bull; Lucknow Sensor Baseline"
          minVal={summary?.humMin}
          maxVal={summary?.humMax}
          avgVal={summary?.humAvg}
          statusBadge={{
            text:
              activeReading.humidity > 75
                ? 'HUMID'
                : activeReading.humidity < 35
                  ? 'DRY'
                  : 'COMFORTABLE',
            type:
              activeReading.humidity > 75
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
          pm25={weatherMeta?.pm25}
          pm10={weatherMeta?.pm10}
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
                    background: 'var(--item-bg)',
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
                  IR Optical Beam / Obstacle
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
                  border: `1px solid ${isObjectDetected
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
                Infrared Sensor Line-of-Sight Monitor (Pin 3: {activeReading.irValue})
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: '1rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--item-bg)',
              border: '1px solid var(--border-glass)',
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
          <strong>AeroPulse IoT</strong> &bull; Lucknow Meteorological Telemetry Station
        </div>
        <div>
          Powered by Open-Meteo High-Resolution Live APIs &bull; Arduino Uno &bull; SQLite &bull; Next.js App Router
        </div>
      </footer>
    </main>
  );
}
