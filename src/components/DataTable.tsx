'use client';

import React from 'react';
import { TableIcon } from './Icons';

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
  uvVoltage: number;
  uvIndex: number;
  createdAt: string;
}

interface DataTableProps {
  readings: Reading[];
}

export const DataTable: React.FC<DataTableProps> = ({ readings }) => {
  if (!readings || readings.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        No telemetry records logged yet.
      </div>
    );
  }

  // Display most recent readings at the top of the table
  const displayList = [...readings].reverse().slice(0, 15);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.75rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--item-bg)',
              border: '1px solid var(--border-glass)',
              color: 'var(--accent-blue)',
            }}
          >
            <TableIcon size={18} color="var(--accent-blue)" strokeWidth={2.2} />
          </span>
          <div>
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Live Telemetry Log
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Showing latest {displayList.length} sensor packets received by API
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            background: 'var(--item-bg)',
            padding: '0.3rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid var(--border-glass)',
          }}
        >
          Total in DB: {readings.length}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-glass)',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '0.75rem 1rem' }}>Time</th>
              <th style={{ padding: '0.75rem 1rem' }}>Temp</th>
              <th style={{ padding: '0.75rem 1rem' }}>Humidity</th>
              <th style={{ padding: '0.75rem 1rem' }}>Rain Sensor</th>
              <th style={{ padding: '0.75rem 1rem' }}>Air Quality</th>
              <th style={{ padding: '0.75rem 1rem' }}>Solar UV</th>
              <th style={{ padding: '0.75rem 1rem' }}>IR Status</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map((row) => {
              const isRaining = row.rainStatus?.toUpperCase().includes('RAIN') && !row.rainStatus?.toUpperCase().includes('NO RAIN');
              const isObject = row.irStatus?.toUpperCase().includes('OBJECT') && !row.irStatus?.toUpperCase().includes('NO OBJECT');

              return (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid var(--border-glass)',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--item-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                    {new Date(row.createdAt).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    {row.temperature.toFixed(1)}°C
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--accent-blue)' }}>
                    {row.humidity.toFixed(1)}%
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: isRaining
                          ? 'rgba(6, 182, 212, 0.15)'
                          : 'var(--item-bg)',
                        color: isRaining ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      }}
                    >
                      {row.rainValue} ({row.rainStatus})
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background:
                          row.airQuality === 'GOOD'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : row.airQuality === 'MODERATE'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(244, 63, 94, 0.15)',
                        color:
                          row.airQuality === 'GOOD'
                            ? 'var(--accent-emerald)'
                            : row.airQuality === 'MODERATE'
                            ? 'var(--accent-amber)'
                            : 'var(--accent-rose)',
                      }}
                    >
                      {row.gasValue} &bull; {row.airQuality}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--accent-purple)' }}>
                    {row.uvIndex.toFixed(1)} UV ({row.uvVoltage.toFixed(2)}V)
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: isObject
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'var(--item-bg)',
                        color: isObject ? 'var(--accent-amber)' : 'var(--text-muted)',
                      }}
                    >
                      {row.irStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
