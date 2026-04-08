"""Seed starter vehicles and Odyssey service history if DB is empty."""
import uuid
from database import get_db

STARTER_VEHICLES = [
    {"year": 2012, "make": "Honda", "model": "Odyssey", "trim": "EX", "color": "Silver",
     "vin": "5FNRL5H60CB117944", "license": "BDR5508", "current_mileage": 185000, "engine": "V6"},
    {"year": 2014, "make": "Honda", "model": "CR-V", "trim": "", "color": "", "vin": "",
     "license": "", "current_mileage": 0, "engine": "V6"},
    {"year": 2019, "make": "Honda", "model": "Accord", "trim": "", "color": "", "vin": "",
     "license": "", "current_mileage": 0, "engine": "4cyl"},
]

ODYSSEY_RECORDS = [
    {"date": "2018-04-16", "mileage": 84569, "shop": "Shockley Honda - Frederick, MD",
     "invoice_number": "547501", "total_cost": 55.60, "source": "pdf_upload",
     "notes": "Complimentary multi-point inspection",
     "services": [
         {"description": "Oil & filter change (0W20)", "category": "routine", "cost": 55.60},
         {"description": "Safety recall: second row outer seat striker bracket (18-021)", "category": "recall", "cost": 0},
     ]},
    {"date": "2018-07-18", "mileage": 89717, "shop": "Shockley Honda - Frederick, MD",
     "invoice_number": "555476", "total_cost": 1233.81, "source": "pdf_upload",
     "notes": "Humming noise from LF wheel; vibration at highway speeds. Customer declined 90K service.",
     "services": [
         {"description": "Left front wheel bearing replaced", "category": "repair", "cost": 376.36},
         {"description": "All 4 rotors turned (resurfaced)", "category": "brakes", "cost": 464.95},
         {"description": "Oil & filter change (0W20)", "category": "routine", "cost": 55.96},
         {"description": "Transmission fluid drain & refill", "category": "fluid", "cost": 142.18},
         {"description": "Brake fluid exchange (BG DOT4)", "category": "fluid", "cost": 139.98},
         {"description": "Engine air filter replaced", "category": "routine", "cost": 30.00},
         {"description": "Cabin air filter replaced", "category": "routine", "cost": 30.00},
         {"description": "Military discount", "category": "discount", "cost": -128.71},
         {"description": "Miscellaneous fees", "category": "fees", "cost": 43.18},
         {"description": "Sales tax", "category": "fees", "cost": 20.27},
     ]},
    {"date": "2018-08-27", "mileage": 92434, "shop": "Shockley Honda - Frederick, MD",
     "invoice_number": "558772", "total_cost": 147.00, "source": "pdf_upload",
     "notes": "Battery failed load test; only 3.29V and 0 CCA. Alternator tested good.",
     "services": [
         {"description": "Battery replaced (24F/550CCA)", "category": "repair", "cost": 147.00},
     ]},
    {"date": "2018-12-28", "mileage": 97446, "shop": "Shockley Honda - Frederick, MD",
     "invoice_number": "569119", "total_cost": 835.00, "source": "pdf_upload",
     "notes": "Steering wheel stiff at 60+ MPH. Power steering pump found leaking.",
     "services": [
         {"description": "Power steering pump replaced", "category": "repair", "cost": 780.00},
         {"description": "Oil & filter change (0W20)", "category": "routine", "cost": 50.04},
         {"description": "Military discount", "category": "discount", "cost": -89.22},
         {"description": "Miscellaneous fees", "category": "fees", "cost": 2.83},
     ]},
    {"date": "2019-06-29", "mileage": 103495, "shop": "Shockley Honda - Frederick, MD",
     "invoice_number": "584065", "total_cost": 1037.00, "source": "pdf_upload",
     "notes": "First timing belt service. 6-cylinder interval every 85,000 mi.",
     "services": [
         {"description": "Timing belt replacement (6-cyl)", "category": "major", "cost": 515.00},
         {"description": "Drive belt (serpentine) replacement", "category": "major", "cost": 71.25},
         {"description": "Water pump replacement", "category": "major", "cost": 210.98},
         {"description": "Timing belt tensioner replacement", "category": "major", "cost": 201.05},
         {"description": "Coolant replacement (Type 2 Blue)", "category": "fluid", "cost": 38.46},
         {"description": "Oil & filter change (0W20)", "category": "routine", "cost": 55.60},
     ]},
    {"date": "2019-10-24", "mileage": 110271, "shop": "Shockley Honda - Frederick, MD",
     "invoice_number": "593967", "total_cost": 199.55, "source": "pdf_upload",
     "notes": "A/B 1-2 service. All military discounts applied.",
     "services": [
         {"description": "Oil & filter change (0W20)", "category": "routine", "cost": 53.95},
         {"description": "Engine air filter replaced", "category": "routine", "cost": 24.00},
         {"description": "Cabin air filter replaced", "category": "routine", "cost": 24.00},
         {"description": "Tire rotation & inspection", "category": "routine", "cost": 26.95},
         {"description": "Military discounts applied", "category": "discount", "cost": -18.00},
         {"description": "Miscellaneous fees + tax", "category": "fees", "cost": 10.65},
     ]},
    {"date": "2019-11-04", "mileage": 110594, "shop": "Shockley Honda - Frederick, MD",
     "invoice_number": "594796", "total_cost": 580.00, "source": "pdf_upload",
     "notes": "Vibration when braking at highway speeds; warped rotors confirmed.",
     "services": [
         {"description": "Front brake rotors replaced (x2)", "category": "brakes", "cost": 490.10},
         {"description": "Brake pads sanded to correct fit", "category": "brakes", "cost": 125.00},
         {"description": "Tire balance (all 4)", "category": "routine", "cost": 89.95},
     ]},
    {"date": "2022-02-12", "mileage": 143378, "shop": "Casey Honda - Newport News, VA",
     "invoice_number": "HOCS682187", "total_cost": 1145.67, "source": "pdf_upload",
     "notes": "Clicking noise when turning; LF axle loosing grease, RF axle had play. Both replaced.",
     "services": [
         {"description": "Both front CV axles (drive axle assemblies) replaced", "category": "repair", "cost": 1156.77},
         {"description": "Multi-point inspection", "category": "routine", "cost": 0},
         {"description": "Meet or beat / military discount", "category": "discount", "cost": -43.71},
         {"description": "Environmental fee", "category": "fees", "cost": 71.96},
         {"description": "Military discount (10%)", "category": "discount", "cost": -115.67},
         {"description": "Sales tax", "category": "fees", "cost": 32.61},
     ]},
    {"date": "2022-07-14", "mileage": 144089, "shop": "Casey Honda - Newport News, VA",
     "invoice_number": "HOCS738710", "total_cost": 99.99, "source": "pdf_upload",
     "notes": "Clicking when steering. Grease added to column shaft splines. May need shaft replacement if noise returns.",
     "services": [
         {"description": "Steering column intermediate shaft greased (splines)", "category": "repair", "cost": 99.99},
         {"description": "Multi-point inspection", "category": "routine", "cost": 0},
     ]},
    {"date": "2022-12-18", "mileage": 148000, "shop": "Costco Tire Center - Newport News, VA",
     "invoice_number": "2470314997", "total_cost": 0, "source": "pdf_upload",
     "notes": "Member service. Tires: 1B9H2O59X1023 x4.",
     "services": [
         {"description": "Tire rotation", "category": "routine", "cost": 0},
         {"description": "Nitrogen tire inflation", "category": "routine", "cost": 0},
         {"description": "Balance warranty service", "category": "routine", "cost": 0},
     ]},
    {"date": "2023-09-11", "mileage": 161424, "shop": "Casey Honda - Newport News, VA",
     "invoice_number": "HOCS890957", "total_cost": 2116.34, "source": "pdf_upload",
     "notes": "Brakes smoking and vibrating. TPMS light on (sensor may be failing). Customer approved additional $1,298.55.",
     "services": [
         {"description": "Oil & filter change (0W20)", "category": "routine", "cost": 54.95},
         {"description": "Coolant system flush (2 gal Type 2)", "category": "fluid", "cost": 199.95},
         {"description": "Transmission fluid exchange (MOC ATF)", "category": "fluid", "cost": 232.67},
         {"description": "Spark plugs x6 replaced (premium)", "category": "major", "cost": 329.79},
         {"description": "Front brake pads & rotors replaced", "category": "brakes", "cost": 566.01},
         {"description": "Rear brake pads & rotors replaced", "category": "brakes", "cost": 606.72},
         {"description": "Multi-point inspection", "category": "routine", "cost": 0},
         {"description": "Military discount", "category": "discount", "cost": -50.00},
         {"description": "Environmental fees", "category": "fees", "cost": 112.76},
         {"description": "Sales tax", "category": "fees", "cost": 63.49},
     ]},
    {"date": "2023-09-12", "mileage": 161426, "shop": "Casey Honda - Newport News, VA",
     "invoice_number": "HOCS891177", "total_cost": 0, "source": "pdf_upload",
     "notes": "Warranty follow-up. Front right rotor had hot spot/smoke. Replaced at no charge.",
     "services": [
         {"description": "Front rotors replaced (warranty follow-up — hot spot/smoke)", "category": "brakes", "cost": 0},
     ]},
    {"date": "2024-10-29", "mileage": 168669, "shop": "Costco Tire Center - Newport News, VA",
     "invoice_number": "2470350814", "total_cost": 0, "source": "pdf_upload",
     "notes": "Member service. Tires: 1B9H2O59X1023 x4. Odometer 168,669.",
     "services": [
         {"description": "Tire rotation", "category": "routine", "cost": 0},
         {"description": "Nitrogen tire inflation", "category": "routine", "cost": 0},
         {"description": "Balance warranty service", "category": "routine", "cost": 0},
     ]},
    {"date": "2025-07-25", "mileage": 178259, "shop": "Pep Boys - Carteret, NJ",
     "invoice_number": "2197380", "total_cost": 1725.67, "source": "pdf_upload",
     "notes": "Oil change provided free (satisfaction). NJ location while traveling.",
     "services": [
         {"description": "Spark plugs x6 replaced (Double Iridium)", "category": "major", "cost": 317.94},
         {"description": "Ignition coils x6 replaced", "category": "major", "cost": 983.94},
         {"description": "3-step BG fuel system cleaning", "category": "routine", "cost": 149.95},
         {"description": "Engine diagnostic", "category": "repair", "cost": 99.99},
         {"description": "Oil & filter change (0W20 Pennzoil Platinum)", "category": "routine", "cost": 0},
         {"description": "PepGuard extended labor warranty", "category": "fees", "cost": 31.62},
         {"description": "Shop fee + tax", "category": "fees", "cost": 142.23},
     ]},
    {"date": "2025-11-04", "mileage": 181239, "shop": "Priority Honda Hampton - Hampton, VA",
     "invoice_number": "705141", "total_cost": 700.00, "source": "pdf_upload",
     "notes": "Customer declined coolant exchange. Clicking noise when hitting gas from stop — could not duplicate.",
     "services": [
         {"description": "Oil & filter change (0W20 synthetic blend), 15-pt inspection, battery test", "category": "routine", "cost": 84.95},
         {"description": "Brake fluid service & system bleed (Maintenance Minder 7)", "category": "fluid", "cost": 169.95},
         {"description": "Spring seat repair — both sides (damaged)", "category": "repair", "cost": 405.02},
         {"description": "Diagnose clicking noise (could not duplicate)", "category": "repair", "cost": 50.00},
     ]},
    {"date": "2026-03-30", "mileage": 185000, "shop": "Priority Honda Hampton - Hampton, VA",
     "invoice_number": "PENDING", "total_cost": 2200.00, "source": "manual",
     "notes": "PENDING — service completed 2026-03-30. Second timing belt at 185K miles. First was at 103,495 mi (Jun 2019).",
     "services": [
         {"description": "Timing belt replacement (6-cyl, 2nd replacement)", "category": "major", "cost": 1200.00},
         {"description": "Drive belt (serpentine) replacement", "category": "major", "cost": 120.00},
         {"description": "Water pump replacement", "category": "major", "cost": 400.00},
         {"description": "Timing belt tensioner replacement", "category": "major", "cost": 280.00},
         {"description": "Coolant flush", "category": "fluid", "cost": 200.00},
     ]},
]

