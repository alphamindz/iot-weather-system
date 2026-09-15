'use client';

import React, { useState } from 'react';

interface Reading {
  id: number;
  temperature: number;
  humidity: number;
  gasValue: number;
  airQuality: string;
  uvIndex: number;
  rainValue: number;
  createdAt: string;
}

interface HistoryChartProps {
  data: Reading[];
  range: string;
  onRangeChange: (r: string) => void;
}

export const HistoryChart: React.FC<HistoryChartProps> = ({
  data,
  range,
  onRangeChange,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<
    'temperature' | 'humidity' | 'gasValue' | 'uvIndex'
  >('temperature');

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length < 2) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>
          📊
        </span>
        <p style={{ fontWeight: 500 }}>Collecting Telemetry History...</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
          At least 2 data points required to render continuous trends.
        </p>
      </div>
    );
  }

  const metricConfigs = {
    temperature: {
      label: 'Temperature',
      unit: '°C',
      color: '#06b6d4',
      gradientId: 'tempGrad',
      min: Math.min(...data.map((d) => d.temperature)) - 2,
      max: Math.max(...data.map((d) => d.temperature)) + 2,
    },
    humidity: {
      label: 'Humidity',
      unit: '%',
      color: '#3b82f6',
      gradientId: 'humGrad',
      min: Math.max(0, Math.min(...data.map((d) => d.humidity)) - 5),
      max: Math.min(100, Math.max(...data.map((d) => d.humidity)) + 5),
    },
    gasValue: {
      label: 'Air Quality (MQ135)',
      unit: 'AQI',
      color: '#f59e0b',
      gradientId: 'gasGrad',
      min: Math.max(0, Math.min(...data.map((d) => d.gasValue)) - 30),
      max: Math.max(...data.map((d) => d.gasValue)) + 40,
    },
    uvIndex: {
      label: 'Solar UV Index',
      unit: 'UV',
      color: '#a855f7',
      gradientId: 'uvGrad',
      min: 0,
      max: Math.max(8, Math.max(...data.map((d) => d.uvIndex)) + 1),
    },
  };

  const currentCfg = metricConfigs[selectedMetric];
  const valRange = Math.max(currentCfg.max - currentCfg.min, 1);

  const svgWidth = 800;
  const svgHeight = 240;
  const padding = { top: 20, right: 25, bottom: 35, left: 45 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Calculate coordinates
  const points = data.map((item, idx) => {
    const x = padding.left + (idx / (data.length - 1)) * chartWidth;
    const val = item[selectedMetric];
    const y =
      padding.top +
      chartHeight -
      ((val - currentCfg.min) / valRange) * chartHeight;
    return { x, y, val, time: item.createdAt, reading: item };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${
    padding.top + chartHeight
  } L ${points[0].x},${padding.top + chartHeight} Z`;

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative' }}>
      {/* Header & Metric Switcher */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Environmental Telemetry Trends
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Real-time multi-sensor historical trends & fluctuations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Metric Selector Tabs */}
          {(
            ['temperature', 'humidity', 'gasValue', 'uvIndex'] as Array<
              'temperature' | 'humidity' | 'gasValue' | 'uvIndex'
            >
          ).map((m) => {
            const isSelected = selectedMetric === m;
            return (
              <button
                key={m}
                onClick={() => setSelectedMetric(m)}
                style={{
                  background: isSelected
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected
                    ? metricConfigs[m].color
                    : 'var(--text-secondary)',
                  border: isSelected
                    ? `1px solid ${metricConfigs[m].color}`
                    : '1px solid var(--border-glass)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {metricConfigs[m].label}
              </button>
            );
          })}

          {/* Time Range Selector */}
          <div
            style={{
              marginLeft: '0.5rem',
              borderLeft: '1px solid var(--border-glass)',
              paddingLeft: '0.5rem',
              display: 'flex',
              gap: '0.3rem',
            }}
          >
            {['1h', '6h', '24h', '7d'].map((r) => (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                style={{
                  background:
                    range === r
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'transparent',
                  color: range === r ? '#60a5fa' : 'var(--text-muted)',
                  border:
                    range === r
                      ? '1px solid rgba(59, 130, 246, 0.4)'
                      : '1px solid transparent',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient
              id={currentCfg.gradientId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={currentCfg.color}
                stopOpacity="0.35"
              />
              <stop
                offset="100%"
                stopColor={currentCfg.color}
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + chartHeight * (1 - ratio);
            const valLabel = (currentCfg.min + valRange * ratio).toFixed(1);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill={`url(#${currentCfg.gradientId})`} />

          {/* Main line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={currentCfg.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover hit points & dots */}
          {points.map((pt, idx) => (
            <g key={idx}>
              {/* Invisible large hit area */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="10"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoverIndex(idx)}
              />
              {/* Visible dot if hovered or every N points */}
              {(hoverIndex === idx || data.length <= 15) && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoverIndex === idx ? '5' : '3'}
                  fill={currentCfg.color}
                  stroke="#07090e"
                  strokeWidth="2"
                />
              )}
            </g>
          ))}

          {/* Crosshair when hovered */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={padding.top + chartHeight}
                stroke={currentCfg.color}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="6"
                fill={currentCfg.color}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Time axis labels */}
          {points.length > 1 && (
            <>
              <text
                x={padding.left}
                y={svgHeight - 10}
                fill="#64748b"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {new Date(points[0].time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </text>
              <text
                x={svgWidth - padding.right}
                y={svgHeight - 10}
                textAnchor="end"
                fill="#64748b"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {new Date(points[points.length - 1].time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Floating Tooltip readout */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.75rem',
            background: 'rgba(15, 23, 42, 0.95)',
            border: `1px solid ${currentCfg.color}`,
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.9rem',
            boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            zIndex: 10,
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            {new Date(hoveredPoint.time).toLocaleTimeString()}
          </div>
          <div
            style={{
              color: currentCfg.color,
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            {currentCfg.label}: {hoveredPoint.val} {currentCfg.unit}
          </div>
        </div>
      )}
    </div>
  );
};
