import { NextRequest } from 'next/server';
import { telemetryBus, getLatestReading } from '@/lib/liveBus';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send initial current state immediately upon connection
      try {
        const cached = getLatestReading();
        if (cached) {
          controller.enqueue(
            encoder.encode(`event: reading\ndata: ${JSON.stringify(cached)}\n\n`)
          );
        } else {
          const dbLatest = await prisma.sensorReading.findFirst({
            orderBy: { createdAt: 'desc' },
          });
          if (dbLatest) {
            controller.enqueue(
              encoder.encode(`event: reading\ndata: ${JSON.stringify(dbLatest)}\n\n`)
            );
          }
        }
      } catch (err) {
        console.error('Initial SSE telemetry fetch error:', err);
      }

      // 2. Listener for live incoming readings
      const onReading = (reading: any) => {
        try {
          controller.enqueue(
            encoder.encode(`event: reading\ndata: ${JSON.stringify(reading)}\n\n`)
          );
        } catch {
          // Stream might have closed
        }
      };

      telemetryBus.on('reading', onReading);

      // 3. Heartbeat ping every 10 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 10000);

      // Clean up when client disconnects
      req.signal.addEventListener('abort', () => {
        telemetryBus.off('reading', onReading);
        clearInterval(pingInterval);
        try {
          controller.close();
        } catch {}
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
