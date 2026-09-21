# MedGuardian – Smart IoT Healthcare Monitoring & Emergency System

A full-stack, enterprise-grade clinical healthcare monitoring platform combining the **MERN stack**, **ESP32 IoT hardware**, **multi-parameter physiological sensing**, **inertial fall detection**, **instant hardware SOS triggers**, and **explainable rule-based clinical intelligence**.

---

## 1. System Architecture

```
                          +-------------------------------+
                          |       ESP32 IoT Hardware      |
                          |  MAX30100 (Pulse / SpO2)      |
                          |  MPU6050 (6-Axis IMU)         |
                          |  DHT11 (Temp in Celsius)      |
                          |  SOS Button + Piezo Buzzer    |
                          +---------------+---------------+
                                          | HTTP POST /api/telemetry (JSON)
                                          | Response: { alarm: boolean, duration: ms }
                                          v
                        +-----------------------------------+
                        |     Node.js + Express Backend     |
                        |      REST API + Socket.IO         |
                        +-----------------+-----------------+
                                          |
          +-------------------------------+-------------------------------+
          |                               |                               |
          v                               v                               v
+-------------------+           +-------------------+           +-------------------+
|  MongoDB Database |           |  AI Risk Engine   |           |   Fall Detection  |
| - Staff Accounts  |           | - Rule-based AI   |           | - Impact >= 2.5g  |
| - Patient Records |           | - Clinical scores |           | - Free-fall spin  |
| - Telemetry Log   |           | - Explainable why |           | - Instant triage  |
| - Emergency State |           | - Recommendations |           +-------------------+
| - Audit Trail     |           +-------------------+                     |
+-------------------+                     |                               |
          |                               +---------------+---------------+
          |                                               |
          +-----------------------------------------------+
                                          |
                                          v (Socket.IO Events)
                        +-----------------------------------+
                        |       React + Vite Frontend       |
                        |    100% Pure Vanilla CSS Design   |
                        |       Sora + Inter Typography     |
                        +-----------------+-----------------+
                                          |
    +-------------------+-----------------+-----------------+-------------------+
    |                   |                 |                 |                   |
    v                   v                 v                 v                   v
Dashboard           Patients          Live Monitor      Emergency Center    Analytics
(Overview)         (Directory)       (Real-Time Wave)  (Triage & Resolve)  (Ward Intel)
```

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, React Router DOM v6, Axios, Recharts, React Icons, Framer Motion.
- **Styling**: 100% Pure Vanilla CSS (.css files with custom properties and semantic classes). Zero CSS frameworks (No Tailwind, No Bootstrap, No MUI).
- **Backend**: Node.js, Express.js (Single unified backend).
- **Database**: MongoDB & Mongoose ORM.
- **Real-Time Layer**: Socket.IO (Bidirectional WebSocket streaming).
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs with role authorization (ADMIN, DOCTOR, NURSE).
- **IoT Layer**: ESP32 DevKit V1 (C++ / Arduino framework).
- **Sensors**: MAX30100 (Pulse Oximeter), MPU6050 (6-Axis Accelerometer / Gyroscope), DHT11 (Temperature), SOS Tactile Button, Piezo Buzzer.

---

## 3. Directory Structure

```
E:\Medguardian_Project\
├── client/                     # React + Vite Frontend
│   ├── public/                 # Favicon & assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/      # Stat cards & charts
│   │   │   ├── emergency/      # Emergency alert cards & timeline
│   │   │   ├── layout/         # Sidebar, Navbar, AppLayout, ProtectedRoute
│   │   │   ├── monitoring/     # Live vital tiles & Explainable AI cards
│   │   │   ├── patient/        # Patient filters, cards, and modal form
│   │   │   └── ui/             # Reusable Button, Input, Modal, Table, Badge, Loader
│   │   ├── context/            # AuthContext & SocketContext
│   │   ├── pages/              # Login, Dashboard, Patients, Profile, Monitoring, Emergency, History, Analytics, Devices
│   │   ├── services/           # Axios API modules (auth, patient, telemetry, etc.)
│   │   ├── styles/             # 12 Modular Vanilla CSS files (variables, global, layout, auth, etc.)
│   │   ├── App.jsx             # React Router routing
│   │   └── main.jsx            # Entrypoint
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── config/                 # MongoDB connection
│   ├── controllers/            # Auth, Patient, Dashboard, Telemetry, Emergency, Analytics, Simulation
│   ├── middleware/             # JWT auth guard, role check, error handler
│   ├── models/                 # User, Patient, Device, Telemetry, Emergency, AuditLog
│   ├── routes/                 # Express API route modules
│   ├── services/               # AI Risk Engine, Fall Detector, Emergency Automation, Simulator
│   ├── tests/                  # Automated API test suite
│   ├── utils/                  # Database seeder
│   ├── websocket/              # Socket.IO connection & broadcast helpers
│   ├── server.js               # Main HTTP & Socket.IO server
│   ├── package.json
│   └── .env.example
│
├── esp32_firmware/             # ESP32 C++ Firmware
│   ├── medguardian.ino         # Arduino sketch with MAX30100, MPU6050, DHT11, SOS, Buzzer
│   └── README.md               # Hardware wiring schematic & flashing guide
│
├── .gitignore
└── README.md
```

