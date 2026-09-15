import { EventEmitter } from 'events';

// Global singleton EventEmitter for real-time telemetry streaming across Next.js API routes
const globalForBus = globalThis as unknown as {
  telemetryBus: EventEmitter | undefined;
  latestReadingCache: any | null;
};

export const telemetryBus =
  globalForBus.telemetryBus ?? new EventEmitter();

telemetryBus.setMaxListeners(100);

if (process.env.NODE_ENV !== 'production') {
  globalForBus.telemetryBus = telemetryBus;
}

export function setLatestReading(reading: any) {
  globalForBus.latestReadingCache = reading;
  telemetryBus.emit('reading', reading);
}

export function getLatestReading() {
  return globalForBus.latestReadingCache;
}
