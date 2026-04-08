from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import uuid
import os
import base64
import shutil
from pathlib import Path

from database import init_db, get_db, get_all_vehicles, get_vehicle, get_vehicle_records, get_record_with_services, IMAGES_DIR
from seed import seed_if_empty

app = FastAPI(title="MyCars API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Init DB on startup
@app.on_event("startup")
def startup():
    init_db()
    seed_if_empty()

# ── Pydantic models ──────────────────────────────────────────────

class ServiceItem(BaseModel):
    id: Optional[str] = None
    description: str
    category: str = "routine"
    cost: float = 0

class VehicleCreate(BaseModel):
    year: int
    make: str
    model: str
    trim: str = ""
    color: str = ""
    vin: str = ""
    license: str = ""
    current_mileage: int = 0
    engine: str = "4cyl"
    photo_id: Optional[str] = None

class VehicleUpdate(VehicleCreate):
    id: str

class RecordCreate(BaseModel):
    vehicle_id: str
    date: str
    mileage: int = 0
    shop: str = ""
    invoice_number: str = ""
    total_cost: float = 0
    notes: str = ""
    source: str = "manual"
    services: List[ServiceItem] = []
    photo_ids: List[str] = []

class RecordUpdate(RecordCreate):
    id: str

class MigratePayload(BaseModel):
    vehicles: list = []
    records: list = []
    images: dict = {}

# ── Vehicles ─────────────────────────────────────────────────────

@app.get("/api/vehicles")
def list_vehicles():
    conn = get_db()
    vehicles = get_all_vehicles(conn)
    conn.close()
    return vehicles

@app.post("/api/vehicles", status_code=201)
def create_vehicle(data: VehicleCreate):
    conn = get_db()
    vid = str(uuid.uuid4())
    conn.execute("""
        INSERT INTO vehicles (id, year, make, model, trim, color, vin, license, current_mileage, engine, photo_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (vid, data.year, data.make, data.model, data.trim, data.color,
          data.vin, data.license, data.current_mileage, data.engine, data.photo_id))
    conn.commit()
    vehicle = get_vehicle(conn, vid)
    conn.close()
    return vehicle

@app.put("/api/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: str, data: VehicleUpdate):
    conn = get_db()
    conn.execute("""
        UPDATE vehicles SET year=?, make=?, model=?, trim=?, color=?, vin=?, license=?,
        current_mileage=?, engine=?, photo_id=? WHERE id=?
    """, (data.year, data.make, data.model, data.trim, data.color, data.vin,
          data.license, data.current_mileage, data.engine, data.photo_id, vehicle_id))
    conn.commit()
    vehicle = get_vehicle(conn, vehicle_id)
    conn.close()
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")
    return vehicle

@app.delete("/api/vehicles/{vehicle_id}", status_code=204)
def delete_vehicle(vehicle_id: str):
    conn = get_db()
    conn.execute("DELETE FROM vehicles WHERE id=?", (vehicle_id,))
    conn.commit()
    conn.close()

# ── Records ──────────────────────────────────────────────────────

@app.get("/api/vehicles/{vehicle_id}/records")
def list_records(vehicle_id: str):
    conn = get_db()
    records = get_vehicle_records(conn, vehicle_id)
    conn.close()
    return records

@app.post("/api/records", status_code=201)
def create_record(data: RecordCreate):
    conn = get_db()
    rid = str(uuid.uuid4())
    conn.execute("""
        INSERT INTO service_records (id, vehicle_id, date, mileage, shop, invoice_number, total_cost, notes, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (rid, data.vehicle_id, data.date, data.mileage, data.shop,
          data.invoice_number, data.total_cost, data.notes, data.source))
    for svc in data.services:
        conn.execute("""
            INSERT INTO service_items (id, record_id, description, category, cost)
            VALUES (?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), rid, svc.description, svc.category, svc.cost))
    for photo_id in data.photo_ids:
        conn.execute("INSERT INTO record_photos (record_id, image_id) VALUES (?, ?)", (rid, photo_id))
    conn.commit()
    record = get_record_with_services(conn, rid)
    conn.close()
    return record

@app.put("/api/records/{record_id}")
def update_record(record_id: str, data: RecordUpdate):
    conn = get_db()
    conn.execute("""
        UPDATE service_records SET date=?, mileage=?, shop=?, invoice_number=?, total_cost=?, notes=?, source=?
        WHERE id=?
    """, (data.date, data.mileage, data.shop, data.invoice_number, data.total_cost, data.notes, data.source, record_id))
    conn.execute("DELETE FROM service_items WHERE record_id=?", (record_id,))
    for svc in data.services:
        conn.execute("""
            INSERT INTO service_items (id, record_id, description, category, cost)
            VALUES (?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), record_id, svc.description, svc.category, svc.cost))
    conn.execute("DELETE FROM record_photos WHERE record_id=?", (record_id,))
    for photo_id in data.photo_ids:
        conn.execute("INSERT INTO record_photos (record_id, image_id) VALUES (?, ?)", (record_id, photo_id))
    conn.commit()
    record = get_record_with_services(conn, record_id)
    conn.close()
    return record

@app.delete("/api/records/{record_id}", status_code=204)
def delete_record(record_id: str):
    conn = get_db()
    conn.execute("DELETE FROM service_records WHERE id=?", (record_id,))
    conn.commit()
    conn.close()

# ── Images ───────────────────────────────────────────────────────

@app.post("/api/images", status_code=201)
async def upload_image(file: UploadFile = File(...)):
    image_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix.lower() or ".jpg"
    filename = f"{image_id}{ext}"
    filepath = IMAGES_DIR / filename
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    conn = get_db()
    conn.execute("INSERT INTO images (id, filename) VALUES (?, ?)", (image_id, filename))
    conn.commit()
    conn.close()
    return {"id": image_id, "url": f"/api/images/{image_id}"}

@app.get("/api/images/{image_id}")
def serve_image(image_id: str):
    conn = get_db()
    row = conn.execute("SELECT filename FROM images WHERE id=?", (image_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Image not found")
    filepath = IMAGES_DIR / row["filename"]
    if not filepath.exists():
        raise HTTPException(404, "Image file not found")
    return FileResponse(filepath)

@app.delete("/api/images/{image_id}", status_code=204)
def delete_image_endpoint(image_id: str):
    conn = get_db()
    row = conn.execute("SELECT filename FROM images WHERE id=?", (image_id,)).fetchone()
    if row:
        filepath = IMAGES_DIR / row["filename"]
        if filepath.exists():
            filepath.unlink()
        conn.execute("DELETE FROM images WHERE id=?", (image_id,))
        conn.commit()
    conn.close()

# ── Migration from localStorage ──────────────────────────────────

@app.post("/api/migrate")
def migrate_from_localstorage(payload: MigratePayload):
    """Accept localStorage dump, insert into DB. Skip duplicates."""
    conn = get_db()
    migrated = {"vehicles": 0, "records": 0, "images": 0}

    # Save base64 images to disk
    image_id_map = {}  # old localStorage id -> new image_id (may be same)
    for old_id, data_url in payload.images.items():
        existing = conn.execute("SELECT id FROM images WHERE id=?", (old_id,)).fetchone()
        if existing:
            image_id_map[old_id] = old_id
            continue
        # Strip data URL prefix
        if "," in data_url:
            data_url = data_url.split(",", 1)[1]
        try:
            img_bytes = base64.b64decode(data_url)
        except Exception:
            continue
        image_id = old_id  # preserve original ID
        filename = f"{image_id}.jpg"
        filepath = IMAGES_DIR / filename
        with open(filepath, "wb") as f:
            f.write(img_bytes)
        conn.execute("INSERT OR IGNORE INTO images (id, filename) VALUES (?, ?)", (image_id, filename))
        image_id_map[old_id] = image_id
        migrated["images"] += 1

    # Insert vehicles
    for v in payload.vehicles:
        existing = conn.execute("SELECT id FROM vehicles WHERE id=?", (v.get("id"),)).fetchone()
        if existing:
            continue
        photo_id = v.get("photoId") or v.get("photo_id")
        conn.execute("""
            INSERT OR IGNORE INTO vehicles (id, year, make, model, trim, color, vin, license, current_mileage, engine, photo_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (v["id"], v.get("year", 0), v.get("make", ""), v.get("model", ""),
              v.get("trim", ""), v.get("color", ""), v.get("vin", ""),
              v.get("license", ""), v.get("currentMileage", v.get("current_mileage", 0)),
              v.get("engine", "4cyl"), photo_id))
        migrated["vehicles"] += 1

    # Insert records
    for r in payload.records:
        existing = conn.execute("SELECT id FROM service_records WHERE id=?", (r.get("id"),)).fetchone()
        if existing:
            continue
        rid = r["id"]
        conn.execute("""
            INSERT OR IGNORE INTO service_records (id, vehicle_id, date, mileage, shop, invoice_number, total_cost, notes, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (rid, r.get("vehicleId", r.get("vehicle_id", "")), r.get("date", ""),
              r.get("mileage", 0), r.get("shop", ""), r.get("invoiceNumber", r.get("invoice_number", "")),
              r.get("totalCost", r.get("total_cost", 0)), r.get("notes", ""), r.get("source", "manual")))
        for svc in r.get("services", []):
            conn.execute("""
                INSERT OR IGNORE INTO service_items (id, record_id, description, category, cost)
                VALUES (?, ?, ?, ?, ?)
            """, (svc.get("id", str(uuid.uuid4())), rid, svc.get("description", ""),
                  svc.get("category", "routine"), svc.get("cost", 0)))
        for photo_id in r.get("photoIds", r.get("photo_ids", [])):
            mapped = image_id_map.get(photo_id, photo_id)
            conn.execute("INSERT OR IGNORE INTO record_photos (record_id, image_id) VALUES (?, ?)", (rid, mapped))
        migrated["records"] += 1

    conn.commit()
    conn.close()
    return {"migrated": migrated, "ok": True}

# ── Serve frontend ───────────────────────────────────────────────

FRONTEND_DIST = Path(__file__).parent.parent / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