---

## 4. Hardware Wiring & Pin Configuration

| Component | ESP32 GPIO Pin | Description |
| :--- | :--- | :--- |
| **I2C SDA** | **GPIO 21** | Shared I2C Data bus (MAX30100 & MPU6050) |
| **I2C SCL** | **GPIO 22** | Shared I2C Clock bus (MAX30100 & MPU6050) |
| **DHT11** | **GPIO 4** | 1-Wire Digital Temperature Sensor (Celsius) |
| **SOS Button** | **GPIO 27** | Active LOW with internal pull-up resistor |
| **Piezo Buzzer** | **GPIO 26** | Active HIGH acoustic alarm feedback |

---

## 5. Clinical AI & Fall Detection Rules

### Explainable Rule-Based AI Engine
- **HIGH RISK (Score 70–100, Red #F04438)**:
  - (HR > 120 BPM AND SpO2 < 90%) OR (HR > 120 BPM) OR (SpO2 < 90%)
  - Hardware SOS Button Pressed
  - Severe Impact / Fall Pattern Confirmed
- **WARNING RISK (Score 40–65, Orange #F79009)**:
  - (100 <= HR <= 120 BPM) OR (90% <= SpO2 <= 94%)
  - Elevated temperature (>= 38.0°C)
- **NORMAL (Score 10–30, Green #12B76A)**:
  - All physiological readings within healthy clinical ranges.

### Fall Detection Algorithm
- **3D Acceleration Vector Magnitude**: |A| = sqrt(ax^2 + ay^2 + az^2)
- **Impact Threshold**: |A| >= 2.5g flags sudden high-energy floor impact.
- **Free-Fall Phase**: |A| <= 0.5g accompanied by rotational velocity > 120 deg/s.

---

## 6. Getting Started Locally

### Prerequisites
- Node.js v18+ and npm installed
- MongoDB installed locally or MongoDB Atlas connection string

### Step 1: Backend Setup
```bash
cd E:\Medguardian_Project\server
npm install
npm run seed       # Seeds users, sample patients, and hardware records
npm start          # Starts server on http://localhost:5000
```

### Step 2: Frontend Setup
```bash
cd E:\Medguardian_Project\client
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```

### Step 3: Run Backend Verification Tests
```bash
cd E:\Medguardian_Project\server
npm run test:api   # Runs all 9 automated API & rule engine tests
```

---

## 7. Pre-Configured Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Chief Administrator** | admin@medguardian.io | admin123 | Full access: CRUD patients, emergency triage, system config |
| **Attending Physician** | doctor@medguardian.io | doctor123 | Patient diagnosis, vital monitoring, emergency resolution |
| **Ward Nurse** | nurse@medguardian.io | nurse123 | Bedside monitoring, telemetry inspection, alert acknowledgment |

---

## 8. Simulation & Development Mode

For testing without physical ESP32 hardware:
- Click the **"Simulation Mode: ON"** toggle in the top Navbar.
- Select from 5 simulated clinical test scenarios:
  1. **Normal Vitals**: 72 BPM, 98% SpO₂, 36.7°C.
  2. **Borderline Warning**: 108 BPM, 92% SpO₂, 37.8°C.
  3. **Critical Tachycardia**: 135 BPM, 86% SpO₂, 38.6°C (Triggers critical alert).
  4. **Fall Impact (2.8g)**: Triggers MPU6050 fall detection emergency.
  5. **Hardware SOS**: Triggers direct patient SOS emergency.
