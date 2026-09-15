'use client';

import React from 'react';

interface HeaderProps {
  isLive: boolean;
  lastUpdated: string | null;
  totalRecords: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenHardwareModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isLive,
  lastUpdated,
  totalRecords,
  theme = 'dark',
  onToggleTheme,
  onOpenHardwareModal,
  onRefresh,
  isRefreshing,
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
        marginBottom: '2rem',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-glass)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: 'var(--shadow-glow-cyan)',
          }}
        >
          🌤️
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #f8fafc, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AeroPulse Weather Station
            </h1>
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
          </div>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginTop: '0.15rem',
            }}
          >
            Arduino Uno Telemetry &bull; Prisma 5 (SQLite) &bull;{' '}
            {totalRecords.toLocaleString()} logged readings
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        {lastUpdated && (
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '0.45rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glass)',
            }}
          >
            Last Ping: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
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
          >
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
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
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
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
            color: '#60a5fa',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '0.5rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            fontWeight: 500,
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
          📥 Export CSV
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
          ⚡ Arduino Setup
        </button>
      </div>
    </header>
  );
};
