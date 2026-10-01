/**
 * IoT Weather System - Real Lucknow Weather Station Simulator & Telemetry Streamer
 * Grounded in authentic live Open-Meteo observations for Lucknow (26.8467° N, 80.9462° E):
 * - DHT11 (Temperature & Humidity)
 * - Raindrop Sensor (Rain Value & Status)
 * - MQ-135 (Air Quality & AQI)
 * - UV Sensor (Voltage and Solar UV Index)
 * - IR Sensor (Proximity / Beam detection)
 * 
 * Run with: npm run simulate
 */

const http = require('http');

const API_URL = process.env.APP_URL || 'http://localhost:3000';
const INTERVAL_MS = 3000;

console.log('====================================================');
console.log('  🌤️ LUCKNOW REAL IOT WEATHER STATION SIMULATOR');
console.log('  Coordinates: 26.8467° N, 80.9462° E (Uttar Pradesh)');
console.log('====================================================');
console.log(`Target: ${API_URL}/api/telemetry`);
console.log(`Streaming dynamic authentic Lucknow readings every ${INTERVAL_MS / 1000}s...\n`);

let lucknowBaseline = {
  temperature: 28.5,
  humidity: 73.0,
  aqi: 128,
  uvIndex: 4.2,
  precipitation: 0.0,
  condition: 'Clear Sky',
};

async function refreshLucknowBaseline() {
  try {
    const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=26.8467&longitude=80.9462&current=temperature_2m,relative_humidity_2m,precipitation,uv_index&timezone=Asia%2FKolkata';
    const aqiUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=26.8467&longitude=80.9462&current=us_aqi&timezone=Asia%2FKolkata';

    const [wRes, aqiRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(aqiUrl),
    ]);

    if (wRes.ok) {
      const wData = await wRes.json();
      const cur = wData.current || {};
      lucknowBaseline.temperature = Number(cur.temperature_2m ?? lucknowBaseline.temperature);
      lucknowBaseline.humidity = Number(cur.relative_humidity_2m ?? lucknowBaseline.humidity);
      lucknowBaseline.uvIndex = Number(cur.uv_index ?? lucknowBaseline.uvIndex);
      lucknowBaseline.precipitation = Number(cur.precipitation ?? 0.0);
    }

    if (aqiRes.ok) {
      const aqiData = await aqiRes.json();
      lucknowBaseline.aqi = Math.round(Number(aqiData?.current?.us_aqi ?? lucknowBaseline.aqi));
    }
  } catch (err) {
    // Keep current baseline on temporary network glitch
  }
}

// Refresh baseline from Open-Meteo every 3 minutes
refreshLucknowBaseline();
setInterval(refreshLucknowBaseline, 180000);

let step = 0;

function generateReading() {
  step += 0.1;

  // Real Lucknow temperature with natural dynamic micro-jitter (±0.15°C)
  const tempNoise = Math.sin(step * 0.4) * 0.15 + (Math.random() * 0.08 - 0.04);
  const temperature = parseFloat((lucknowBaseline.temperature + tempNoise).toFixed(1));

  // Real Lucknow humidity with natural dynamic micro-jitter (±0.4%)
  const humNoise = -Math.sin(step * 0.4) * 0.4 + (Math.random() * 0.2 - 0.1);
  const humidity = parseFloat((Math.min(100, Math.max(10, lucknowBaseline.humidity + humNoise))).toFixed(1));

  // Rain status based on true Lucknow precipitation
  const isRaining = lucknowBaseline.precipitation > 0;
  const rainValue = isRaining
    ? Math.max(120, Math.round(500 - lucknowBaseline.precipitation * 40 + Math.random() * 20))
    : Math.floor(860 + Math.random() * 40);
  const rainStatus = isRaining ? 'RAIN DETECTED' : 'NO RAIN';

  // IR Obstacle Sensor
  const objectNearby = Math.random() < 0.05;
  const irValue = objectNearby ? 0 : 1;
  const irStatus = objectNearby ? 'OBJECT DETECTED' : 'NO OBJECT';

  // MQ-135 Gas sensor anchored on Lucknow true AQI
  const gasNoise = Math.round(Math.sin(step * 0.2) * 4 + (Math.random() * 4 - 2));
  const gasValue = Math.max(20, lucknowBaseline.aqi + gasNoise);

  let airQuality = 'MODERATE';
  if (gasValue <= 50) airQuality = 'GOOD';
  else if (gasValue <= 100) airQuality = 'GOOD';
  else if (gasValue <= 200) airQuality = 'MODERATE';
  else if (gasValue <= 300) airQuality = 'POOR';
  else airQuality = 'VERY POOR';

  // UV Sensor anchored on Lucknow true solar UV
  const uvNoise = (Math.random() * 0.08 - 0.04);
  const uvIndex = Math.max(0, parseFloat((lucknowBaseline.uvIndex + uvNoise).toFixed(1)));
  const uvVoltage = parseFloat((uvIndex / 2.5).toFixed(2));
  const uvRaw = Math.round(uvVoltage * (1023 / 5.0));

  return {
    temperature,
    humidity,
    rainValue,
    rainStatus,
    irValue,
    irStatus,
    gasValue,
    airQuality,
    uvRaw,
    uvVoltage,
    uvIndex,
  };
}

function sendReading() {
  const reading = generateReading();
  const data = JSON.stringify(reading);
  const url = new URL('/api/telemetry', API_URL);

  const req = http.request(
    {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 3000,
    },
    (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const rainIcon = reading.rainStatus === 'RAIN DETECTED' ? '🌧️ RAINING' : '☀️ DRY';
          console.log(
            `[${new Date().toLocaleTimeString()}] 📍 Lucknow | Temp: ${reading.temperature}°C | Hum: ${reading.humidity}% | AQI: ${reading.gasValue} (${reading.airQuality}) | UV: ${reading.uvIndex} | Rain: ${rainIcon}`
          );
        } else {
          console.log(`[!] Status ${res.statusCode}: ${body}`);
        }
      });
    }
  );

  req.on('error', (err) => {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Failed to connect to Next.js API: ${err.message}`);
    console.log('   Ensure the web app is running in another terminal: npm run dev');
  });

  req.write(data);
  req.end();
}

// Initial reading then continuous loop
sendReading();
setInterval(sendReading, INTERVAL_MS);
