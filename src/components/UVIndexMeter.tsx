'use client';

import React from 'react';

interface UVIndexMeterProps {
  uvIndex: number;
  uvVoltage: number;
}

export const UVIndexMeter: React.FC<UVIndexMeterProps> = ({
  uvIndex,
  uvVoltage,
}) => {
  const getUVCategory = (val: number) => {
    if (val < 3) {
      return {
        level: 'LOW',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.3)',
        advice: 'Minimal danger for average person. No sun protection required.',
      };
    } else if (val < 6) {
      return {
        level: 'MODERATE',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.3)',
        advice: 'Moderate risk. Wear sunglasses, SPF 30+ sunscreen, and a hat.',
      };
    } else if (val < 8) {
      return {
        level: 'HIGH',
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.12)',
        border: 'rgba(249, 115, 22, 0.3)',
        advice: 'High harm risk. Seek shade during midday, cover up with clothing.',
      };
    } else if (val < 11) {
      return {
        level: 'VERY HIGH',
        color: '#f43f5e',
        bg: 'rgba(244, 63, 94, 0.12)',
        border: 'rgba(244, 63, 94, 0.3)',
        advice: 'Very high risk of burn! Minimize direct exposure 10 AM - 4 PM.',
      };
    } else {
      return {
        level: 'EXTREME',
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.12)',
        border: 'rgba(168, 85, 247, 0.3)',
        advice: 'Extreme solar radiation. Unprotected skin can burn in minutes!',
      };
    }
  };

  const cat = getUVCategory(uvIndex);
  const percentage = Math.min(Math.max((uvIndex / 12) * 100, 4), 100);

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
          background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)`,
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
              ☀️
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
              Solar UV Radiation
            </span>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              background: cat.bg,
              color: cat.color,
              border: `1px solid ${cat.border}`,
              letterSpacing: '0.05em',
            }}
          >
            {cat.level} RISK
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            margin: '0.6rem 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: cat.color,
                lineHeight: 1,
              }}
            >
              {uvIndex.toFixed(1)}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              UV Index
            </span>
          </div>

          <span
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '0.25rem 0.55rem',
              borderRadius: '6px',
            }}
          >
            {uvVoltage.toFixed(2)} V
          </span>
        </div>

        {/* Dynamic UV Gradient bar */}
        <div style={{ margin: '1rem 0 0.5rem 0' }}>
          <div
            style={{
              height: '8px',
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '9999px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${percentage}%`,
                background: `linear-gradient(90deg, #10b981 0%, #f59e0b 35%, #f97316 60%, #f43f5e 80%, #a855f7 100%)`,
                borderRadius: '9999px',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 12px ${cat.color}`,
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
            <span>0 Low</span>
            <span>3 Mod</span>
            <span>6 High</span>
            <span>8 V.High</span>
            <span>11+ Ext</span>
          </div>
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
        <span>🛡️</span>
        <span>{cat.advice}</span>
      </div>
    </div>
  );
};
