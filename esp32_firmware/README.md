# MedGuardian ESP32 IoT Firmware

Firmware for the MedGuardian Smart Healthcare Patient Monitoring System.
Directly interfaces physiological and inertial sensors with the Node.js/Express backend server via Wi-Fi HTTP POST.

---

## 1. Hardware Components

| Component | Responsibility | Interface / Pin |
| :--- | :--- | :--- |
| **ESP32 DevKit V1** | Microcontroller & Wi-Fi Gateway | Core Unit |
| **MAX30100** | Heart Rate & Pulse Oximetry (SpO₂) | I2C (SDA: GPIO 21, SCL: GPIO 22, Addr: 0x57) |
| **MPU6050** | 6-Axis Accelerometer / Gyroscope (Fall Detection) | I2C (SDA: GPIO 21, SCL: GPIO 22, Addr: 0x68) |
| **DHT11** | Body/Ambient Temperature (Celsius) | 1-Wire Digital (GPIO 4) |
| **SOS Push Button** | Emergency Call Alert | GPIO 27 (Internal Pull-Up) |
| **Piezo Buzzer** | Local Acoustic Alarm Feedback | GPIO 26 |

---

## 2. Wiring Schematic

```
ESP32 DevKit V1 Pinout Connections:

[ESP32 GPIO 21] ───────────────> MAX30100 SDA  &  MPU6050 SDA
[ESP32 GPIO 22] ───────────────> MAX30100 SCL  &  MPU6050 SCL
[ESP32 3.3V]    ───────────────> VCC (MAX30100, MPU6050, DHT11)
[ESP32 GND]     ───────────────> GND (All sensors, button, buzzer)

[ESP32 GPIO 4]  ───────────────> DHT11 Data Pin
[ESP32 GPIO 27] ───────────────> SOS Button (Terminal 1)
                                  SOS Button (Terminal 2) ───> GND

[ESP32 GPIO 26] ───────────────> Piezo Buzzer (+)
                                  Piezo Buzzer (-) ───────────> GND
```

---

## 3. Arduino IDE Setup & Required Libraries

Install the following libraries in Arduino IDE Library Manager (**Tools -> Manage Libraries...**):
1. **MAX30100lib** by OXullo Intersecans (`MAX30100_PulseOximeter.h`)
2. **DHT sensor library** by Adafruit
3. **Adafruit Unified Sensor** by Adafruit

---

## 4. Configuration

Edit the network variables at the top of `medguardian.ino`:
```cpp
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* NODE_SERVER_URL = "http://<YOUR_COMPUTER_LOCAL_IP>:5000/api/telemetry";
const char* DEVICE_ID     = "ESP32-MED-01";
const char* PATIENT_ID    = "PT-0001";
```

---

## 5. Bidirectional Real-Time Communication

1. **ESP32 $\to$ Node.js**: Every second, the ESP32 posts JSON physiological and inertial telemetry.
2. **Node.js $\to$ ESP32**: The Node.js server evaluates the risk level and returns an immediate response instruction:
```json
{
  "success": true,
  "riskLevel": "HIGH",
  "alarm": true,
  "duration": 5000
}
```
When `alarm: true`, the ESP32 automatically triggers the physical buzzer alarm on GPIO 26.
