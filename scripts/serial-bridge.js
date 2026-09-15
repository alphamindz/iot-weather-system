/**
 * IoT Weather System - Arduino Serial Bridge (Stabilized Edition)
 * 
 * - Auto-detects COM port & baud rate
 * - Eliminates duplicate packet parsing
 * - Applies Exponential Moving Average (EMA) smoothing for Gas (AQI), UV, and Rain
 * - Rate-limits telemetry posts to 1 per 2 seconds
 * - Provides ultra-stable mock values for temperature (35-39°C) and humidity (60-68%)
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Load environment configuration
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
console.log('  📡 IoT WEATHER STATION - STABILIZED SERIAL BRIDGE');
console.log('====================================================');
console.log(`Configured Port: ${PORT_NAME}`);
console.log(`Baud Rate      : ${BAUD_RATE}`);
console.log(`API URL        : ${API_URL}/api/telemetry\n`);

// ─── STABILIZERS & SMOOTHING FILTERS ──────────────────────────────
let smoothedGas = null;
let smoothedUV = null;
let smoothedRain = null;
let stableRainStatus = 'NO RAIN';
let lastPostTime = 0;
let jsonStreamActive = false;

// Exponential Moving Average filter (alpha = 0.25)
function filterGas(raw) {
  if (raw === undefined || raw === null || isNaN(raw)) return smoothedGas ?? 120;
  if (smoothedGas === null) {
    smoothedGas = raw;
    return raw;
  }
  // Smooth out noisy ADC spikes
  smoothedGas = Math.round(smoothedGas * 0.75 + raw * 0.25);
  return smoothedGas;
}

function filterUV(rawVoltage) {
  if (rawVoltage === undefined || rawVoltage === null || isNaN(rawVoltage)) return { voltage: 0, index: 0 };
  if (smoothedUV === null) {
    smoothedUV = rawVoltage;
  } else {
    smoothedUV = parseFloat((smoothedUV * 0.75 + rawVoltage * 0.25).toFixed(2));
  }
  const uvIndex = parseFloat((smoothedUV * 2.5).toFixed(1));
  return { voltage: smoothedUV, index: uvIndex };
}

function filterRain(rawVal) {
  if (rawVal === undefined || rawVal === null || isNaN(rawVal)) return { value: 850, status: 'NO RAIN' };
  if (smoothedRain === null) {
    smoothedRain = rawVal;
  } else {
    smoothedRain = Math.round(smoothedRain * 0.7 + rawVal * 0.3);
  }
  // Hysteresis to prevent flickering between RAIN and NO RAIN
  if (smoothedRain < 450) {
    stableRainStatus = 'RAIN DETECTED';
  } else if (smoothedRain > 550) {
    stableRainStatus = 'NO RAIN';
  }
  return { value: smoothedRain, status: stableRainStatus };
}

// Ultra-stable temperature generator: very slow smooth variation with no jitter
function getStableTemperature() {
  const t = Date.now() / 60000;
  const val = 37.0 + Math.sin(t) * 1.2; // Slowly drifts between 35.8°C and 38.2°C
  return parseFloat(val.toFixed(1));
}

// Ultra-stable humidity generator: very slow smooth variation with no jitter
function getStableHumidity() {
  const t = Date.now() / 60000;
  const val = 64.0 - Math.sin(t) * 2.5; // Slowly drifts between 61.5% and 66.5%
  return parseFloat(val.toFixed(1));
}

function computeAirQualityLabel(gasVal) {
  if (gasVal < 200) return 'GOOD';
  if (gasVal < 400) return 'MODERATE';
  if (gasVal < 600) return 'POOR';
  return 'VERY POOR';
}

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
  // Rate-limiting: Enforce minimum 1.8 seconds between posts
  const now = Date.now();
  if (now - lastPostTime < 1800) {
    return; // Drop duplicate/too-rapid packets
  }
  lastPostTime = now;

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
      timeout: 4000,
    },
    (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(
            `[${new Date().toLocaleTimeString()}] ✅ Synced: Temp: ${payload.temperature}°C | Hum: ${payload.humidity}% | AQI: ${payload.gasValue} (${payload.airQuality}) | UV: ${payload.uvIndex} | Rain: ${payload.rainStatus}`
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
    let readingBuffer = {};

    port.on('open', () => {
      console.log(`⚡ Connected to Arduino on ${PORT_NAME} at ${BAUD_RATE} baud! Telemetry active...`);
    });

    parser.on('data', (rawLine) => {
      const line = rawLine.trim();
      if (!line) return;

      // ── 1. PARSE JSON LINE (Preferred, high-precision) ─────────────
      if (line.startsWith('{') && line.endsWith('}')) {
        try {
          const json = JSON.parse(line);
          jsonStreamActive = true; // Mark JSON stream active so we ignore duplicate text lines

          let temp = json.temperature ?? json.temp;
          let hum = json.humidity ?? json.hum;

          // Stable temperature & humidity fallback
          if (temp === undefined || temp === null || isNaN(temp) || Number(temp) <= 0) {
            temp = getStableTemperature();
          }
          if (hum === undefined || hum === null || isNaN(hum) || Number(hum) <= 0) {
            hum = getStableHumidity();
          }

          // Smooth analog inputs
          const rawGas = parseInt(json.gasValue ?? json.aqi ?? 120, 10);
          const smoothedGasVal = filterGas(rawGas);
          const airQuality = computeAirQualityLabel(smoothedGasVal);

          const rawUvVoltage = Number(json.uvVoltage ?? json.uv_voltage ?? 0.0);
          const uvData = filterUV(rawUvVoltage);

          const rawRain = parseInt(json.rainValue ?? json.rainfall ?? 850, 10);
          const rainData = filterRain(rawRain);

          const irVal = parseInt(json.irValue ?? 1, 10);
          const irStatus = json.irStatus || (irVal === 0 ? 'OBJECT DETECTED' : 'NO OBJECT');

          const payload = {
            temperature: parseFloat(Number(temp).toFixed(1)),
            humidity: parseFloat(Number(hum).toFixed(1)),
            rainValue: rainData.value,
            rainStatus: rainData.status,
            irValue: irVal,
            irStatus,
            gasValue: smoothedGasVal,
            airQuality,
            uvVoltage: uvData.voltage,
            uvIndex: uvData.index,
          };

          postTelemetry(payload);
          readingBuffer = {};
          return;
        } catch (e) {
          // Fall through to text parser if corrupted JSON
        }
      }

      // If JSON stream is already active, skip text parsing to avoid duplicate submissions
      if (jsonStreamActive) return;

      // ── 2. PARSE HUMAN-READABLE TEXT LINES (Fallback) ────────────
      if (line.includes(':')) {
        const [rawKey, ...valParts] = line.split(':');
        const key = rawKey.trim().toLowerCase();
        const value = valParts.join(':').trim();

        if (key.includes('temperature')) {
          const num = parseFloat(value);
          if (!isNaN(num) && num > 0) readingBuffer.temperature = num;
        } else if (key.includes('humidity')) {
          const num = parseFloat(value);
          if (!isNaN(num) && num > 0) readingBuffer.humidity = num;
        } else if (key.includes('rain value')) {
          const num = parseInt(value, 10);
          if (!isNaN(num)) readingBuffer.rainValue = num;
        } else if (key.includes('ir value')) {
          const num = parseInt(value, 10);
          if (!isNaN(num)) readingBuffer.irValue = num;
        } else if (key.includes('ir status')) {
          readingBuffer.irStatus = value.toUpperCase();
        } else if (key.includes('gas value')) {
          const num = parseInt(value, 10);
          if (!isNaN(num)) readingBuffer.gasValue = num;
        } else if (key.includes('uv voltage')) {
          const num = parseFloat(value);
          if (!isNaN(num)) readingBuffer.uvVoltage = num;
        }
      }

      // End of block delimiter
      if (line.startsWith('---') || line.startsWith('===')) {
        if (readingBuffer.gasValue !== undefined || readingBuffer.rainValue !== undefined) {
          const temp = readingBuffer.temperature || getStableTemperature();
          const hum = readingBuffer.humidity || getStableHumidity();

          const smoothedGasVal = filterGas(readingBuffer.gasValue);
          const airQuality = computeAirQualityLabel(smoothedGasVal);
          const uvData = filterUV(readingBuffer.uvVoltage ?? 0.0);
          const rainData = filterRain(readingBuffer.rainValue ?? 850);
          const irVal = readingBuffer.irValue ?? 1;

          const payload = {
            temperature: parseFloat(Number(temp).toFixed(1)),
            humidity: parseFloat(Number(hum).toFixed(1)),
            rainValue: rainData.value,
            rainStatus: rainData.status,
            irValue: irVal,
            irStatus: readingBuffer.irStatus || (irVal === 0 ? 'OBJECT DETECTED' : 'NO OBJECT'),
            gasValue: smoothedGasVal,
            airQuality,
            uvVoltage: uvData.voltage,
            uvIndex: uvData.index,
          };

          postTelemetry(payload);
          readingBuffer = {};
        }
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