def seed_if_empty():
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM vehicles").fetchone()[0]
    if count > 0:
        conn.close()
        return

    odyssey_id = None
    for v in STARTER_VEHICLES:
        vid = str(uuid.uuid4())
        if v['vin'] == '5FNRL5H60CB117944':
            odyssey_id = vid
        conn.execute("""
            INSERT INTO vehicles (id, year, make, model, trim, color, vin, license, current_mileage, engine)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (vid, v['year'], v['make'], v['model'], v['trim'], v['color'],
              v['vin'], v['license'], v['current_mileage'], v['engine']))

    if odyssey_id:
        for r in ODYSSEY_RECORDS:
            rid = str(uuid.uuid4())
            conn.execute("""
                INSERT INTO service_records (id, vehicle_id, date, mileage, shop, invoice_number, total_cost, notes, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (rid, odyssey_id, r['date'], r['mileage'], r['shop'],
                  r['invoice_number'], r['total_cost'], r['notes'], r['source']))
            for svc in r['services']:
                conn.execute("""
                    INSERT INTO service_items (id, record_id, description, category, cost)
                    VALUES (?, ?, ?, ?, ?)
                """, (str(uuid.uuid4()), rid, svc['description'], svc['category'], svc['cost']))

    conn.commit()
    conn.close()
    print("Database seeded with starter data.")
