/**
 * Standalone Lucknow Weather Sync Script
 * Fetches real-time weather and air quality for Lucknow and posts to Next.js API
 * Run with: npm run sync:lucknow
 */

const http = require('http');

const API_URL = process.env.APP_URL || 'http://localhost:3000';

async function syncLucknow() {
  console.log('[Lucknow Sync] Triggering real weather sync via Next.js API...');
  const url = new URL('/api/telemetry?sync=true', API_URL);

  const req = http.get(url, (res) => {
    let body = '';
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.success) {
          console.log('✅ Lucknow Weather Synced Successfully!');
          console.log(`📍 Location: ${data.location?.displayName}`);
          console.log(`🌤️ Condition: ${data.weatherMeta?.condition} ${data.weatherMeta?.conditionIcon}`);
          console.log(`🌡️ Temperature: ${data.latest?.temperature}°C (Feels like ${data.weatherMeta?.apparentTemperature}°C)`);
          console.log(`💧 Humidity: ${data.latest?.humidity}%`);
          console.log(`🍃 Air Quality: ${data.latest?.gasValue} AQI (${data.latest?.airQuality}) | PM2.5: ${data.weatherMeta?.pm25} µg/m³`);
          console.log(`☀️ UV Index: ${data.latest?.uvIndex}`);
          console.log(`🧭 Pressure: ${data.weatherMeta?.pressure} hPa | Wind: ${data.weatherMeta?.windSpeed} km/h ${data.weatherMeta?.windDirection}`);
          console.log(`📊 Logged Packets: ${data.totalCount}`);
        } else {
          console.error('❌ Sync failed:', data);
        }
      } catch (e) {
        console.error('❌ Failed to parse response:', e.message);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`❌ Connection error: ${err.message}. Ensure Next.js dev server is running (npm run dev).`);
  });
}

syncLucknow();
