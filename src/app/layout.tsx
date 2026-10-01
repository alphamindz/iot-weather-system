import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IND-SAFE-US | IoT Weather & Climate Station',
  description:
    'IND-SAFE-US - Real-time IoT meteorological and atmospheric telemetry dashboard for Lucknow, powered by Open-Meteo, Arduino Uno, Next.js, and Prisma 5 SQLite.',
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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('ind_safe_us_theme') || localStorage.getItem('aeropulse_theme') || 'dark';
                document.documentElement.setAttribute('data-theme', t);
                if (document.body) document.body.className = t;
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
