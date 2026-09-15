import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AeroPulse | IoT Weather & Climate Station',
  description:
    'Real-time IoT meteorological and atmospheric telemetry dashboard powered by Arduino Uno, Next.js, and Prisma 5 SQLite.',
  keywords: [
    'IoT',
    'Weather Station',
    'Arduino Uno',
    'DHT11',
    'MQ135',
    'Rain Sensor',
    'UV Index',
    'Prisma',
    'SQLite',
    'Next.js',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
