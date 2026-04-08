# CLAUDE.md — Vehicle Maintenance Tracker PWA

## Project Overview
Build a Progressive Web App (PWA) for tracking vehicle maintenance history, upcoming appointments, and cost estimates. The app must be installable on mobile (iOS/Android) and work offline.

## Tech Stack
- React + Vite
- Tailwind CSS
- localStorage for data persistence (no backend)
- PDF.js for invoice parsing
- Vite PWA plugin (vite-plugin-pwa) for service worker + manifest

## Core Features (in priority order)
1. Service history timeline per vehicle
2. Upcoming maintenance reminders based on mileage intervals
3. Mileage-based recommendations using Honda factory schedule
4. Cost estimator based on local Hampton, VA Honda dealership rates
5. PDF invoice upload with auto-parse (extract shop, date, mileage, services)
6. Add / edit / delete vehicles (no hard limit on number of vehicles)

## Vehicle Data Model
```json
{
  "id": "uuid",
  "year": 2012,
  "make": "Honda",
  "model": "Odyssey",
  "trim": "EX",
  "color": "Silver",
  "vin": "5FNRL5H60CB117944",
  "license": "BDR5508",
  "currentMileage": 185000,
  "serviceRecords": []
}
```

## Service Record Data Model
```json
{
  "id": "uuid",
  "date": "2019-06-29",
  "mileage": 103495,
  "shop": "Shockley Honda - Frederick, MD",
  "invoiceNumber": "584065",
  "totalCost": 0,
  "services": [
    { "description": "Timing belt replacement", "category": "major", "cost": 515.00 },
    { "description": "Drive belt replacement", "category": "routine", "cost": 71.25 },
    { "description": "Water pump replacement", "category": "major", "cost": 210.98 },
    { "description": "Timing belt tensioner", "category": "major", "cost": 201.05 },
    { "description": "Coolant replacement", "category": "fluid", "cost": 38.46 }
  ],
  "notes": "",
  "source": "manual | pdf_upload"
}
```

## Starter Vehicles
Pre-load these three vehicles on first launch:

```json
[
  {
    "year": 2012, "make": "Honda", "model": "Odyssey", "trim": "EX",
    "color": "Silver", "vin": "5FNRL5H60CB117944", "license": "BDR5508",
    "currentMileage": 185000
  },
  {
    "year": 2014, "make": "Honda", "model": "CR-V", "trim": "",
    "color": "", "vin": "", "license": "",
    "currentMileage": 0
  },
  {
    "year": 2019, "make": "Honda", "model": "Accord", "trim": "",
    "color": "", "vin": "", "license": "",
    "currentMileage": 0
  }
]
```

## Pre-Loaded Service History — 2012 Honda Odyssey
Load all records below into the Odyssey on first launch:

| Date | Mileage | Shop | Services | Cost |
|------|---------|------|----------|------|
| 2018-04-16 | 84569 | Shockley Honda, Frederick MD | Oil change, safety recall seat striker bracket | ~55 |
| 2018-07-18 | 89717 | Shockley Honda, Frederick MD | LF wheel bearing replaced, all 4 rotors turned, oil change | ~465 |
| 2018-08-27 | 92434 | Shockley Honda, Frederick MD | Battery replaced | ~147 |
| 2018-12-28 | 97446 | Shockley Honda, Frederick MD | Power steering pump replaced, oil change | ~835 |
| 2019-06-29 | 103495 | Shockley Honda, Frederick MD | Timing belt, drive belt, water pump, tensioner, coolant | ~1037 |
| 2019-10-24 | 110271 | Shockley Honda, Frederick MD | Oil change, air filter, cabin filter, tire rotation | ~200 |
| 2019-11-04 | 110594 | Shockley Honda, Frederick MD | Front rotors replaced, tire balance | ~580 |
| 2022-02-12 | 143378 | Casey Honda, Newport News VA | Both front CV axles replaced | ~1146 |
| 2022-07-14 | 14089 | Casey Honda, Newport News VA | Steering column intermediate shaft greased | ~100 |
| 2022-12-18 | 168000 | Costco Tire Center, Newport News VA | Tire rotation, nitrogen inflation | $0 |
| 2023-09-11 | 161424 | Casey Honda, Newport News VA | Oil change, coolant flush, trans flush, spark plugs x6, ignition coils x6, front/rear brake pads and rotors | ~2116 |
| 2023-09-12 | 161426 | Casey Honda, Newport News VA | Rotors replaced (warranty follow-up) | $0 |
| 2024-10-29 | 168669 | Costco Tire Center, Newport News VA | Tire rotation, nitrogen inflation | $0 |
| 2025-07-25 | 178259 | Pep Boys, Carteret NJ | Spark plugs x6, ignition coils x6, fuel system clean, oil change | ~1726 |
| 2025-11-04 | 181239 | Priority Honda Hampton, Hampton VA | Oil change, brake fluid service, spring seat repair (both), clicking noise diagnosis | ~700 |
| 2026-03-30 | 185000 | Priority Honda Hampton, Hampton VA | Timing belt, drive belt, water pump, tensioner (PENDING - today) | ~2200 |

