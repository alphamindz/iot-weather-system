import { NextRequest } from 'next/server';
import { telemetryBus, getLatestReading } from '@/lib/liveBus';
import { prisma } from '@/lib/prisma';
import {
  syncLucknowTelemetryToDb,
  getLucknowLiveWeather,
  generateDynamicLucknowReading,
} from '@/lib/lucknowWeather';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const safeEnqueue = (payload: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          isClosed = true;
        }
      };

      // 1. Send initial current state immediately upon connection
      try {
        let cached = getLatestReading();
        if (!cached) {
          const syncResult = await syncLucknowTelemetryToDb(false);
          cached = syncResult.reading;
        }
        if (cached) {
          safeEnqueue(`event: reading\ndata: ${JSON.stringify(cached)}\n\n`);
        }
      } catch (err) {
        console.error('Initial SSE telemetry fetch error:', err);
      }

      // 2. Listener for incoming live readings (from Arduino or sync)
      const onReading = (reading: any) => {
        safeEnqueue(`event: reading\ndata: ${JSON.stringify(reading)}\n\n`);
      };

      telemetryBus.on('reading', onReading);

      // 3. Dynamic background pulse: ensures dashboard continues to stream live dynamic readings
      // anchored on real Lucknow weather every 5 seconds
      const livePulseInterval = setInterval(async () => {
        if (isClosed) return;
        try {
          // Sync or produce dynamic pulse
          await syncLucknowTelemetryToDb(false);
        } catch (err) {
          console.error('Error generating dynamic Lucknow SSE pulse:', err);
        }
      }, 8000);

      // 4. Heartbeat ping every 10 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        safeEnqueue(`: ping\n\n`);
      }, 10000);

      // Clean up when client disconnects
      req.signal.addEventListener('abort', () => {
        isClosed = true;
        telemetryBus.off('reading', onReading);
        clearInterval(livePulseInterval);
        clearInterval(pingInterval);
        try {
          controller.close();
        } catch { }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

