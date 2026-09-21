/*
  =============================================================================
  MedGuardian - Smart IoT Healthcare Monitoring & Emergency System
  ESP32 Firmware with MAX30100, MPU6050, DHT11, SOS Button & Buzzer
  Connected directly to Node.js / Express Backend Server
  =============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <DHT.h>
#include "MAX30100_PulseOximeter.h"

// =====================================================
// 1. NETWORK & BACKEND CONFIGURATION
// =====================================================

// Wi-Fi Credentials (Configure for your local Wi-Fi router)
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Node.js Backend Server IP & Port (e.g. http://192.168.1.50:5000)
const char* NODE_SERVER_URL = "http://192.168.1.100:5000/api/telemetry";

// Device & Patient identifiers
const char* DEVICE_ID = "ESP32-MED-01";
const char* PATIENT_ID = "PT-0001";

// =====================================================
// 2. PIN DEFINITIONS & CONSTANTS
// =====================================================

#define DHTPIN 4
#define DHTTYPE DHT11

#define SOS_BUTTON_PIN 27
#define BUZZER_PIN 26

#define SDA_PIN 21
#define SCL_PIN 22

#define MPU6050_ADDR 0x68

// Non-blocking timer intervals
#define TELEMETRY_INTERVAL_MS 1000  // Send telemetry every 1s
#define MPU_INTERVAL_MS       200   // Poll accelerometer every 200ms
#define DHT_INTERVAL_MS       2000  // Poll temp/humidity every 2s
#define BUTTON_INTERVAL_MS    50    // Button debounce interval

// Fall detection threshold
#define FALL_IMPACT_THRESHOLD_G 2.5 // Spike >= 2.5g indicates severe impact/fall

// =====================================================
// 3. SENSOR OBJECTS & GLOBAL STATE
// =====================================================

DHT dht(DHTPIN, DHTTYPE);
PulseOximeter pox;

bool max30100Ready = false;
bool mpu6050Ready = false;

// Timers
uint32_t tsLastTelemetry = 0;
uint32_t tsLastMPU       = 0;
uint32_t tsLastDHT       = 0;
uint32_t tsLastButton    = 0;

// Sensor Values
float currentHeartRate   = 0.0;
float currentSpO2        = 0.0;
bool fingerDetected      = false;

float currentTemperature = 36.7;
float currentHumidity    = 50.0;

int16_t rawAccelX, rawAccelY, rawAccelZ;
int16_t rawGyroX, rawGyroY, rawGyroZ;
int16_t rawMpuTemp;

float accelX = 0.0, accelY = 0.0, accelZ = 1.0;
float gyroX  = 0.0, gyroY  = 0.0, gyroZ  = 0.0;
float accelMagnitude = 1.0;

bool sosPressed = false;
bool fallDetected = false;
bool serverAlarmInstruction = false;
uint32_t alarmUntilTs = 0;

// Callback when MAX30100 detects heartbeat
void onBeatDetected() {
  Serial.print("♥ ");
}

// =====================================================
// 4. MPU6050 INITIALIZATION & READING
// =====================================================

bool initMPU6050() {
  Serial.println("[MPU6050] Initializing 6-Axis Motion Sensor...");
  Wire.beginTransmission(MPU6050_ADDR);
  if (Wire.endTransmission() != 0) {
    Serial.println("❌ [MPU6050] Sensor not found on I2C address 0x68!");
    return false;
  }

  // Wake up MPU6050 (Power management register 0x6B)
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission();
  delay(50);

  // Set Accelerometer Range: ±8g (Register 0x1C = 0x10)
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x1C);
  Wire.write(0x10);
  Wire.endTransmission();

  // Set Gyroscope Range: ±500 deg/s (Register 0x1B = 0x08)
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x1B);
  Wire.write(0x08);
  Wire.endTransmission();

  Serial.println("✅ [MPU6050] Initialized successfully.");
  return true;
}

bool readMPU6050() {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0) return false;

  int received = Wire.requestFrom(MPU6050_ADDR, 14);
  if (received != 14) return false;

  rawAccelX = (Wire.read() << 8) | Wire.read();
  rawAccelY = (Wire.read() << 8) | Wire.read();
  rawAccelZ = (Wire.read() << 8) | Wire.read();
  rawMpuTemp = (Wire.read() << 8) | Wire.read();
  rawGyroX  = (Wire.read() << 8) | Wire.read();
  rawGyroY  = (Wire.read() << 8) | Wire.read();
  rawGyroZ  = (Wire.read() << 8) | Wire.read();

  // Convert to g (±8g -> 4096 LSB/g) and deg/s (±500 dps -> 65.5 LSB/dps)
  accelX = rawAccelX / 4096.0;
  accelY = rawAccelY / 4096.0;
  accelZ = rawAccelZ / 4096.0;

  gyroX = rawGyroX / 65.5;
  gyroY = rawGyroY / 65.5;
  gyroZ = rawGyroZ / 65.5;

  // Compute 3D Acceleration Vector Magnitude
  accelMagnitude = sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);

  // Fall Impact Detection
  if (accelMagnitude >= FALL_IMPACT_THRESHOLD_G) {
    fallDetected = true;
    Serial.println("\n🚨 [ALERT] High acceleration impact detected (potential fall)!");
  }

  return true;
}

// =====================================================
// 5. WI-FI CONNECTIVITY
// =====================================================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ [WiFi] Connected!");
    Serial.print("📡 [WiFi] ESP32 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("🎯 [WiFi] Node.js Server: ");
    Serial.println(NODE_SERVER_URL);
  } else {
    Serial.println("\n⚠️ [WiFi] Connection timeout. Retrying in main loop...");
  }
}

// =====================================================
// 6. TELEMETRY TRANSMISSION TO NODE.JS BACKEND
// =====================================================

void sendTelemetryToNodeServer() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    return;
  }

  HTTPClient http;
  http.begin(NODE_SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON Telemetry payload
  char payload[512];
  snprintf(payload, sizeof(payload),
    "{"
    "\"deviceId\":\"%s\","
    "\"patientId\":\"%s\","
    "\"heartRate\":%.1f,"
    "\"spo2\":%.1f,"
    "\"temperature\":%.1f,"
    "\"humidity\":%.1f,"
    "\"accelX\":%.2f,"
    "\"accelY\":%.2f,"
    "\"accelZ\":%.2f,"
    "\"gyroX\":%.1f,"
    "\"gyroY\":%.1f,"
    "\"gyroZ\":%.1f,"
    "\"sosPressed\":%s,"
    "\"fallDetected\":%s"
    "}",
    DEVICE_ID,
    PATIENT_ID,
    currentHeartRate,
    currentSpO2,
    currentTemperature,
    currentHumidity,
    accelX,
    accelY,
    accelZ,
    gyroX,
    gyroY,
    gyroZ,
    sosPressed ? "true" : "false",
    fallDetected ? "true" : "false"
  );

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    
    // Check if Node.js server instructed hardware buzzer alarm
    if (response.indexOf("\"alarm\":true") != -1) {
      serverAlarmInstruction = true;
      alarmUntilTs = millis() + 5000; // Buzz for 5 seconds
      Serial.println("🔔 [BUZZER] Server commanded emergency alarm active!");
    } else {
      serverAlarmInstruction = false;
    }

    Serial.print("📡 [HTTP POST] Status: ");
    Serial.println(httpCode);
  } else {
    Serial.print("❌ [HTTP POST Failed] Error: ");
    Serial.println(http.errorToString(httpCode).c_str());
  }

  http.end();

  // Reset transient fall detection flag after transmission
  fallDetected = false;
}

// =====================================================
// 7. SETUP
// =====================================================

void setup() {
  Serial.begin(115200);
  delay(1500);

  Serial.println("\n==========================================");
  Serial.println("   MEDGUARDIAN ESP32 SMART IOT CLIENT    ");
  Serial.println("  Connected directly to Node.js Backend   ");
  Serial.println("==========================================");

  // Initialize GPIOs
  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize I2C Bus (SDA = 21, SCL = 22)
  Wire.begin(SDA_PIN, SCL_PIN);
  Serial.println("✅ [I2C] Initialized on SDA=21, SCL=22");

  // Initialize DHT11
  dht.begin();
  Serial.println("✅ [DHT11] Initialized on GPIO 4");

  // Initialize MPU6050
  mpu6050Ready = initMPU6050();

  // Initialize MAX30100 Pulse Oximeter
  Serial.println("[MAX30100] Initializing Pulse Oximeter on I2C 0x57...");
  if (pox.begin()) {
    max30100Ready = true;
    pox.setIRLedCurrent(MAX30100_LED_CURR_7_6MA);
    pox.setOnBeatDetectedCallback(onBeatDetected);
    Serial.println("✅ [MAX30100] Ready & Beat Callback Registered.");
  } else {
    max30100Ready = false;
    Serial.println("❌ [MAX30100] Initialization FAILED! Check sensor wiring.");
  }

  // Connect to Wi-Fi
  connectWiFi();

  Serial.println("==========================================\n");
}

// =====================================================
// 8. MAIN LOOP
// =====================================================

void loop() {
  // A. MAX30100 requires continuous updates in loop
  if (max30100Ready) {
    pox.update();
  }

  // B. Poll SOS Button (Debounced)
  if (millis() - tsLastButton >= BUTTON_INTERVAL_MS) {
    tsLastButton = millis();
    int btnState = digitalRead(SOS_BUTTON_PIN);
    
    if (btnState == LOW) { // Active LOW with pullup
      if (!sosPressed) {
        sosPressed = true;
        Serial.println("\n🚨🚨 SOS EMERGENCY BUTTON PRESSED! 🚨🚨");
        digitalWrite(BUZZER_PIN, HIGH);
        alarmUntilTs = millis() + 4000;
        sendTelemetryToNodeServer();
      }
    } else {
      sosPressed = false;
    }
  }

  // C. Poll MPU6050 Motion & Fall Detector
  if (mpu6050Ready && (millis() - tsLastMPU >= MPU_INTERVAL_MS)) {
    tsLastMPU = millis();
    readMPU6050();
  }

  // D. Poll DHT11 Temperature & Humidity
  if (millis() - tsLastDHT >= DHT_INTERVAL_MS) {
    tsLastDHT = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      currentTemperature = t;
      currentHumidity = h;
    }
  }

  // E. Periodic Telemetry Transmission
  if (millis() - tsLastTelemetry >= TELEMETRY_INTERVAL_MS) {
    tsLastTelemetry = millis();

    if (max30100Ready) {
      currentHeartRate = pox.getHeartRate();
      currentSpO2      = pox.getSpO2();
      fingerDetected   = (currentHeartRate > 0);
    }

    // Local Serial Telemetry Print
    Serial.print("📊 [VITALS] HR: ");
    Serial.print(currentHeartRate, 1);
    Serial.print(" BPM | SpO2: ");
    Serial.print(currentSpO2, 1);
    Serial.print("% | Temp: ");
    Serial.print(currentTemperature, 1);
    Serial.print("°C | Accel: ");
    Serial.print(accelMagnitude, 2);
    Serial.println("g");

    // Send HTTP POST to Node.js backend
    sendTelemetryToNodeServer();

    // Control Local Buzzer Output
    if (sosPressed || fallDetected || (millis() < alarmUntilTs)) {
      digitalWrite(BUZZER_PIN, HIGH);
    } else {
      digitalWrite(BUZZER_PIN, LOW);
    }
  }
}
