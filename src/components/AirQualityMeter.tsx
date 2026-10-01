'use client';

import React from 'react';

interface AirQualityMeterProps {
  gasValue: number;
  airQuality: string;
  pm25?: number;
  pm10?: number;
}

export const AirQualityMeter: React.FC<AirQualityMeterProps> = ({
  gasValue,
  airQuality,
  pm25,
  pm10,
}) => {
  // Normalize percentage for progress bar (0 - 500 scale)
  const percentage = Math.min(Math.max((gasValue / 400) * 100, 5), 100);

  const getStatusConfig = () => {
    switch (airQuality?.toUpperCase()) {
      case 'GOOD':
        return {
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.3)',
          label: 'Good Air Quality',
          advice: 'Clean atmospheric air. Safe for all outdoor activities.',
          badgeType: 'GOOD',
        };
      case 'MODERATE':
        return {
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)',
          label: 'Moderate Air Quality',
          advice: 'Acceptable air purity. Sensitive individuals should monitor.',
          badgeType: 'MODERATE',
        };
      case 'POOR':
        return {
          color: '#f97316',
          bg: 'rgba(249, 115, 22, 0.12)',
          border: 'rgba(249, 115, 22, 0.3)',
          label: 'Poor Air Quality',
          advice: 'Pollutants elevated. Consider reducing prolonged outdoor exposure.',
          badgeType: 'POOR',
        };
      case 'VERY POOR':
      default:
        return {
          color: '#f43f5e',
          bg: 'rgba(244, 63, 94, 0.12)',
          border: 'rgba(244, 63, 94, 0.3)',
          label: 'Hazardous Air Quality',
          advice: 'Elevated particulate or combustion gases. Limit physical exertion outside.',
          badgeType: 'VERY POOR',
        };
    }
  };

  const config = getStatusConfig();

  return (
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
          background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
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
              🍃
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
              Air Quality &amp; AQI
            </span>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              background: config.bg,
              color: config.color,
              border: `1px solid ${config.border}`,
              letterSpacing: '0.05em',
            }}
          >
            {airQuality || 'MODERATE'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.6rem 0' }}>
          <span
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: config.color,
              lineHeight: 1,
            }}
          >
            {gasValue}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            US AQI &bull; MQ-135 Index
          </span>
        </div>

        {/* Dynamic Gradient Bar */}
        <div style={{ margin: '0.8rem 0 0.4rem 0' }}>
          <div
            style={{
              height: '8px',
              width: '100%',
              backgroundColor: 'var(--item-bg)',
              borderRadius: '9999px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${percentage}%`,
                background: `linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #f43f5e 100%)`,
                borderRadius: '9999px',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 12px ${config.color}`,
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              marginTop: '0.35rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>0 Good</span>
            <span>100 Mod</span>
            <span>200 Poor</span>
            <span>300+ Hazardous</span>
          </div>
        </div>

        {/* PM2.5 / PM10 Breakdown if available */}
        {(pm25 !== undefined || pm10 !== undefined) && (
          <div
            style={{
              display: 'flex',
              gap: '0.6rem',
              marginTop: '0.75rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {pm25 !== undefined && (
              <span
                style={{
                  background: 'var(--item-bg)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-secondary)',
                }}
              >
                PM2.5: <strong>{pm25} µg/m³</strong>
              </span>
            )}
            {pm10 !== undefined && (
              <span
                style={{
                  background: 'var(--item-bg)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-secondary)',
                }}
              >
                PM10: <strong>{pm10} µg/m³</strong>
              </span>
            )}
          </div>
        )}
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
        <span>💡</span>
        <span>{config.advice}</span>
      </div>
    </div>
  );
};