## Honda Maintenance Schedule (apply to all Honda vehicles)
Use mileage-based triggers. Show as upcoming when within 2000 miles of due date.

| Service | Interval | Estimated Cost (Hampton VA dealer) |
|---------|----------|-------------------------------------|
| Oil & filter change | Every 5,000 mi | $85 |
| Tire rotation | Every 7,500 mi | $30 |
| Air filter | Every 15,000 mi | $40 |
| Cabin air filter | Every 15,000 mi | $35 |
| Brake fluid | Every 30,000 mi / 3 yrs | $130 |
| Transmission fluid | Every 30,000 mi | $150 |
| Coolant flush | Every 60,000 mi | $120 |
| Spark plugs | Every 60,000 mi | $300 (V6) / $180 (4cyl) |
| Timing belt + water pump + tensioner | Every 85,000 mi (V6 only) | $1,800 dealer / $1,000 indie |
| Drive belt (serpentine) | Every 85,000 mi | $120 |
| Brake pads front | Every 40,000 mi | $200 |
| Brake pads rear | Every 50,000 mi | $200 |
| Rotors (if worn) | As needed | $300 per axle |

Note: 2012 Odyssey and 2014 CR-V have V6 engines. 2019 Accord may be 4-cyl or V6 — default to 4-cyl unless user specifies.

## PDF Invoice Auto-Parse Logic
When user uploads a PDF, extract:
- Invoice date
- Mileage in/out
- Shop name and address
- Each service line with description and cost
- Total paid

Use PDF.js (pdfjs-dist) to extract raw text, then parse with regex patterns for:
- Date: look for MM/DD/YY or MMDDYY patterns near "INV. DATE" or "DATE"
- Mileage: look for 5-6 digit numbers near "MILEAGE IN/OUT" or "ODOMETER"
- Shop: first lines of document header
- Services: lines with dollar amounts

Show a confirmation screen before saving — let user correct any fields.

## UI/UX Notes
- Mobile-first layout
- Bottom tab navigation: Vehicles | History | Upcoming | Add Record
- Each vehicle card shows: year/make/model, current mileage, last service date, next due service
- History screen: filterable by vehicle, date range, service category
- Upcoming screen: sorted by urgency (overdue first, then by mileage gap)
- Cost estimator: shows estimated cost for next 12 months of maintenance
- Color coding: red = overdue, amber = due within 1000 mi, green = on track
- Allow adding unlimited vehicles via a "Add Vehicle" button

## Local Storage Keys
- `vmtracker_vehicles` — array of vehicle objects
- `vmtracker_records` — array of service records
- `vmtracker_settings` — user preferences

## File Structure
```
src/
  components/
    VehicleCard.jsx
    ServiceTimeline.jsx
    UpcomingReminders.jsx
    CostEstimator.jsx
    PDFUploader.jsx
    AddVehicleForm.jsx
  pages/
    Dashboard.jsx
    VehicleDetail.jsx
    AddRecord.jsx
  utils/
    maintenanceSchedule.js
    pdfParser.js
    storage.js
  data/
    odysseyRecords.js
    starterVehicles.js
  App.jsx
  main.jsx
public/
  manifest.json
  icons/
vite.config.js
```

## Session Notes
- Denis is active duty Air Force Captain, based at Langley AFB (Hampton, VA)
- Primary dealership: Priority Honda Hampton, 4115 W Mercury Blvd, Hampton VA 23666
- He gets a military discount at Honda dealers — note this in cost estimates
- The 2012 Odyssey just hit ~185K miles today (March 30, 2026)
- Timing belt on the Odyssey was last done at 103K (Jun 2019) — today's visit is the second timing belt
- Always present a plan and get approval before building
