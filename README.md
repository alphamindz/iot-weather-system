# 🌤️ IND-SAFE-US - IoT Weather Monitoring System

A real-time meteorological telemetry web application built with **Next.js (App Router)**, **Prisma 5 (SQLite)**, and an **Arduino Uno** hardware sensor station.

---

## 🧰 Hardware & Sensor Stack

- **Microcontroller**: Arduino Uno (ATmega328P, USB Serial)
- **Temperature & Humidity**: DHT11 Digital Sensor (Pin 2)
- **Rain Sensor**: Raindrop sensor module (Analog A0, Digital Pin 3)
- **Air Quality**: MQ-135 Gas Sensor (Analog A1)
- **UV Radiation**: Analog UV Sensor (Analog A2)
- **Obstacle / Proximity**: Infrared IR Obstacle Sensor (Digital Pin 3)

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run in terminal:
```bash
npm install
```

### 2. Initialize the SQLite Database (Prisma 5)
Generate the Prisma Client and push the schema to `prisma/dev.db`:
```bash
npx prisma db push
```

### 3. Start the Next.js Development Server
Launch the frontend dashboard and backend API:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📡 Connecting Your Arduino Uno

### Option A: Direct Hardware Bridge (Arduino plugged into USB)
1. Verify the COM port of your Arduino Uno in Arduino IDE (e.g. `COM7`).
2. Make sure `.env` has your port:
   ```env
   SERIAL_PORT="COM7"
   SERIAL_BAUD="9600"
   ```
3. In a second terminal, launch the bridge:
   ```bash
   npm run bridge
   ```
   *The bridge reads serial data from your Arduino and posts it to `/api/telemetry`.*

### Option B: Real-Time Sensor Simulator (Test without hardware)
To test the live dashboard, trend charts, and real-time alerts without the physical Arduino plugged in:
```bash
npm run simulate
```
*Streams fluctuating weather readings every 2.5 seconds directly into the database and live dashboard.*

---

## 📂 Project Structure

```
├── docs/
│   ├── arduino_code.md         # Original Arduino sketch
│   └── arduino_code_json.ino   # Optimized dual-format sketch (JSON + text)
├── prisma/
│   └── schema.prisma           # Prisma 5 SQLite schema (SensorReading model)
├── scripts/
│   ├── serial-bridge.js        # Node.js USB Serial bridge worker
│   └── simulator.js            # Realistic sensor data feeder
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── telemetry/
│   │   │       ├── route.ts    # POST ingestion & GET query with stats
│   │   │       ├── live/       # Server-Sent Events (SSE) live push
│   │   │       └── export/     # CSV download endpoint
│   │   ├── globals.css         # Glassmorphic dark cyberpunk theme
│   │   ├── layout.tsx          # Root Next.js layout
│   │   └── page.tsx            # Real-time weather station dashboard
│   ├── components/
│   │   ├── Header.tsx          # Status, export, refresh & modal triggers
│   │   ├── MetricCard.tsx      # Reusable glassmorphic sensor cards
│   │   ├── AirQualityMeter.tsx # MQ-135 AQI gauge & health advice
│   │   ├── UVIndexMeter.tsx    # WHO solar radiation risk scale
│   │   ├── RainDetectorCard.tsx# Raindrop sensor & animated precipitation
│   │   ├── HistoryChart.tsx    # Interactive SVG time-series trends
│   │   ├── DataTable.tsx       # Live telemetry log viewer
│   │   └── HardwareModal.tsx   # Visual hardware connection guide
│   └── lib/
│       ├── prisma.ts           # Singleton Prisma 5 client
│       └── liveBus.ts          # In-memory real-time event bus
├── .env                        # Port and database configuration
└── package.json
```

---

## 🌐 API Endpoints

- `POST /api/telemetry`: Ingests sensor reading JSON into SQLite.
- `GET /api/telemetry?range=24h&limit=100`: Returns latest reading, time-series history, and min/max/avg summary statistics.
- `GET /api/telemetry/live`: Real-time Server-Sent Events (SSE) stream for instantaneous dashboard updates.
- `GET /api/telemetry/export`: Exports database records as `.csv`.
