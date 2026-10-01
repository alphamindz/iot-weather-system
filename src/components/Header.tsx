'use client';

import React from 'react';

interface HeaderProps {
  isLive: boolean;
  lastUpdated: string | null;
  totalRecords: number;
  locationName?: string;
  weatherCondition?: string;
  weatherIcon?: string;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenHardwareModal: () => void;
  onRefresh: () => void;
  onSyncLucknow?: () => void;
  isRefreshing: boolean;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isLive,
  lastUpdated,
  totalRecords,
  locationName = 'Lucknow, Uttar Pradesh',
  weatherCondition = 'Clear Sky',
  weatherIcon = '☀️',
  theme = 'dark',
  onToggleTheme,
  onOpenHardwareModal,
  onRefresh,
  onSyncLucknow,
  isRefreshing,
  isSyncing = false,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.25rem 1.75rem',
        marginBottom: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-card)',
        transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            boxShadow: 'var(--shadow-glow-cyan)',
            flexShrink: 0,
          }}
        >
          {weatherIcon || '🌤️'}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                background: 'var(--heading-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AeroPulse Weather Station
            </h1>

            {/* Live Indicator */}
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                background: isLive
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(244, 63, 94, 0.15)',
                color: isLive ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                border: `1px solid ${
                  isLive
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(244, 63, 94, 0.3)'
                }`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span
                className={`pulse-indicator ${isLive ? '' : 'offline'}`}
                style={{ width: '6px', height: '6px' }}
              />
              {isLive ? 'LIVE STREAM' : 'DISCONNECTED'}
            </span>

            {/* Location Pill */}
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>📍</span>
              <span>{locationName}</span>
            </span>
          </div>

          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginTop: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <span>Real Open-Meteo High-Resolution API &bull; Arduino Uno Hardware Sensor Array</span>
            <span>&bull;</span>
            <span>{totalRecords.toLocaleString()} logged packets</span>
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          flexWrap: 'wrap',
        }}
      >
        {lastUpdated && (
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              background: 'var(--item-bg)',
              padding: '0.45rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glass)',
            }}
          >
            Ping: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}

        {/* Sync Lucknow Live Weather Button */}
        {onSyncLucknow && (
          <button
            onClick={onSyncLucknow}
            disabled={isSyncing}
            title="Fetch immediate real-time weather update for Lucknow from Open-Meteo"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: isSyncing ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: isSyncing ? 'rotate(360deg)' : 'none',
                transition: isSyncing ? 'transform 0.8s linear infinite' : 'none',
              }}
            >
              ⚡
            </span>
            {isSyncing ? 'Syncing...' : 'Sync Lucknow'}
          </button>
        )}

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            style={{
              background: 'var(--item-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-glass)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--item-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--item-bg)';
            }}
          >
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            background: 'var(--item-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-glass)',
            padding: '0.5rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            fontWeight: 500,
            cursor: isRefreshing ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--item-bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--item-bg)';
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transform: isRefreshing ? 'rotate(360deg)' : 'none',
              transition: isRefreshing ? 'transform 0.8s linear infinite' : 'none',
            }}
          >
            🔄
          </span>
          Refresh
        </button>

        <a
          href="/api/telemetry/export"
          download
          style={{
            background: 'rgba(59, 130, 246, 0.15)',
            color: 'var(--accent-blue)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '0.5rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
          }}
        >
          📥 CSV
        </a>

        <button
          onClick={onOpenHardwareModal}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow =
              '0 6px 18px rgba(37, 99, 235, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow =
              '0 4px 14px rgba(37, 99, 235, 0.35)';
          }}
        >
          ⚡ Hardware Setup
        </button>
      </div>
    </header>
  );
};
