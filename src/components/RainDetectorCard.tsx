'use client';

import React from 'react';

interface RainDetectorCardProps {
  rainValue: number;
  rainStatus: string;
}

export const RainDetectorCard: React.FC<RainDetectorCardProps> = ({
  rainValue,
  rainStatus,
}) => {
  const isRaining =
    rainStatus?.toUpperCase().includes('RAIN') &&
    !rainStatus?.toUpperCase().includes('NO RAIN');

  // Wetness percentage: 1023 is bone dry (0%), 0 is totally soaked (100%)
  const wetnessPercent = Math.min(
    Math.max(Math.round(((1023 - rainValue) / 1023) * 100), 0),
    100
  );

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
          background: isRaining
            ? 'linear-gradient(90deg, transparent, #06b6d4, transparent)'
            : 'linear-gradient(90deg, transparent, #64748b, transparent)',
        }}
      />

      {/* Raining ambient particle simulation in background */}
      {isRaining && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            opacity: 0.25,
            display: 'flex',
            justifyContent: 'space-around',
          }}
        >
          <div className="rain-drop" style={{ animationDelay: '0.1s' }} />
          <div className="rain-drop" style={{ animationDelay: '0.4s' }} />
          <div className="rain-drop" style={{ animationDelay: '0.8s' }} />
          <div className="rain-drop" style={{ animationDelay: '0.2s' }} />
          <div className="rain-drop" style={{ animationDelay: '0.6s' }} />
        </div>
      )}

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
              {isRaining ? '🌧️' : '⛅'}
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
              Raindrop Sensor
            </span>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              background: isRaining
                ? 'rgba(6, 182, 212, 0.15)'
                : 'var(--item-bg)',
              color: isRaining ? 'var(--accent-cyan)' : 'var(--text-muted)',
              border: `1px solid ${
                isRaining ? 'rgba(6, 182, 212, 0.3)' : 'var(--border-glass)'
              }`,
              letterSpacing: '0.05em',
            }}
          >
            {isRaining ? 'PRECIPITATION' : 'NO RAIN'}
          </span>
        </div>

        <div style={{ margin: '0.6rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: isRaining ? 'var(--accent-cyan)' : 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              {wetnessPercent}%
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Surface Moisture
            </span>
          </div>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginTop: '0.35rem',
            }}
          >
            Raw Analog Sensor: {rainValue} / 1023
          </p>
        </div>

        {/* Moisture bar */}
        <div style={{ margin: '1rem 0 0.5rem 0' }}>
          <div
            style={{
              height: '8px',
              width: '100%',
              backgroundColor: 'var(--item-bg)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${wetnessPercent}%`,
                background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)',
                borderRadius: '9999px',
                transition: 'width 0.6s ease',
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
            <span>Dry (1023)</span>
            <span>Threshold (500)</span>
            <span>Heavy Rain (0)</span>
          </div>
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
        <span>{isRaining ? '🌧️' : '☀️'}</span>
        <span>
          {isRaining
            ? 'Active rainfall detected on outdoor collection pad.'
            : 'Precipitation plate is dry. Clear conditions.'}
        </span>
      </div>
    </div>
  );
};
