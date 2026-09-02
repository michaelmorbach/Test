import { db, newId } from '@/lib/db';
import { findUserById, toPublicUser } from '@/lib/repo/users';
import { findVehicleTypeById } from '@/lib/repo/vehicleTypes';
import type {
  AuditAction,
  AuditLogEntry,
  MileageEntry,
  PaymentMethod,
  Receipt,
  ReceiptCategory,
  Trip,
  TripStatus,
  TripWithDetails,
} from '@/lib/types';

interface TripRow {
  id: string;
  employee_id: string;
  purpose: string;
  destination: string;
  cost_center: string;
  start_date: string;
  end_date: string;
  status: TripStatus;
  reviewer_id: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ReceiptRow {
  id: string;
  trip_id: string;
  category: ReceiptCategory;
  merchant: string;
  amount_cents: number;
  payment_method: PaymentMethod;
  receipt_date: string;
  file_path: string | null;
  file_name: string | null;
  note: string | null;
  created_at: string;
}

interface MileageRow {
  id: string;
  trip_id: string;
  start_location: string;
  destination: string;
  entry_date: string;
  reason: string;
  vehicle_type_id: string;
  kilometers: number;
  rate_snapshot_cents: number;
  created_at: string;
}

interface AuditRow {
  id: string;
  trip_id: string;
  user_id: string;
  action: AuditAction;
  comment: string | null;
  created_at: string;
}

function mapTrip(row: TripRow): Trip {
  return {
    id: row.id,
    employeeId: row.employee_id,
    zweck: row.purpose,
    ziel: row.destination,
    kostenstelle: row.cost_center,
    vonDatum: row.start_date,
    bisDatum: row.end_date,
    status: row.status,
    reviewerId: row.reviewer_id,
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReceipt(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    tripId: row.trip_id,
    kategorie: row.category,
    haendler: row.merchant,
    betragCent: row.amount_cents,
    zahlungsart: row.payment_method,
    belegDatum: row.receipt_date,
    dateiPfad: row.file_path,
    dateiName: row.file_name,
    notiz: row.note,
    createdAt: row.created_at,
  };
}

function mapMileage(row: MileageRow): MileageEntry {
  return {
    id: row.id,
    tripId: row.trip_id,
    start: row.start_location,
    ziel: row.destination,
    datum: row.entry_date,
    anlass: row.reason,
    vehicleTypeId: row.vehicle_type_id,
    kilometer: row.kilometers,
    satzSnapshotCent: row.rate_snapshot_cents,
    createdAt: row.created_at,
  };
}

function mapAudit(row: AuditRow): AuditLogEntry {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    action: row.action,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

export function getTripById(id: string): Trip | null {
  const row = db.prepare('SELECT * FROM trips WHERE id = ?').get(id) as TripRow | undefined;
  return row ? mapTrip(row) : null;
}

export function listTripsForEmployee(employeeId: string): Trip[] {
  const rows = db
    .prepare('SELECT * FROM trips WHERE employee_id = ? ORDER BY created_at DESC')
    .all(employeeId) as TripRow[];
  return rows.map(mapTrip);
}

export function listTripsForReview(): Trip[] {
  const rows = db
    .prepare(
      `SELECT * FROM trips WHERE status IN ('EINGEREICHT', 'IN_PRUEFUNG') ORDER BY submitted_at ASC`
    )
    .all() as TripRow[];
  return rows.map(mapTrip);
}

export function listReceipts(tripId: string): Receipt[] {
  const rows = db
    .prepare('SELECT * FROM receipts WHERE trip_id = ? ORDER BY receipt_date DESC, created_at DESC')
    .all(tripId) as ReceiptRow[];
  return rows.map(mapReceipt);
}

export function findReceiptById(id: string): Receipt | null {
  const row = db.prepare('SELECT * FROM receipts WHERE id = ?').get(id) as ReceiptRow | undefined;
  return row ? mapReceipt(row) : null;
}

export function listMileageEntries(tripId: string): MileageEntry[] {
  const rows = db
    .prepare('SELECT * FROM mileage_entries WHERE trip_id = ? ORDER BY entry_date DESC, created_at DESC')
    .all(tripId) as MileageRow[];
  return rows.map(mapMileage);
}

export function findMileageEntryById(id: string): MileageEntry | null {
  const row = db.prepare('SELECT * FROM mileage_entries WHERE id = ?').get(id) as
    | MileageRow
    | undefined;
  return row ? mapMileage(row) : null;
}

export function listAuditLog(tripId: string): AuditLogEntry[] {
  const rows = db
    .prepare('SELECT * FROM audit_log_entries WHERE trip_id = ? ORDER BY created_at ASC')
    .all(tripId) as AuditRow[];
  return rows.map(mapAudit);
}

function addAuditEntry(
  tripId: string,
  userId: string,
  action: AuditAction,
  comment?: string | null
): void {
  db.prepare(
    'INSERT INTO audit_log_entries (id, trip_id, user_id, action, comment) VALUES (?, ?, ?, ?, ?)'
  ).run(newId(), tripId, userId, action, comment ?? null);
}

export function tripLineItemCount(tripId: string): number {
  const receiptCount = db
    .prepare('SELECT COUNT(*) as count FROM receipts WHERE trip_id = ?')
    .get(tripId) as { count: number };
  const mileageCount = db
    .prepare('SELECT COUNT(*) as count FROM mileage_entries WHERE trip_id = ?')
    .get(tripId) as { count: number };
  return receiptCount.count + mileageCount.count;
}

export function tripReimbursementTotalCents(tripId: string): number {
  const receiptSum = db
    .prepare('SELECT COALESCE(SUM(amount_cents), 0) as total FROM receipts WHERE trip_id = ?')
    .get(tripId) as { total: number };
  const mileageRows = db
    .prepare('SELECT kilometers, rate_snapshot_cents FROM mileage_entries WHERE trip_id = ?')
    .all(tripId) as { kilometers: number; rate_snapshot_cents: number }[];
  const mileageSum = mileageRows.reduce(
    (sum, row) => sum + Math.round(row.kilometers * row.rate_snapshot_cents),
    0
  );
  return receiptSum.total + mileageSum;
}

export function getTripWithDetails(id: string): TripWithDetails | null {
  const trip = getTripById(id);
  if (!trip) return null;

  const employee = findUserById(trip.employeeId);
  if (!employee) return null;
  const reviewer = trip.reviewerId ? findUserById(trip.reviewerId) : null;

  const auditLog = listAuditLog(id).map((entry) => {
    const user = findUserById(entry.userId);
    return { ...entry, user: user ? toPublicUser(user) : toPublicUser(employee) };
  });

  return {
    ...trip,
    employee: toPublicUser(employee),
    reviewer: reviewer ? toPublicUser(reviewer) : null,
    receipts: listReceipts(id),
    mileageEntries: listMileageEntries(id),
    auditLog,
    erstattungGesamtCent: tripReimbursementTotalCents(id),
  };
}

export function createTrip(
  employeeId: string,
  input: { zweck: string; ziel: string; kostenstelle: string; vonDatum: string; bisDatum: string }
): Trip {
  const id = newId();
  const transaction = db.transaction(() => {
    db.prepare(
      `INSERT INTO trips (id, employee_id, purpose, destination, cost_center, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ENTWURF')`
    ).run(id, employeeId, input.zweck, input.ziel, input.kostenstelle, input.vonDatum, input.bisDatum);
    addAuditEntry(id, employeeId, 'ANGELEGT');
  });
  transaction();
  return getTripById(id)!;
}

export function updateTripDetails(
  tripId: string,
  input: { zweck: string; ziel: string; kostenstelle: string; vonDatum: string; bisDatum: string }
): boolean {
  const result = db
    .prepare(
      `UPDATE trips SET purpose = ?, destination = ?, cost_center = ?, start_date = ?, end_date = ?, updated_at = datetime('now')
       WHERE id = ? AND status IN ('ENTWURF', 'ZURUECKGEGEBEN')`
    )
    .run(input.zweck, input.ziel, input.kostenstelle, input.vonDatum, input.bisDatum, tripId);
  return result.changes > 0;
}

export function addReceipt(
  tripId: string,
  input: {
    kategorie: ReceiptCategory;
    haendler: string;
    betragCent: number;
    zahlungsart: PaymentMethod;
    belegDatum: string;
    dateiPfad?: string | null;
    dateiName?: string | null;
    notiz?: string | null;
  }
): Receipt {
  const id = newId();
  db.prepare(
    `INSERT INTO receipts (id, trip_id, category, merchant, amount_cents, payment_method, receipt_date, file_path, file_name, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    tripId,
    input.kategorie,
    input.haendler,
    input.betragCent,
    input.zahlungsart,
    input.belegDatum,
    input.dateiPfad ?? null,
    input.dateiName ?? null,
    input.notiz ?? null
  );
  db.prepare("UPDATE trips SET updated_at = datetime('now') WHERE id = ?").run(tripId);
  return findReceiptById(id)!;
}

export function deleteReceipt(id: string): void {
  db.prepare('DELETE FROM receipts WHERE id = ?').run(id);
}

export function updateReceiptFile(id: string, dateiPfad: string, dateiName: string): void {
  db.prepare('UPDATE receipts SET file_path = ?, file_name = ? WHERE id = ?').run(dateiPfad, dateiName, id);
}

export function addMileageEntry(
  tripId: string,
  input: {
    start: string;
    ziel: string;
    datum: string;
    anlass: string;
    vehicleTypeId: string;
    kilometer: number;
  }
): MileageEntry {
  const vehicleType = findVehicleTypeById(input.vehicleTypeId);
  if (!vehicleType) throw new Error('Unbekannte Fahrzeugart');

  const id = newId();
  db.prepare(
    `INSERT INTO mileage_entries (id, trip_id, start_location, destination, entry_date, reason, vehicle_type_id, kilometers, rate_snapshot_cents)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    tripId,
    input.start,
    input.ziel,
    input.datum,
    input.anlass,
    input.vehicleTypeId,
    input.kilometer,
    vehicleType.satzProKmCent
  );
  db.prepare("UPDATE trips SET updated_at = datetime('now') WHERE id = ?").run(tripId);
  return findMileageEntryById(id)!;
}

export function deleteMileageEntry(id: string): void {
  db.prepare('DELETE FROM mileage_entries WHERE id = ?').run(id);
}

export function submitTrip(tripId: string, employeeId: string): boolean {
  const transaction = db.transaction(() => {
    const result = db
      .prepare(
        `UPDATE trips SET status = 'EINGEREICHT', submitted_at = datetime('now'), reviewer_id = NULL, decided_at = NULL, updated_at = datetime('now')
         WHERE id = ? AND employee_id = ? AND status IN ('ENTWURF', 'ZURUECKGEGEBEN')`
      )
      .run(tripId, employeeId);
    if (result.changes > 0) {
      addAuditEntry(tripId, employeeId, 'EINGEREICHT');
    }
    return result.changes > 0;
  });
  return transaction();
}

export function takeTripForReview(tripId: string, reviewerId: string): boolean {
  const transaction = db.transaction(() => {
    const result = db
      .prepare(
        `UPDATE trips SET status = 'IN_PRUEFUNG', reviewer_id = ?, updated_at = datetime('now')
         WHERE id = ? AND status = 'EINGEREICHT'`
      )
      .run(reviewerId, tripId);
    if (result.changes > 0) {
      addAuditEntry(tripId, reviewerId, 'IN_PRUEFUNG_GENOMMEN');
    }
    return result.changes > 0;
  });
  return transaction();
}

export function approveTrip(tripId: string, reviewerId: string, comment?: string): boolean {
  const transaction = db.transaction(() => {
    const result = db
      .prepare(
        `UPDATE trips SET status = 'FREIGEGEBEN', decided_at = datetime('now'), updated_at = datetime('now')
         WHERE id = ? AND reviewer_id = ? AND status = 'IN_PRUEFUNG'`
      )
      .run(tripId, reviewerId);
    if (result.changes > 0) {
      addAuditEntry(tripId, reviewerId, 'FREIGEGEBEN', comment);
    }
    return result.changes > 0;
  });
  return transaction();
}

export function returnTrip(tripId: string, reviewerId: string, comment: string): boolean {
  const transaction = db.transaction(() => {
    const result = db
      .prepare(
        `UPDATE trips SET status = 'ZURUECKGEGEBEN', decided_at = datetime('now'), updated_at = datetime('now')
         WHERE id = ? AND reviewer_id = ? AND status = 'IN_PRUEFUNG'`
      )
      .run(tripId, reviewerId);
    if (result.changes > 0) {
      addAuditEntry(tripId, reviewerId, 'ZURUECKGEGEBEN', comment);
    }
    return result.changes > 0;
  });
  return transaction();
}
