'use client';

import React from 'react';
import {
  CloudSunIcon,
  MapPinIcon,
  ZapIcon,
  SunIcon,
  MoonIcon,
  RefreshCwIcon,
  DownloadIcon,
  CpuIcon,
} from './Icons';

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
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            flexShrink: 0,
          }}
        >
          <CloudSunIcon size={26} color="#ffffff" strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-display)',
                background: 'var(--heading-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              IND-SAFE-US Weather Station
            </h1>

            {/* Live Indicator */}
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '0.2rem 0.6rem',
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
              {isLive ? 'LIVE TELEMETRY' : 'STANDBY'}
            </span>

            {/* Location Pill */}
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                padding: '0.22rem 0.65rem',
                borderRadius: '9999px',
                background: 'rgba(6, 182, 212, 0.12)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <MapPinIcon size={13} color="var(--accent-cyan)" strokeWidth={2.4} />
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
            <span>High-Precision Open-Meteo API &bull; Arduino Uno Hardware Sensor Array</span>
            <span>&bull;</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{totalRecords.toLocaleString()} logged packets</span>
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
            id="sync-lucknow-btn"
            title="Fetch immediate real-time weather update for Lucknow from Open-Meteo"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 700,
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
                display: 'inline-flex',
                transform: isSyncing ? 'rotate(360deg)' : 'none',
                transition: isSyncing ? 'transform 0.8s linear infinite' : 'none',
              }}
            >
              <ZapIcon size={14} color="var(--accent-emerald)" strokeWidth={2.4} />
            </span>
            {isSyncing ? 'Syncing...' : 'Sync Lucknow'}
          </button>
        )}

        {/* Theme Toggle Pill Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            id="theme-toggle-btn"
            title={`Switch to ${theme === 'dark' ? 'Light Mode' : 'Dark Mode'}`}
            style={{
              background:
                theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              color: theme === 'dark' ? '#f8fafc' : '#92400e',
              border:
                theme === 'dark'
                  ? '1px solid var(--border-glass)'
                  : '1px solid rgba(245, 158, 11, 0.45)',
              padding: '0.48rem 0.9rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow:
                theme === 'dark'
                  ? 'none'
                  : '0 2px 10px rgba(245, 158, 11, 0.25)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              if (theme === 'dark') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              if (theme === 'dark') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }
            }}
          >
            {theme === 'dark' ? (
              <SunIcon size={15} color="#f59e0b" strokeWidth={2.4} />
            ) : (
              <MoonIcon size={15} color="#92400e" strokeWidth={2.4} />
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          id="refresh-telemetry-btn"
          style={{
            background: 'var(--item-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-glass)',
            padding: '0.5rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            fontWeight: 600,
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
              display: 'inline-flex',
              transform: isRefreshing ? 'rotate(360deg)' : 'none',
              transition: isRefreshing ? 'transform 0.8s linear infinite' : 'none',
            }}
          >
            <RefreshCwIcon size={14} color="currentColor" strokeWidth={2.2} />
          </span>
          Refresh
        </button>

        {/* Export CSV Button */}
        <a
          href="/api/telemetry/export"
          download
          id="export-csv-btn"
          style={{
            background: 'rgba(59, 130, 246, 0.12)',
            color: 'var(--accent-blue)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '0.5rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)';
          }}
        >
          <DownloadIcon size={14} color="var(--accent-blue)" strokeWidth={2.2} />
          CSV
        </a>

        {/* Arduino Setup Button */}
        <button
          onClick={onOpenHardwareModal}
          id="hardware-setup-btn"
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            fontWeight: 700,
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
          <CpuIcon size={15} color="#ffffff" strokeWidth={2.2} />
          Hardware Setup
        </button>
      </div>
    </header>
  );
};
