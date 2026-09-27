import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus
from app.models.warehouse import Warehouse, WarehouseStatus
from app.models.vehicle import Vehicle, VehicleType, VehicleStatus
from app.models.booking import Booking, BookingStatus, PaymentStatus
from app.models.staff import Staff, StaffShift, StaffWorkingStatus
from app.models.maintenance import MaintenanceRecord, MaintenanceType, MaintenanceStatus, CleaningTask, CleaningStatus
from app.models.traffic import TrafficZone, TrafficIncident, CongestionLevel
from app.models.notification import Alert, AlertType, AlertSeverity
from app.models.redistribution import RedistributionRecommendation, RecommendationPriority, RecommendationStatus
from app.services.warehouse_service import WarehouseService

def seed_database():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains records. Skipping initial seeding.")
            return

        print("Seeding RollNRide database with enterprise dataset...")

        # 1. Create Core Users & Demo Accounts
        default_pwd = get_password_hash("Admin123!")
        mgr_pwd = get_password_hash("Manager123!")
        wh_pwd = get_password_hash("Warehouse123!")
        fleet_pwd = get_password_hash("Fleet123!")
        cust_pwd = get_password_hash("Customer123!")

        demo_users = [
            User(name="System Administrator", email="admin@rollnride.com", phone="+91 98765 43210", password_hash=default_pwd, role=UserRole.ADMIN),
            User(name="Operations Director", email="manager@rollnride.com", phone="+91 98765 43211", password_hash=mgr_pwd, role=UserRole.OPERATIONS_MANAGER),
            User(name="Warehouse Lead", email="warehouse@rollnride.com", phone="+91 98765 43212", password_hash=wh_pwd, role=UserRole.WAREHOUSE_MANAGER),
            User(name="Fleet Supervisor", email="fleet@rollnride.com", phone="+91 98765 43213", password_hash=fleet_pwd, role=UserRole.FLEET_MANAGER),
            User(name="Aarav Sharma", email="customer@rollnride.com", phone="+91 98765 43214", password_hash=cust_pwd, role=UserRole.CUSTOMER),
        ]
        db.add_all(demo_users)
        db.commit()

        # Create 45 additional customers
        first_names = ["Rohan", "Priya", "Vikram", "Sneha", "Aditya", "Neha", "Rahul", "Ananya", "Karthik", "Divya",
                       "Siddharth", "Meera", "Arjun", "Pooja", "Varun", "Tanvi", "Amit", "Rhea", "Manish", "Ishaan"]
        last_names = ["Reddy", "Rao", "Verma", "Gupta", "Nair", "Patel", "Mehta", "Iyer", "Kumar", "Choudhury"]

        customers = []
        for i in range(1, 46):
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            email = f"user{i}@example.com"
            cust = User(
                name=name,
                email=email,
                phone=f"+91 98{random.randint(10000000, 99999999)}",
                password_hash=cust_pwd,
                role=UserRole.CUSTOMER,
                status=UserStatus.ACTIVE
            )
            customers.append(cust)
        db.add_all(customers)
        db.commit()

        # 2. Seed 5 Warehouses across Hyderabad
        warehouse_data = [
            {
                "name": "Hitec City Mobility Hub",
                "code": "WH-HYD-01",
                "address": "Cyber Towers Road, Hitec City, Hyderabad 500081",
                "latitude": 17.4504,
                "longitude": 78.3814,
                "capacity": 120,
            },
            {
                "name": "Gachibowli Logistics Center",
                "code": "WH-HYD-02",
                "address": "Financial District, Gachibowli, Hyderabad 500032",
                "latitude": 17.4399,
                "longitude": 78.3489,
                "capacity": 100,
            },
            {
                "name": "Banjara Hills Transit Depot",
                "code": "WH-HYD-03",
                "address": "Road No. 12, Banjara Hills, Hyderabad 500034",
                "latitude": 17.4156,
                "longitude": 78.4357,
                "capacity": 80,
            },
            {
                "name": "Secunderabad North Station",
                "code": "WH-HYD-04",
                "address": "SP Road, Secunderabad, Hyderabad 500003",
                "latitude": 17.4399,
                "longitude": 78.4983,
                "capacity": 90,
            },
            {
                "name": "Airport Shamshabad Gateway",
                "code": "WH-HYD-05",
                "address": "RGIA Airport Approach Road, Shamshabad, Hyderabad 500409",
                "latitude": 17.2403,
                "longitude": 78.4294,
                "capacity": 150,
            }
        ]

        warehouses = []
        for wd in warehouse_data:
            wh = Warehouse(**wd)
            warehouses.append(wh)
            db.add(wh)
        db.commit()

        # 3. Seed Vehicle Types
        v_types_data = [
            {
                "name": "Eco Urban Scooter",
                "category": "TWO_WHEELER",
                "hourly_rate": 60.0,
                "daily_rate": 399.0,
                "seating_capacity": 2,
                "range_km": 95.0,
                "fuel_type": "ELECTRIC",
                "image_url": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
                "specifications": "Top speed 65 km/h, regenerative braking, smart phone mount, 2.5 kWh lithium-ion battery"
            },
            {
                "name": "Commuter Electric Bike",
                "category": "TWO_WHEELER",
                "hourly_rate": 80.0,
                "daily_rate": 499.0,
                "seating_capacity": 2,
                "range_km": 120.0,
                "fuel_type": "ELECTRIC",
                "image_url": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80",
                "specifications": "Fast charging 0-80% in 45 min, disc brakes, 3.5 kW peak motor, dual helmet trunk"
            },
            {
                "name": "Cruiser Standard Bike",
                "category": "TWO_WHEELER",
                "hourly_rate": 90.0,
                "daily_rate": 599.0,
                "seating_capacity": 2,
                "range_km": 350.0,
                "fuel_type": "PETROL",
                "image_url": "https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=600&q=80",
                "specifications": "200cc fuel injected engine, ABS dual channel, comfortable touring saddle"
            },
            {
                "name": "City Sedan EV",
                "category": "FOUR_WHEELER",
                "hourly_rate": 220.0,
                "daily_rate": 1899.0,
                "seating_capacity": 5,
                "range_km": 315.0,
                "fuel_type": "ELECTRIC",
                "image_url": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
                "specifications": "Automatic drive, touchscreen infotainment, 360 camera, fast DC charging ready, 428L boot space"
            },
            {
                "name": "Electric Premium SUV",
                "category": "FOUR_WHEELER",
                "hourly_rate": 340.0,
                "daily_rate": 2899.0,
                "seating_capacity": 5,
                "range_km": 420.0,
                "fuel_type": "ELECTRIC",
                "image_url": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
                "specifications": "All-wheel drive, panoramic sunroof, level-2 ADAS safety, cooled seats, wireless charging"
            },
            {
                "name": "Executive Luxury Sedan",
                "category": "FOUR_WHEELER",
                "hourly_rate": 450.0,
                "daily_rate": 3999.0,
                "seating_capacity": 5,
                "range_km": 500.0,
                "fuel_type": "HYBRID",
                "image_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
                "specifications": "Leather upholstery, premium sound system, whisper-quiet cabin, hybrid efficiency 24 km/l"
            }
        ]

        v_types = []
        for vtd in v_types_data:
            vt = VehicleType(**vtd)
            v_types.append(vt)
            db.add(vt)
        db.commit()

        # 4. Seed 20 Warehouse Staff Members
        staff_roles = ["Dispatcher", "Maintenance Tech", "Fleet Inspector", "Sanitization Specialist"]
        shifts = [StaffShift.MORNING, StaffShift.EVENING, StaffShift.NIGHT]

        for i in range(1, 21):
            wh = warehouses[(i - 1) % len(warehouses)]
            s_user = User(
                name=f"Staff Member {i}",
                email=f"staff{i}@rollnride.com",
                phone=f"+91 97{random.randint(10000000, 99999999)}",
                password_hash=get_password_hash("Staff123!"),
                role=UserRole.STAFF,
                status=UserStatus.ACTIVE
            )
            db.add(s_user)
            db.commit()

            staff_entry = Staff(
                user_id=s_user.id,
                warehouse_id=wh.id,
                employee_code=f"EMP-{wh.code[-2:]}-{i:03d}",
                shift=shifts[i % 3],
                working_status=StaffWorkingStatus.ON_DUTY if i % 4 != 0 else StaffWorkingStatus.ASSIGNED,
                efficiency_score=round(random.uniform(85.0, 98.0), 1),
                current_task=random.choice(staff_roles) if i % 4 == 0 else None,
                tasks_completed_today=random.randint(4, 16)
            )
            db.add(staff_entry)
        db.commit()

        # 5. Seed 105 Vehicles across the 5 Warehouses
        vehicle_brands = {
            "Eco Urban Scooter": [("Ather", "450X"), ("Ola", "S1 Pro"), ("TVS", "iQube")],
            "Commuter Electric Bike": [("Revolt", "RV400"), ("Ultraviolette", "F77"), ("Tork", "Kratos")],
            "Cruiser Standard Bike": [("Royal Enfield", "Hunter 350"), ("Honda", "Hness CB350"), ("Bajaj", "Dominar 400")],
            "City Sedan EV": [("Tata", "Tigor EV"), ("Citroen", "eC3"), ("MG", "Comet EV")],
            "Electric Premium SUV": [("Tata", "Nexon EV"), ("Hyundai", "Kona Electric"), ("BYD", "Atto 3")],
            "Executive Luxury Sedan": [("Toyota", "Camry Hybrid"), ("Skoda", "Superb"), ("BMW", "3 Series Gran Limousine")]
        }

        statuses_dist = (
            [VehicleStatus.AVAILABLE] * 55 +
            [VehicleStatus.IN_USE] * 25 +
            [VehicleStatus.RESERVED] * 10 +
            [VehicleStatus.CLEANING] * 5 +
            [VehicleStatus.MAINTENANCE] * 6 +
            [VehicleStatus.RETURNED] * 4
        )

        all_vehicles = []
        for i in range(1, 106):
            v_type = random.choice(v_types)
            brand, model = random.choice(vehicle_brands[v_type.name])
            wh = warehouses[i % len(warehouses)]
            v_status = statuses_dist[(i - 1) % len(statuses_dist)]

            # Position: if AVAILABLE/MAINTENANCE -> at warehouse, if IN_USE -> slightly en route
            if v_status in [VehicleStatus.AVAILABLE, VehicleStatus.MAINTENANCE, VehicleStatus.CLEANING, VehicleStatus.RESERVED]:
                lat = wh.latitude + random.uniform(-0.003, 0.003)
                lng = wh.longitude + random.uniform(-0.003, 0.003)
                speed = 0.0
            else:
                lat = wh.latitude + random.uniform(-0.04, 0.04)
                lng = wh.longitude + random.uniform(-0.04, 0.04)
                speed = random.uniform(22.0, 52.0)

            v = Vehicle(
                registration_number=f"TS 09 RNR {1000 + i}",
                vehicle_type_id=v_type.id,
                brand=brand,
                model=model,
                year=random.choice([2023, 2024]),
                color=random.choice(["White", "Silver", "Matte Black", "Ocean Blue", "Crimson Red"]),
                warehouse_id=wh.id,
                status=v_status,
                current_latitude=lat,
                current_longitude=lng,
                current_speed=round(speed, 1),
                heading=round(random.uniform(0, 360), 1),
                battery_level=round(random.uniform(45.0, 100.0) if v_status != VehicleStatus.MAINTENANCE else random.uniform(10.0, 30.0), 1),
                fuel_level=round(random.uniform(60.0, 100.0), 1),
                mileage=round(random.uniform(500.0, 15000.0), 1),
                last_location_update=datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 15))
            )
            all_vehicles.append(v)
            db.add(v)
        db.commit()

        # 6. Seed 500+ Historical Bookings
        all_customers = db.query(User).filter(User.role == UserRole.CUSTOMER).all()
        now = datetime.now(timezone.utc)

        bookings_to_add = []
        for i in range(1, 520):
            customer = random.choice(all_customers)
            vehicle = random.choice(all_vehicles)
            pickup_wh = warehouses[random.randint(0, len(warehouses) - 1)]
            return_wh = warehouses[random.randint(0, len(warehouses) - 1)]

            days_ago = random.randint(1, 60)
            hours_ago = random.randint(1, 23)
            duration_hours = random.choice([2, 4, 6, 8, 12, 24, 48])

            start_t = now - timedelta(days=days_ago, hours=hours_ago)
            expected_ret_t = start_t + timedelta(hours=duration_hours)
            actual_ret_t = expected_ret_t + timedelta(minutes=random.randint(-15, 30))

            if days_ago == 1 and i % 10 == 0:
                status = BookingStatus.ACTIVE
                actual_ret_t = None
            elif i % 25 == 0:
                status = BookingStatus.CANCELLED
            else:
                status = BookingStatus.COMPLETED

            duration_days = max(1.0, duration_hours / 24.0)
            amount = round(duration_days * vehicle.vehicle_type.daily_rate * 1.18, 2)

            b = Booking(
                booking_reference=f"RNR-HIST-{1000 + i}",
                customer_id=customer.id,
                vehicle_id=vehicle.id,
                pickup_warehouse_id=pickup_wh.id,
                return_warehouse_id=return_wh.id,
                pickup_location="Designated Bay A",
                return_location="Designated Bay B",
                start_time=start_t,
                expected_return_time=expected_ret_t,
                actual_return_time=actual_ret_t,
                status=status,
                total_amount=amount,
                payment_status=PaymentStatus.PAID if status != BookingStatus.CANCELLED else PaymentStatus.REFUNDED,
                created_at=start_t - timedelta(hours=2)
            )
            bookings_to_add.append(b)

        db.add_all(bookings_to_add)
        db.commit()

        # 7. Seed Traffic Zones in Hyderabad
        traffic_zones_data = [
            {"name": "Hitec City IT Corridor", "code": "ZONE-HITEC", "center_lat": 17.4474, "center_lng": 78.3762, "radius_km": 3.0, "current_speed_avg": 24.5, "vehicle_density": 18, "congestion_level": CongestionLevel.HEAVY},
            {"name": "Gachibowli Financial Hub", "code": "ZONE-GACHI", "center_lat": 17.4401, "center_lng": 78.3489, "radius_km": 2.8, "current_speed_avg": 32.0, "vehicle_density": 12, "congestion_level": CongestionLevel.MODERATE},
            {"name": "Jubilee Hills Road 36", "code": "ZONE-JUBIL", "center_lat": 17.4319, "center_lng": 78.4073, "radius_km": 2.2, "current_speed_avg": 28.0, "vehicle_density": 14, "congestion_level": CongestionLevel.MODERATE},
            {"name": "Banjara Hills Junction", "code": "ZONE-BANJA", "center_lat": 17.4156, "center_lng": 78.4357, "radius_km": 2.5, "current_speed_avg": 19.5, "vehicle_density": 16, "congestion_level": CongestionLevel.HEAVY},
            {"name": "Punjagutta Flyover Arterial", "code": "ZONE-PUNJA", "center_lat": 17.4265, "center_lng": 78.4518, "radius_km": 1.8, "current_speed_avg": 13.8, "vehicle_density": 22, "congestion_level": CongestionLevel.SEVERE},
            {"name": "Begumpet Airport Road", "code": "ZONE-BEGUM", "center_lat": 17.4448, "center_lng": 78.4664, "radius_km": 2.4, "current_speed_avg": 36.0, "vehicle_density": 11, "congestion_level": CongestionLevel.MODERATE},
            {"name": "Secunderabad Station Arterial", "code": "ZONE-SECUN", "center_lat": 17.4399, "center_lng": 78.4983, "radius_km": 2.5, "current_speed_avg": 21.0, "vehicle_density": 15, "congestion_level": CongestionLevel.HEAVY},
            {"name": "PVNR Airport Expressway Corridor", "code": "ZONE-PVNR", "center_lat": 17.3100, "center_lng": 78.4000, "radius_km": 5.0, "current_speed_avg": 55.0, "vehicle_density": 9, "congestion_level": CongestionLevel.FREE},
        ]
        for tzd in traffic_zones_data:
            tz = TrafficZone(**tzd)
            db.add(tz)
        db.commit()

        # Seed Active Traffic Incident
        incident = TrafficIncident(
            zone_id=5,
            title="Waterlogging & Stalled Vehicle at Punjagutta Underpass",
            description="Lane 2 blocked near metro pillar 1042. Flow reduced to single file.",
            severity="MAJOR",
            latitude=17.4265,
            longitude=78.4518,
            is_active=True,
            reported_at=now - timedelta(minutes=45)
        )
        db.add(incident)
        db.commit()

        # 8. Seed Maintenance & Cleaning Records
        maint_vehicles = [v for v in all_vehicles if v.status == VehicleStatus.MAINTENANCE]
        for mv in maint_vehicles:
            m = MaintenanceRecord(
                vehicle_id=mv.id,
                warehouse_id=mv.warehouse_id,
                type=random.choice([MaintenanceType.ROUTINE_SERVICE, MaintenanceType.BATTERY_CHECK, MaintenanceType.BRAKE_INSPECTION]),
                description="Routine preventive inspection and brake pad calibration.",
                cost=round(random.uniform(800.0, 3500.0), 2),
                status=MaintenanceStatus.IN_PROGRESS,
                estimated_completion=now + timedelta(hours=random.randint(2, 8))
            )
            db.add(m)

        clean_vehicles = [v for v in all_vehicles if v.status == VehicleStatus.CLEANING]
        for cv in clean_vehicles:
            cl = CleaningTask(
                vehicle_id=cv.id,
                warehouse_id=cv.warehouse_id,
                status=CleaningStatus.IN_PROGRESS,
                duration_minutes=20,
                started_at=now - timedelta(minutes=8)
            )
            db.add(cl)
        db.commit()

        # 9. Seed Initial Redistribution Recommendation
        redist = RedistributionRecommendation(
            source_warehouse_id=warehouses[1].id, # Gachibowli
            destination_warehouse_id=warehouses[0].id, # Hitec City
            vehicle_count=15,
            priority=RecommendationPriority.HIGH,
            reason="Hitec City tech corridor experiencing booking surge (workload > 72%). Gachibowli has 28 surplus idle scooters.",
            estimated_distance_km=6.5,
            status=RecommendationStatus.PENDING
        )
        db.add(redist)

        # 10. Seed Initial Alerts
        alerts_data = [
            Alert(
                type=AlertType.WAREHOUSE_OVERLOAD,
                severity=AlertSeverity.WARNING,
                title="Hitec City Hub Approaching Peak Capacity",
                message="Workload is at 74%. 18 pending dispatches queued for morning rush.",
                entity_type="WAREHOUSE",
                entity_id=warehouses[0].id,
                suggested_action="Transfer surplus inventory from Gachibowli hub."
            ),
            Alert(
                type=AlertType.SEVERE_TRAFFIC,
                severity=AlertSeverity.CRITICAL,
                title="Severe Congestion at Punjagutta Flyover",
                message="Average speed dropped to 13.8 km/h. Automated routing rerouting airport trips via Ring Expressway.",
                entity_type="ZONE",
                entity_id=5,
                suggested_action="Alert customers traveling between Secunderabad and Airport."
            ),
            Alert(
                type=AlertType.LOW_BATTERY,
                severity=AlertSeverity.WARNING,
                title="Low Battery Warning: TS 09 RNR 1018",
                message="Ather 450X battery dropped to 14%. Vehicle currently returning to Banjara Hills hub.",
                entity_type="VEHICLE",
                entity_id=all_vehicles[17].id,
                suggested_action="Assign dedicated charging bay upon arrival."
            )
        ]
        db.add_all(alerts_data)
        db.commit()

        # Compute initial warehouse workloads
        for wh in warehouses:
            WarehouseService.calculate_workload(wh, db)

        print("Successfully seeded RollNRide with 5 depots, 105 vehicles, 20 staff, 500+ bookings, traffic & alerts!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
