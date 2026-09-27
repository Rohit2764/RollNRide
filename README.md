# RollNRide — Smart Mobility, Fleet, Traffic & Warehouse Intelligence Platform

RollNRide is an enterprise-grade, full-stack smart mobility platform combining **customer vehicle reservations**, **real-time fleet telematics**, **warehouse workload optimization**, **arterial traffic intelligence**, and **predictive demand redistribution**.

Engineered from scratch with **Python FastAPI**, **SQLAlchemy 2.0**, **PostgreSQL / SQLite**, **React 18**, **TypeScript**, **Tailwind CSS**, and **Leaflet**, RollNRide features a background **autonomous simulation engine** controlling 100+ moving vehicles, 5 Hyderabad distribution depots, and live WebSockets.

---

## Key Platform Capabilities

### 1. Customer Mobility Experience
- **Interactive Vehicle Discovery**: Filter two-wheelers, sedans, SUVs, and electric vehicles across 5 regional depots with transparent hourly & daily tariffs.
- **Dynamic Price Engine**: Instant estimate calculated based on duration, vehicle class base fee, and regional taxes.
- **Active Trip Cockpit HUD (`/trip/:bookingId`)**: Real-time vehicle telematics dashboard featuring an analog-styled speedometer, live battery/fuel gauges, GPS route breadcrumbs, 1-click SOS emergency beacon, and one-tap depot return.

### 2. Operations Command Center (`/admin/operations-center`)
- **3-Pane Command View**:
  - **Left Sidebar**: Real-time fleet filter by status (`AVAILABLE`, `IN_USE`, `RETURNING`, `CLEANING`, `MAINTENANCE`), warehouse, or registration search.
  - **Center Interactive Map**: Dark-themed Leaflet geospatial map rendering dynamic vehicle markers with heading rotation, warehouse workload radius pins, traffic congestion overlays, and polyline routes.
  - **Right Telemetry Drawer**: Live inspection showing vehicle velocity, azimuth heading, battery discharge, customer metadata, and destination ETA.

### 3. Multi-Factor Warehouse Workload Engine (`/admin/warehouses`)
Workload scores ($0 - 100$) are calculated using the calibrated multi-factor formula:
$$\text{Workload} = 0.25B + 0.20D + 0.15R + 0.15M + 0.10C + 0.15S$$
- $B$: Active booking pressure ratio
- $D$: Pending dispatches
- $R$: Expected vehicle returns
- $M$: Vehicles currently undergoing repair
- $C$: Active turnaround cleaning queue
- $S$: Staff pressure ratio (assigned vs on-duty technicians)

Automatic threshold categorization:
- **NORMAL** ($< 50$): Stable operations
- **BUSY** ($50 - 69$): Elevated queue volume
- **HIGH LOAD** ($70 - 79$): Bay bottleneck risk
- **OVERLOADED** ($\ge 80$): Triggers automated redistribution recommendations and operator alerts

### 4. Traffic Intelligence & $A^*$ Pathfinder (`/admin/traffic`)
- **Congestion Engine**: Continuous monitoring of Hyderabad corridors (Hitec City, Gachibowli, Banjara Hills, Secunderabad, Shamshabad Airport).
- **Incident Logger**: Real-time incident dispatching with severe congestion warnings.
- **Congestion-Aware $A^*$ Routing**: Calculates shortest physical distance while applying dynamic penalties for congested sectors to yield minimum-delay alternate routes.

### 5. Predictive Demand Forecasting & Redistribution (`/admin/demand-forecast`, `/admin/optimization`)
- **Diurnal Demand Curves**: 24-hour demand projection factoring in morning/evening rush hours, historical fulfillment rates, and current depot inventory.
- **Surplus-Deficit Optimization**: Computes optimal inter-depot vehicle balance and generates 1-click executable transfer orders with priority rankings (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).

### 6. Vehicle Turnaround & Cleaning Pipeline (`/admin/maintenance`)
- **4-Stage Automated State Machine**:
  $$\text{RETURNED} \longrightarrow \text{INSPECTION} \longrightarrow \text{CLEANING} \longrightarrow \text{AVAILABLE}$$
- 1-click **Advance Queue** action to move vehicles through sanitization bays and return them to the available fleet.
- Work order dispatch modal for unscheduled mechanical and battery overhauls.

