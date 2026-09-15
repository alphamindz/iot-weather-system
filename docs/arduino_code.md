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


// -------------------------
// SETUP
// -------------------------

void setup() {

  Serial.begin(9600);

  dht.begin();

  pinMode(IR_PIN, INPUT);

  Serial.println("================================");
  Serial.println("   IOT WEATHER MONITORING SYSTEM");
  Serial.println("================================");
  Serial.println("System Started");
  Serial.println();

  delay(2000);
}


// -------------------------
// MAIN LOOP
// -------------------------

void loop() {

  // =========================
  // DHT11
  // =========================

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();


  // =========================
  // RAIN SENSOR
  // =========================

  int rainValue = analogRead(RAIN_PIN);

  String rainStatus;

  if (rainValue < 500) {
    rainStatus = "RAIN DETECTED";
  }
  else {
    rainStatus = "NO RAIN";
  }


  // =========================
  // IR SENSOR
  // =========================

  int irValue = digitalRead(IR_PIN);

  String irStatus;

  if (irValue == LOW) {
    irStatus = "OBJECT DETECTED";
  }
  else {
    irStatus = "NO OBJECT";
  }


  // =========================
  // MQ-135
  // =========================

  int gasValue = analogRead(MQ135_PIN);

  String airQuality;

  if (gasValue < 200) {
    airQuality = "GOOD";
  }
  else if (gasValue < 400) {
    airQuality = "MODERATE";
  }
  else if (gasValue < 600) {
    airQuality = "POOR";
  }
  else {
    airQuality = "VERY POOR";
  }


  // =========================
  // UV SENSOR
  // =========================

  int uvRaw = analogRead(UV_PIN);

  float uvVoltage = uvRaw * (5.0 / 1023.0);

  // Approximate value
  // Calibration required for accurate UV Index
  float uvIndex = uvVoltage * 2.5;


  // =========================
  // SERIAL MONITOR
  // =========================

  Serial.println("--------------------------------");

  // Temperature & Humidity
  if (isnan(temperature) || isnan(humidity)) {

    Serial.println("DHT11: SENSOR ERROR");

  }
  else {

    Serial.print("Temperature : ");
    Serial.print(temperature);
    Serial.println(" °C");

    Serial.print("Humidity    : ");
    Serial.print(humidity);
    Serial.println(" %");
  }


  // Rain
  Serial.print("Rain Value  : ");
  Serial.println(rainValue);

  Serial.print("Rain Status : ");
  Serial.println(rainStatus);


  // IR
  Serial.print("IR Value    : ");
  Serial.println(irValue);

  Serial.print("IR Status   : ");
  Serial.println(irStatus);


  // Air Quality
  Serial.print("Gas Value   : ");
  Serial.println(gasValue);

  Serial.print("Air Quality : ");
  Serial.println(airQuality);


  // UV
  Serial.print("UV Raw      : ");
  Serial.println(uvRaw);

  Serial.print("UV Voltage  : ");
  Serial.print(uvVoltage);
  Serial.println(" V");

  Serial.print("UV Index    : ");
  Serial.println(uvIndex);


  Serial.println("--------------------------------");
  Serial.println();

  delay(2000);
}