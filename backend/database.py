import sqlite3
import os
import uuid
from pathlib import Path

DB_PATH = Path(__file__).parent / "mycars.db"
IMAGES_DIR = Path(__file__).parent / "images"
IMAGES_DIR.mkdir(exist_ok=True)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS vehicles (
            id TEXT PRIMARY KEY,
            year INTEGER NOT NULL,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            trim TEXT DEFAULT '',
            color TEXT DEFAULT '',
            vin TEXT DEFAULT '',
            license TEXT DEFAULT '',
            current_mileage INTEGER DEFAULT 0,
            engine TEXT DEFAULT '4cyl',
            photo_id TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS service_records (
            id TEXT PRIMARY KEY,
            vehicle_id TEXT NOT NULL,
            date TEXT NOT NULL,
            mileage INTEGER DEFAULT 0,
            shop TEXT DEFAULT '',
            invoice_number TEXT DEFAULT '',
            total_cost REAL DEFAULT 0,
            notes TEXT DEFAULT '',
            source TEXT DEFAULT 'manual',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS service_items (
            id TEXT PRIMARY KEY,
            record_id TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT DEFAULT 'routine',
            cost REAL DEFAULT 0,
            FOREIGN KEY (record_id) REFERENCES service_records(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS record_photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id TEXT NOT NULL,
            image_id TEXT NOT NULL,
            FOREIGN KEY (record_id) REFERENCES service_records(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS images (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()

def row_to_dict(row):
    return dict(row) if row else None

def get_vehicle(conn, vehicle_id):
    row = conn.execute("SELECT * FROM vehicles WHERE id=?", (vehicle_id,)).fetchone()
    return row_to_dict(row)

def get_all_vehicles(conn):
    rows = conn.execute("SELECT * FROM vehicles ORDER BY year DESC, make, model").fetchall()
    return [dict(r) for r in rows]

def get_record_with_services(conn, record_id):
    record = conn.execute("SELECT * FROM service_records WHERE id=?", (record_id,)).fetchone()
    if not record:
        return None
    record = dict(record)
    items = conn.execute("SELECT * FROM service_items WHERE record_id=? ORDER BY rowid", (record_id,)).fetchall()
    record['services'] = [dict(i) for i in items]
    photos = conn.execute("SELECT image_id FROM record_photos WHERE record_id=? ORDER BY id", (record_id,)).fetchall()
    record['photo_ids'] = [p['image_id'] for p in photos]
    return record

def get_vehicle_records(conn, vehicle_id):
    records = conn.execute(
        "SELECT * FROM service_records WHERE vehicle_id=? ORDER BY date DESC, mileage DESC",
        (vehicle_id,)
    ).fetchall()
    result = []
    for r in records:
        rec = dict(r)
        items = conn.execute("SELECT * FROM service_items WHERE record_id=? ORDER BY rowid", (r['id'],)).fetchall()
        rec['services'] = [dict(i) for i in items]
        photos = conn.execute("SELECT image_id FROM record_photos WHERE record_id=? ORDER BY id", (r['id'],)).fetchall()
        rec['photo_ids'] = [p['image_id'] for p in photos]
        result.append(rec)
    return result
