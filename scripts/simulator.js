/**
 * IoT Weather System - Realistic Weather Station Simulator
 * Generates realistic sensor readings matching the Arduino UNO sensors:
 * - DHT11 (Temperature & Humidity)
 * - Raindrop Sensor (Rain Value & Status)
 * - MQ-135 (Air Quality & Gas Value)
 * - UV Sensor (Raw, Voltage, and UV Index)
 * - IR Sensor (Proximity / Object detection)
 * 
 * Run with: npm run simulate
 */

const http = require('http');

const API_URL = process.env.APP_URL || 'http://localhost:3000';
const INTERVAL_MS = 2500;

console.log('====================================================');
console.log('  🌤️ IoT WEATHER STATION SENSOR SIMULATOR');
console.log('====================================================');
console.log(`Target: ${API_URL}/api/telemetry`);
console.log(`Streaming new simulated readings every ${INTERVAL_MS / 1000}s...\n`);

let step = 0;
let isRaining = false;
let rainCounter = 0;

function generateReading() {
  step += 0.1;

  // Temperature variation (base 26°C with smooth oscillation ± 3°C + noise)
  const tempBase = 26 + Math.sin(step * 0.3) * 3;
  const temperature = parseFloat((tempBase + (Math.random() * 0.8 - 0.4)).toFixed(1));

  // Humidity variation (inversely proportional to temp + noise)
  const humBase = 62 - Math.sin(step * 0.3) * 8;
  const humidity = parseFloat((humBase + (Math.random() * 1.5 - 0.75)).toFixed(1));

  // Rain event simulation (occasional rain shower for 8 cycles)
  rainCounter++;
  if (rainCounter > 25 && Math.random() < 0.2) {
    isRaining = true;
    rainCounter = 0;
  }
  if (isRaining && rainCounter > 8) {
    isRaining = false;
    rainCounter = 0;
  }

  const rainValue = isRaining ? Math.floor(200 + Math.random() * 180) : Math.floor(750 + Math.random() * 150);
  const rainStatus = rainValue < 500 ? 'RAIN DETECTED' : 'NO RAIN';

  // IR Obstacle Sensor (Mostly no object, occasional proximity trigger)
  const objectNearby = Math.random() < 0.12;
  const irValue = objectNearby ? 0 : 1;
  const irStatus = objectNearby ? 'OBJECT DETECTED' : 'NO OBJECT';

  // MQ-135 Gas sensor (100 - 350 AQI)
  const gasValue = Math.floor(130 + Math.sin(step * 0.15) * 60 + Math.random() * 30);
  let airQuality = 'GOOD';
  if (gasValue >= 400) airQuality = 'POOR';
  else if (gasValue >= 200) airQuality = 'MODERATE';

  // UV Sensor (Sunlight intensity, 0 - 8 Index)
  const uvRaw = Math.floor(180 + Math.max(0, Math.sin(step * 0.2)) * 320 + Math.random() * 20);
  const uvVoltage = parseFloat((uvRaw * (5.0 / 1023.0)).toFixed(2));
  const uvIndex = parseFloat((uvVoltage * 2.5).toFixed(2));

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
            `[${new Date().toLocaleTimeString()}] 📡 Temp: ${reading.temperature}°C | Hum: ${reading.humidity}% | Gas: ${reading.gasValue} (${reading.airQuality}) | UV: ${reading.uvIndex} | Rain: ${rainIcon}`
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
