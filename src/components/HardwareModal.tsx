'use client';

import React, { useState } from 'react';

interface HardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareModal: React.FC<HardwareModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, tabId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const bridgeCmd = 'npm run bridge';
  const simulateCmd = 'npm run simulate';
  const prismaCmd = 'npx prisma db push';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          backgroundColor: 'var(--modal-bg)',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-card)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>⚡</span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Arduino Uno & Hardware Connection Guide
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Connecting your serial sensors to the Next.js + SQLite backend
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--item-bg)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-secondary)',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Step 1 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4
            style={{
              fontSize: '0.9rem',
              color: 'var(--accent-cyan)',
              marginBottom: '0.4rem',
              fontWeight: 600,
            }}
          >
            Step 1: Run SQLite Database Migration
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Initialize the SQLite database (`dev.db`) using Prisma 5:
          </p>
          <div
            style={{
              background: 'var(--code-bg)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
            }}
          >
            <code>{prismaCmd}</code>
            <button
              onClick={() => copyToClipboard(prismaCmd, 'prisma')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              {copiedTab === 'prisma' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4
            style={{
              fontSize: '0.9rem',
              color: 'var(--accent-emerald)',
              marginBottom: '0.4rem',
              fontWeight: 600,
            }}
          >
            Step 2: Start the Serial Bridge (Hardware Connected)
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Plug in your Arduino Uno via USB. In a new terminal, launch the serial bridge worker:
          </p>
          <div
            style={{
              background: 'var(--code-bg)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
            }}
          >
            <code>{bridgeCmd}</code>
            <button
              onClick={() => copyToClipboard(bridgeCmd, 'bridge')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              {copiedTab === 'bridge' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Note: Default port is configured in <code>.env</code> (e.g. <code>SERIAL_PORT=&quot;COM7&quot;</code>).
          </p>
        </div>

        {/* Step 3 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4
            style={{
              fontSize: '0.9rem',
              color: 'var(--accent-amber)',
              marginBottom: '0.4rem',
              fontWeight: 600,
            }}
          >
            Alternative: Real-Time Sensor Simulator
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            To test without physical Arduino hardware, run the realistic weather generator:
          </p>
          <div
            style={{
              background: 'var(--code-bg)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
            }}
          >
            <code>{simulateCmd}</code>
            <button
              onClick={() => copyToClipboard(simulateCmd, 'simulate')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              {copiedTab === 'simulate' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Arduino Sketch File Link */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            📄 Arduino Sketches Available in Project:
          </p>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
            <li>
              <code>docs/arduino_code.md</code>: Your original sketch (fully supported).
            </li>
            <li>
              <code>docs/arduino_code_json.ino</code>: Optimized sketch with high-speed JSON line streaming.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
