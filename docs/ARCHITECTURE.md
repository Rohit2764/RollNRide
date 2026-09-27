# RollNRide System Architecture

RollNRide is architected as an asynchronous, event-driven smart mobility management and operational intelligence platform.

```
                              +---------------------------------------+
                              |         Browser Client (SPA)          |
                              |  React 18 + Vite + Tailwind + Leaflet |
                              +---------------------------------------+
                                        |                   ^
                               HTTP API |                   | WebSockets (/ws/*)
                                        v                   |
                              +---------------------------------------+
                              |          FastAPI Application          |
                              |   Dependency Injection & Security     |
                              +---------------------------------------+
                                        |                   |
            +---------------------------+                   +------------------------+
            |                                                                        |
            v                                                                        v
+------------------------+  +------------------------+  +--------------------------------+
|  Operational Services  |  |  Mathematical Engines  |  |  Simulation & Telematics Loop  |
|  - Booking Lifecycle   |  |  - Multi-factor Load   |  |  - Synthetic GPS Provider      |
|  - Turnaround Pipeline |  |  - A* Routing Path     |  |  - Deceleration Heuristic     |
|  - Roster & Staffing   |  |  - Diurnal Forecasting |  |  - Battery Discharge Engine    |
+------------------------+  +------------------------+  +--------------------------------+
            |                           |                                    |
            +---------------------------+------------------------------------+
                                        |
                                        v
                              +--------------------+
                              |  SQLAlchemy 2.0    |
                              |  SQLite/Postgres   |
                              +--------------------+
```

---

## 1. Domain Data Modeling (SQLAlchemy 2.0)

- **`User`**: Role-based access control (`ADMIN`, `OPERATIONS_MANAGER`, `WAREHOUSE_MANAGER`, `FLEET_MANAGER`, `STAFF`, `CUSTOMER`). Direct bcrypt password hashing with SHA-256 wrapping prevents passlib length boundary limits.
- **`Warehouse`**: Regional hub registry with geospatial centroid, vehicle capacity, staff assignments, and cached workload score metrics.
- **`Vehicle` & `VehicleType`**: Heterogeneous asset model supporting electric bikes, scooters, executive sedans, and electric SUVs. Tracks telematics state: latitude, longitude, speed, azimuth heading, battery percentage, fuel level, and status.
- **`Booking`**: Complete transaction record tracking pickup depot, dropoff depot, time intervals, base rate, tax multipliers, payment state, and telematics trip links.
- **`CleaningTask` & `MaintenanceRecord`**: Turnaround queue records managing the 4-stage pipeline:
  $$\text{RETURNED} \to \text{INSPECTION} \to \text{CLEANING} \to \text{AVAILABLE}$$
- **`Staff`**: Workforce entity linked to specific warehouse hubs, tracking shift schedule (`MORNING`, `EVENING`, `NIGHT`), real-time availability (`ON_DUTY`, `ASSIGNED`, `ON_BREAK`, `OFF_DUTY`), and daily tasks completed.
- **`TrafficZone` & `TrafficIncident`**: Geospatial traffic monitoring polygons evaluating average corridor velocities against standard free-flow speeds.
- **`RedistributionRecommendation`**: Algorithmic balancing directives moving vehicles from surplus depots to deficit hubs with priority levels (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **`Alert`**: System and telematics anomalies with heuristic severity levels (`CRITICAL`, `WARNING`, `INFO`).

---

## 2. Core Operational & Algorithmic Engines

### A. Dynamic Warehouse Workload Formula
The platform computes a normalized workload score ($0 - 100$) evaluating pressure across 6 operational dimensions:

$$\text{Workload} = 0.25 B + 0.20 D + 0.15 R + 0.15 M + 0.10 C + 0.15 S$$

Where:
- $B = \min\left(100, \frac{\text{Active Bookings}}{\text{Capacity}} \times 100\right)$
- $D = \min\left(100, \text{Pending Dispatches} \times 10\right)$
- $R = \min\left(100, \text{Pending Returns} \times 10\right)$
- $M = \min\left(100, \frac{\text{Maintenance Count}}{\text{Capacity}} \times 200\right)$
- $C = \min\left(100, \frac{\text{Cleaning Queue Length}}{\text{Capacity}} \times 150\right)$
- $S = \min\left(100, \frac{\text{Assigned Staff}}{\max(1, \text{Total Staff})} \times 100\right)$

### B. Congestion-Aware $A^*$ Route Optimization
- Graph representation of primary Hyderabad corridors with edge distance weights.
- Congestion penalty factor $\alpha \ge 1.0$ applied when edges intersect active severe or heavy traffic zones:
  $$w_{\text{effective}} = \text{Distance} \times \left(1 + \frac{\text{Density}}{50}\right)$$
- Heuristic function $h(n)$ computes Haversine great-circle distance to the destination.
- Produces both primary optimal route and alternate bypass route with turn-by-turn waypoints.

### C. Diurnal Demand Forecasting
- Combines historical booking records with a sinusoidal time-of-day demand curve peaking during commuter rush hours (08:00–10:00 and 17:00–20:00).
- Calculates projected hourly deficit by contrasting predicted incoming reservations against currently unreserved, available depot stock.

### D. Automated Autonomous Simulation Engine
- Runs as an asynchronous background task inside the FastAPI application process.
- Updates 100+ simulated vehicles every $2.0$ seconds:
  - Interpolates GPS coordinates towards destination waypoints.
  - Reduces velocity when traversing coordinates designated under `HEAVY` or `SEVERE` traffic zones.
  - Drains battery and fuel proportionally to distance and velocity.
  - Automatically completes trips upon reaching depot geofences and enqueues vehicles into the cleaning turnaround pipeline.
- Broadcasts updates across the `/ws/fleet` WebSocket channel.

---

## 3. Real-Time Communication Architecture (WebSockets)

- **Connection Manager**: Thread-safe channel pub/sub system with automatic disconnected client pruning.
- **Channels**:
  - `/ws/fleet`: Real-time vehicle coordinate updates, velocity changes, and heading angles.
  - `/ws/dashboard`: Executive KPI snapshots and live revenue increments.
  - `/ws/traffic`: Traffic zone congestion level updates and incident alerts.
  - `/ws/notifications`: Instant anomaly and violation event delivery.
  - `/ws/warehouse/{id}`: Depot-specific workload score shifts and queue adjustments.
