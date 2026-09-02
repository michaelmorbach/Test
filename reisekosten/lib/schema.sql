-- RVI Reisekosten – Datenbankschema (SQLite via better-sqlite3)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_approver INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vehicle_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  rate_per_km_cents INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES users(id),
  purpose TEXT NOT NULL,
  destination TEXT NOT NULL,
  cost_center TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ENTWURF'
    CHECK (status IN ('ENTWURF','EINGEREICHT','IN_PRUEFUNG','FREIGEGEBEN','ZURUECKGEGEBEN')),
  reviewer_id TEXT REFERENCES users(id),
  submitted_at TEXT,
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('FAHRT','UEBERNACHTUNG','VERPFLEGUNG','SONSTIGES')),
  merchant TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('PRIVAT','FIRMENKARTE','BAR')),
  receipt_date TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mileage_entries (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  start_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  reason TEXT NOT NULL,
  vehicle_type_id TEXT NOT NULL REFERENCES vehicle_types(id),
  kilometers REAL NOT NULL,
  rate_snapshot_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log_entries (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL
    CHECK (action IN ('ANGELEGT','EINGEREICHT','IN_PRUEFUNG_GENOMMEN','FREIGEGEBEN','ZURUECKGEGEBEN','KOMMENTAR')),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trips_employee ON trips(employee_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_reviewer ON trips(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_receipts_trip ON receipts(trip_id);
CREATE INDEX IF NOT EXISTS idx_mileage_trip ON mileage_entries(trip_id);
CREATE INDEX IF NOT EXISTS idx_mileage_vehicle_type ON mileage_entries(vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_audit_trip ON audit_log_entries(trip_id);
