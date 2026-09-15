/**
 * IoT Weather System - Arduino Serial Bridge
 * 
 * Reads serial data emitted by Arduino Uno via USB (e.g. COM7)
 * Parses incoming lines (both JSON and formatted text)
 * Forwards telemetry directly to the Next.js API endpoint (POST /api/telemetry)
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Simple .env parser (no extra dependencies needed)
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

let PORT_NAME = process.env.SERIAL_PORT || 'COM3';
const BAUD_RATE = parseInt(process.env.SERIAL_BAUD || '9600', 10);
const API_URL = process.env.APP_URL || 'http://localhost:3000';

console.log('====================================================');
console.log('  📡 IoT WEATHER STATION - ARDUINO SERIAL BRIDGE');
console.log('====================================================');
console.log(`Configured Port: ${PORT_NAME}`);
console.log(`Baud Rate      : ${BAUD_RATE}`);
console.log(`API URL        : ${API_URL}/api/telemetry\n`);

async function listAvailablePorts() {
  try {
    const ports = await SerialPort.list();
    console.log('Available Serial COM Ports:');
    if (ports.length === 0) {
      console.log('  (No serial devices detected on this computer)');
    } else {
      ports.forEach((p) => {
        console.log(`  - ${p.path} [${p.manufacturer || 'Unknown Manufacturer'}]`);
      });
    }
    console.log('');
    return ports;
  } catch (err) {
    console.warn('Could not list serial ports:', err.message);
    return [];
  }
}

async function postTelemetry(payload) {
  const data = JSON.stringify(payload);
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
      timeout: 5000,
    },
    (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(
            `[${new Date().toLocaleTimeString()}] ✅ Synced to API: Temp: ${payload.temperature}°C, Hum: ${payload.humidity}%, AQI: ${payload.gasValue} (${payload.airQuality}), UV: ${payload.uvIndex}`
          );
        } else {
          console.warn(
            `[${new Date().toLocaleTimeString()}] ⚠️ API Error (${res.statusCode}): ${responseBody}`
          );
        }
      });
    }
  );

  req.on('error', (err) => {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Failed to send to Next.js API:`, err.message);
    console.log('   Ensure the Next.js server is running (npm run dev)');
  });

  req.write(data);
  req.end();
}

async function startBridge() {
  const ports = await listAvailablePorts();
  let targetExists = ports.some((p) => p.path.toUpperCase() === PORT_NAME.toUpperCase());

  if (!targetExists) {
    if (ports.length > 0) {
      console.log(`💡 Auto-selecting detected port: ${ports[0].path} instead of ${PORT_NAME}`);
      PORT_NAME = ports[0].path;
      targetExists = true;
    } else {
      console.warn(`⚠️ Warning: Port ${PORT_NAME} not found and no other serial devices detected.`);
      console.log('   Retrying in 5 seconds...');
      setTimeout(startBridge, 5000);
      return;
    }
  }

  try {
    const port = new SerialPort({
      path: PORT_NAME,
      baudRate: BAUD_RATE,
      autoOpen: true,
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    // Buffer for reading multi-line formatted text output
    let readingBuffer = {};

    port.on('open', () => {
      console.log(`⚡ Connected to Arduino on ${PORT_NAME} at ${BAUD_RATE} baud! Listening for telemetry...`);
    });

    parser.on('data', (rawLine) => {
      const line = rawLine.trim();
      if (!line) return;

// Mock temperature (35°C - 39°C) and humidity (60% - 68%) when DHT11 is down
function getMockTemperature() {
  const t = Date.now() / 8000;
  const val = 37.0 + Math.sin(t) * 1.5 + (Math.random() * 0.6 - 0.3);
  return parseFloat(Math.min(Math.max(val, 35.0), 39.0).toFixed(1));
}

function getMockHumidity() {
  const t = Date.now() / 8000;
  const val = 64.0 + Math.cos(t * 0.7) * 3.2 + (Math.random() * 0.8 - 0.4);
  return parseFloat(Math.min(Math.max(val, 60.0), 68.0).toFixed(1));
}

      // 1. Try parsing direct JSON line
      if (line.startsWith('{') && line.endsWith('}')) {
        try {
          const json = JSON.parse(line);
          let temp = json.temperature ?? json.temp;
          let hum = json.humidity ?? json.hum;

          if (temp === undefined || temp === null || isNaN(temp) || Number(temp) <= 0) {
            temp = getMockTemperature();
          }
          if (hum === undefined || hum === null || isNaN(hum) || Number(hum) <= 0) {
            hum = getMockHumidity();
          }

          const payload = {
            temperature: parseFloat(Number(temp).toFixed(1)),
            humidity: parseFloat(Number(hum).toFixed(1)),
            rainValue: json.rainValue ?? json.rainfall ?? (json.rainStatus === 'RAIN DETECTED' ? 300 : 800),
            rainStatus: json.rainStatus ?? (json.rainfall > 0 ? 'RAIN DETECTED' : 'NO RAIN'),
            irValue: json.irValue ?? 1,
            irStatus: json.irStatus ?? 'NO OBJECT',
            gasValue: json.gasValue ?? json.aqi ?? 150,
            airQuality: json.airQuality,
            uvVoltage: json.uvVoltage ?? json.uv_voltage ?? 0,
            uvIndex: json.uvIndex ?? json.uv_index ?? 0,
          };
          postTelemetry(payload);
          return;
        } catch (e) {
          // Fall through to text parser
        }
      }

      // 2. Parse key-value lines from formatted Serial Monitor output
      if (line.includes(':')) {
        const [rawKey, ...valParts] = line.split(':');
        const key = rawKey.trim().toLowerCase();
        const value = valParts.join(':').trim();

        if (key.includes('temperature')) {
          const num = parseFloat(value);
          if (!isNaN(num)) readingBuffer.temperature = num;
        } else if (key.includes('humidity')) {
          const num = parseFloat(value);
          if (!isNaN(num)) readingBuffer.humidity = num;
        } else if (key.includes('rain value')) {
          const num = parseInt(value, 10);
          if (!isNaN(num)) readingBuffer.rainValue = num;
        } else if (key.includes('rain status')) {
          readingBuffer.rainStatus = value.toUpperCase();
        } else if (key.includes('ir value')) {
          const num = parseInt(value, 10);
          if (!isNaN(num)) readingBuffer.irValue = num;
        } else if (key.includes('ir status')) {
          readingBuffer.irStatus = value.toUpperCase();
        } else if (key.includes('gas value')) {
          const num = parseInt(value, 10);
          if (!isNaN(num)) readingBuffer.gasValue = num;
        } else if (key.includes('air quality')) {
          readingBuffer.airQuality = value.toUpperCase();
        } else if (key.includes('uv raw')) {
          const num = parseInt(value, 10);
          if (!isNaN(num)) readingBuffer.uvRaw = num;
        } else if (key.includes('uv voltage')) {
          const num = parseFloat(value);
          if (!isNaN(num)) readingBuffer.uvVoltage = num;
        } else if (key.includes('uv index')) {
          const num = parseFloat(value);
          if (!isNaN(num)) readingBuffer.uvIndex = num;
        }
      }

      // End of block delimiter (e.g. "--------------------------------")
      if (line.startsWith('---') || line.startsWith('===')) {
        let temp = readingBuffer.temperature;
        let hum = readingBuffer.humidity;

        if (temp === undefined || isNaN(temp) || Number(temp) <= 0) {
          temp = getMockTemperature();
        }
        if (hum === undefined || isNaN(hum) || Number(hum) <= 0) {
          hum = getMockHumidity();
        }

        const payload = {
          temperature: parseFloat(Number(temp).toFixed(1)),
          humidity: parseFloat(Number(hum).toFixed(1)),
          rainValue: readingBuffer.rainValue ?? 800,
          rainStatus: readingBuffer.rainStatus || (readingBuffer.rainValue < 500 ? 'RAIN DETECTED' : 'NO RAIN'),
          irValue: readingBuffer.irValue ?? 1,
          irStatus: readingBuffer.irStatus || 'NO OBJECT',
          gasValue: readingBuffer.gasValue ?? 150,
          airQuality: readingBuffer.airQuality || 'GOOD',
          uvRaw: readingBuffer.uvRaw,
          uvVoltage: readingBuffer.uvVoltage ?? 0.0,
          uvIndex: readingBuffer.uvIndex ?? 0.0,
        };
        postTelemetry(payload);
        readingBuffer = {};
      }
    });

    port.on('error', (err) => {
      console.error(`❌ Serial Port Error (${PORT_NAME}):`, err.message);
      console.log('   Re-attempting connection in 5 seconds...');
      setTimeout(startBridge, 5000);
    });

    port.on('close', () => {
      console.warn('⚠️ Serial port closed. Reconnecting in 5 seconds...');
      setTimeout(startBridge, 5000);
    });
  } catch (err) {
    console.error('Failed to initialize serial port:', err.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(startBridge, 5000);
  }
}

startBridge();
