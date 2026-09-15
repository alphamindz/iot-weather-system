/*
  IoT Weather Monitoring Station
  Hardware: Arduino Uno (ATmega328P), DHT11, MQ-135, Raindrop Sensor, UV Sensor, IR Sensor
  
  Dual Output Mode:
  1. Human-readable text for standard Serial Monitor inspection
  2. Single-line JSON format for high-speed automated ingestion by the Next.js Serial Bridge
*/

#include <DHT.h>

// -------------------------
// PIN CONFIGURATION
// -------------------------
#define DHT_PIN 2
#define DHT_TYPE DHT11

#define IR_PIN 3
#define RAIN_PIN A0
#define MQ135_PIN A1
#define UV_PIN A2

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  // Use 9600 baud (or 115200 if preferred, match in .env)
  Serial.begin(9600);

  dht.begin();
  pinMode(IR_PIN, INPUT);

  Serial.println("================================");
  Serial.println("   IOT WEATHER MONITORING STATION");
  Serial.println("================================");
  Serial.println("System Initialized & Ready");
  Serial.println();

  delay(1500);
}

void loop() {
  // 1. DHT11 Reading
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Fallback for sensor read errors
  bool dhtError = false;
  if (isnan(temperature) || isnan(humidity)) {
    dhtError = true;
    temperature = 0.0;
    humidity = 0.0;
  }

  // 2. Rain Sensor Reading (Analog)
  int rainValue = analogRead(RAIN_PIN);
  String rainStatus = (rainValue < 500) ? "RAIN DETECTED" : "NO RAIN";

  // 3. IR Sensor Reading (Digital)
  int irValue = digitalRead(IR_PIN);
  String irStatus = (irValue == LOW) ? "OBJECT DETECTED" : "NO OBJECT";

  // 4. MQ-135 Gas Sensor Reading
  int gasValue = analogRead(MQ135_PIN);
  String airQuality;
  if (gasValue < 200) {
    airQuality = "GOOD";
  } else if (gasValue < 400) {
    airQuality = "MODERATE";
  } else if (gasValue < 600) {
    airQuality = "POOR";
  } else {
    airQuality = "VERY POOR";
  }

  // 5. UV Sensor Reading
  int uvRaw = analogRead(UV_PIN);
  float uvVoltage = uvRaw * (5.0 / 1023.0);
  float uvIndex = uvVoltage * 2.5;

  // -------------------------------------------------------------
  // OUTPUT 1: Clean JSON line (Parsed instantly by Serial Bridge)
  // -------------------------------------------------------------
  Serial.print("{\"temperature\":");
  Serial.print(temperature, 2);
  Serial.print(",\"humidity\":");
  Serial.print(humidity, 2);
  Serial.print(",\"rainValue\":");
  Serial.print(rainValue);
  Serial.print(",\"rainStatus\":\"");
  Serial.print(rainStatus);
  Serial.print("\",\"irValue\":");
  Serial.print(irValue);
  Serial.print(",\"irStatus\":\"");
  Serial.print(irStatus);
  Serial.print("\",\"gasValue\":");
  Serial.print(gasValue);
  Serial.print(",\"airQuality\":\"");
  Serial.print(airQuality);
  Serial.print("\",\"uvRaw\":");
  Serial.print(uvRaw);
  Serial.print(",\"uvVoltage\":");
  Serial.print(uvVoltage, 2);
  Serial.print(",\"uvIndex\":");
  Serial.print(uvIndex, 2);
  Serial.println("}");

  // -------------------------------------------------------------
  // OUTPUT 2: Human-readable output for Arduino IDE Serial Monitor
  // -------------------------------------------------------------
  Serial.println("--------------------------------");
  if (dhtError) {
    Serial.println("DHT11: SENSOR ERROR (Check wiring/pullup)");
  } else {
    Serial.print("Temperature : ");
    Serial.print(temperature);
    Serial.println(" °C");

    Serial.print("Humidity    : ");
    Serial.print(humidity);
    Serial.println(" %");
  }

  Serial.print("Rain Value  : ");
  Serial.println(rainValue);
  Serial.print("Rain Status : ");
  Serial.println(rainStatus);

  Serial.print("IR Value    : ");
  Serial.println(irValue);
  Serial.print("IR Status   : ");
  Serial.println(irStatus);

  Serial.print("Gas Value   : ");
  Serial.println(gasValue);
  Serial.print("Air Quality : ");
  Serial.println(airQuality);

  Serial.print("UV Raw      : ");
  Serial.println(uvRaw);
  Serial.print("UV Voltage  : ");
  Serial.print(uvVoltage);
  Serial.println(" V");
  Serial.print("UV Index    : ");
  Serial.println(uvIndex);
  Serial.println("--------------------------------\n");

  // Sample every 2 seconds
  delay(2000);
}
