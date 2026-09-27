# RollNRide REST & WebSocket API Reference

Base URL: `http://localhost:8000/api`
Interactive Swagger Docs: `http://localhost:8000/docs`

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate with email & password, returns JWT token & user | None |
| `POST` | `/auth/register` | Register a new customer user account | None |
| `GET` | `/auth/me` | Fetch profile details of authenticated user | Bearer Token |
| `POST` | `/auth/refresh` | Refresh an expired access token using refresh token | Bearer Token |

---

## 2. Vehicles & Fleet Inventory (`/vehicles`, `/fleet`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/vehicles/types` | List all vehicle categories, tariffs, and specifications | None |
| `POST` | `/vehicles/types` | Register a new vehicle class tariff | Admin / Fleet Mgr |
| `GET` | `/vehicles` | Query vehicles with status, hub, and fuel type filters | None |
| `GET` | `/vehicles/{id}` | Retrieve individual vehicle specifications and telematics | None |
| `POST` | `/vehicles` | Add a new vehicle to the fleet | Admin / Fleet Mgr |
| `PATCH` | `/vehicles/{id}` | Update vehicle state, depot assignment, or mileage | Admin / Fleet Mgr |
| `GET` | `/fleet/live` | Retrieve live coordinates and telemetry for all active assets | None |
| `GET` | `/fleet/stats` | Aggregate fleet utilization rates and status breakdown | None |

---

## 3. Warehouses & Hub Operations (`/warehouses`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/warehouses` | List all 5 regional distribution hubs with current workload | None |
| `GET` | `/warehouses/{id}` | Detailed hub view with breakdown of the 6 workload factors | None |
| `POST` | `/warehouses` | Register a new distribution warehouse hub | Admin |
| `PATCH` | `/warehouses/{id}` | Update warehouse capacity or operating profile | Admin |

---

## 4. Bookings & Trip Lifecycles (`/bookings`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/bookings/estimate` | Compute dynamic price estimate based on vehicle & duration | None |
| `GET` | `/bookings` | List user bookings (or all for administrators) | Bearer Token |
| `POST` | `/bookings` | Reserve a vehicle at pickup depot | Customer |
| `GET` | `/bookings/{id}` | Retrieve complete booking record with telematics | Bearer Token |
| `POST` | `/bookings/{id}/start` | Unlock vehicle and transition booking to `ACTIVE` | Customer / Admin |
| `POST` | `/bookings/{id}/complete`| Return vehicle to dropoff hub, compute final invoice | Customer / Admin |
| `POST` | `/bookings/{id}/cancel` | Cancel an unstarted reservation | Customer / Admin |

---

## 5. Traffic & $A^*$ Optimization (`/traffic`, `/optimization`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/traffic/live` | Get live congestion scores and densities across road corridors | None |
| `GET` | `/traffic/heatmap` | Retrieve coordinate intensity points for map heatmap display | None |
| `GET` | `/traffic/incidents`| List active bottlenecks, accidents, or construction delays | None |
| `POST` | `/traffic/incidents`| Report a new corridor incident | Admin / Ops Mgr |
| `POST` | `/optimization/route`| Compute congestion-weighted $A^*$ path & alternate route | None |
| `GET` | `/optimization/redistribution` | List AI vehicle redistribution recommendations | Ops Mgr / Admin |
| `POST` | `/optimization/redistribution/{id}/approve` | 1-click approve inter-hub transfer dispatch | Ops Mgr / Admin |
| `POST` | `/optimization/redistribution/{id}/reject` | Dismiss recommendation with logged rationale | Ops Mgr / Admin |

---

## 6. Demand Forecasting (`/forecast`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/forecast/demand` | Get 24h hourly predicted reservations, supply, and net deficit | None |

---

## 7. Turnaround & Maintenance (`/maintenance`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/maintenance` | List repair records and scheduled overhauls | None |
| `POST` | `/maintenance` | Create a work order for vehicle diagnostic repair | Wh Mgr / Fleet Mgr |
| `PATCH` | `/maintenance/{id}`| Mark maintenance order resolved and restore vehicle | Wh Mgr / Fleet Mgr |
| `GET` | `/maintenance/cleaning-queue` | List vehicles in turnaround bay queue | None |
| `POST` | `/maintenance/cleaning-queue/{id}/advance` | 1-click progress vehicle through cleaning state machine | Staff / Wh Mgr |
| `GET` | `/maintenance/metrics` | Retrieve average turnaround duration and queue length | None |

---

## 8. Workforce & Staff (`/staff`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/staff` | List staff members filtered by depot or shift | None |
| `PATCH` | `/staff/{id}` | Update technician shift, status, or bay task assignment | Wh Mgr / Admin |
| `GET` | `/staff/workload` | Aggregate on-duty technician count and efficiency scores | None |

---

## 9. Anomaly Alerts & Notifications (`/notifications`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | List active telemetry and workload alerts | None |
| `PATCH` | `/notifications/{id}/read` | Mark alert acknowledged | None |
| `DELETE` | `/notifications/{id}` | Dismiss and archive alert from center | None |

---

## 10. Autonomous Background Simulation (`/simulation`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/simulation/status` | Check if simulation engine is currently running | None |
| `POST` | `/simulation/toggle` | Start or pause background vehicle movement | None |
| `POST` | `/simulation/speed` | Set simulation speed multiplier ($1\times, 2\times, 5\times, 10\times$) | None |

---

## 11. WebSocket Channels

- `ws://localhost:8000/ws/fleet`: Real-time vehicle telemetry stream
- `ws://localhost:8000/ws/dashboard`: Executive KPI stream
- `ws://localhost:8000/ws/traffic`: Corridor congestion & incident feed
- `ws://localhost:8000/ws/notifications`: System anomaly alert feed
- `ws://localhost:8000/ws/warehouse/{warehouse_id}`: Dedicated depot workload broadcast