### 7. Depot Workforce & Staff Management (`/admin/staff`)
- Real-time roster directory covering Morning, Evening, and Night shifts.
- Workload metrics: on-duty vs assigned technicians, daily task completions, and SLA efficiency ratings.

### 8. Anomaly Detection & Alert Center (`/admin/alerts`)
- Background heuristic scanner identifying speed limit violations ($>80\text{ km/h}$ in urban zones), low battery warnings ($<15\%$), and warehouse bay congestion.
- Severity classification (`CRITICAL`, `WARNING`, `INFO`) with operator dismissal and acknowledgment.

### 9. Executive BI & Reporting (`/admin/reports`, `/admin/dashboard`)
- Executive dashboard with Recharts visualizations: revenue trends, fleet utilization curves, and depot workload comparisons.
- Printable auditor PDF report format and instant CSV data export.

### 10. Autonomous Background Simulation Engine (`/admin/simulation`)
- In-process async loop animating 100+ vehicles along authentic Hyderabad road coordinates.
- Dynamic vehicle deceleration inside congested traffic zones.
- Real-time battery drain, return arrivals, and automated turnover progression.
- Adjustable speed multiplier ($1\times, 2\times, 5\times, 10\times$) with pause/resume controls.

---

## Demo Accounts & Persona Switching

RollNRide includes a **1-click Persona Switcher** in the top navigation bar. You can also sign in manually using any of the seeded credentials:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@rollnride.com` | `Admin123!` | Unrestricted system-wide access |
| **Operations Manager** | `manager@rollnride.com` | `Manager123!` | Fleet, routing, forecasting & optimization |
| **Warehouse Manager** | `warehouse@rollnride.com` | `Warehouse123!` | Hub workload, cleaning queue, staff & maintenance |
| **Fleet Manager** | `fleet@rollnride.com` | `Fleet123!` | Vehicle tracking, telematics override, maintenance |
| **Customer (Renter)** | `customer@rollnride.com` | `Customer123!` | Booking vehicle discovery, rental HUD, dashboard |

---

## Quickstart with Docker Compose

To spin up the complete full-stack environment with Nginx reverse proxy:

```bash
docker compose up --build
```

- **Web Application**: [http://localhost](http://localhost) (or [http://localhost:5173](http://localhost:5173) in dev)
- **FastAPI OpenAPI Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt

# Run the database seeder (seeds 5 hubs, 105 vehicles, staff, bookings)
python -m app.core.seed

# Start the FastAPI server with WebSockets
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at [http://localhost:5173](http://localhost:5173) with automatic proxying to backend `:8000` for `/api` and `/ws`.

---

## Automated Test Suite

Run the full pytest suite from the project root:

```bash
# Windows
$env:PYTHONPATH="backend"; backend\.venv\Scripts\pytest.exe tests -v

# Linux/macOS
PYTHONPATH=backend pytest tests -v
```

The suite validates:
- Health check endpoints
- Admin & customer authentication with bcrypt token generation
- Dynamic booking price estimation & end-to-end booking lifecycles
- Demand forecasting & shortage predictions
- $A^*$ route optimization and congestion penalties
- Inter-depot vehicle redistribution approvals
- Warehouse workload multi-factor formula accuracy

Frontend build verification:
```bash
cd frontend
npm run build
```

---

## Technology Architecture

```
RollNRide/
├── backend/
│   ├── app/
│   │   ├── api/            # REST API endpoints (auth, fleet, traffic, etc.)
│   │   ├── core/           # Security, SQLite/Postgres DB setup, Seeder
│   │   ├── models/         # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/        # Pydantic v2 schemas
│   │   ├── services/       # Workload, A* routing, forecasting, simulation
│   │   └── websocket/      # Channel-based real-time pub/sub manager
│   ├── requirements.txt
│   └── rollnride.db
├── frontend/
│   ├── src/
│   │   ├── api/            # Typed HTTP client with token handling
│   │   ├── components/     # FleetMap, BookingModal, AppLayout, Navbar
│   │   ├── pages/          # Customer & Admin responsive pages
│   │   ├── store/          # Zustand auth and simulation stores
│   │   └── types/          # Domain TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── tests/                  # Integration and unit tests
├── docker/                 # Production Dockerfiles and Nginx reverse proxy
└── docker-compose.yml
```

---

## License
MIT License. Built for enterprise-grade smart mobility operations.
