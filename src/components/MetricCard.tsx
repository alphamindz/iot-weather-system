'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
  accentColor?: string;
  secondaryText?: string;
  minVal?: number;
  maxVal?: number;
  avgVal?: number;
  statusBadge?: {
    text: string;
    type: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  accentColor = 'var(--accent-cyan)',
  secondaryText,
  minVal,
  maxVal,
  avgVal,
  statusBadge,
}) => {
  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--accent-emerald)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--accent-amber)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        };
      case 'danger':
        return {
          bg: 'rgba(244, 63, 94, 0.15)',
          color: 'var(--accent-rose)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
        };
      case 'info':
        return {
          bg: 'rgba(6, 182, 212, 0.15)',
          color: 'var(--accent-cyan)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.08)',
          color: 'var(--text-secondary)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        };
    }
  };

  const badgeStyle = statusBadge ? getBadgeStyle(statusBadge.type) : null;

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
      {/* Top ambient color glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />

      {/* Card Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
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
            {icon}
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
            {title}
          </span>
        </div>

        {statusBadge && badgeStyle && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: badgeStyle.bg,
              color: badgeStyle.color,
              border: badgeStyle.border,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {statusBadge.text}
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div style={{ margin: '0.5rem 0 1rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
          <span
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1,
            }}
          >
            {value}
          </span>
          {unit && (
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
              {unit}
            </span>
          )}
        </div>

        {secondaryText && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginTop: '0.35rem',
            }}
          >
            {secondaryText}
          </p>
        )}
      </div>

      {/* Min / Max / Avg footer stats */}
      {(minVal !== undefined || maxVal !== undefined || avgVal !== undefined) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '0.75rem',
            marginTop: '0.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {minVal !== undefined && (
            <div>
              <span>MIN: </span>
              <strong style={{ color: 'var(--text-secondary)' }}>
                {minVal}
                {unit}
              </strong>
            </div>
          )}
          {avgVal !== undefined && (
            <div>
              <span>AVG: </span>
              <strong style={{ color: 'var(--text-secondary)' }}>
                {avgVal}
                {unit}
              </strong>
            </div>
          )}
          {maxVal !== undefined && (
            <div>
              <span>MAX: </span>
              <strong style={{ color: 'var(--text-secondary)' }}>
                {maxVal}
                {unit}
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
