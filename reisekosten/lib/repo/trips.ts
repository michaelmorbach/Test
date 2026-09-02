import { newId, nowIso, query, queryOne, withTransaction, type TxQuery } from '@/lib/db';
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
  file_name: string | null;
  file_content_type: string | null;
  note: string | null;
  created_at: string;
}

interface ReceiptFileRow {
  file_data: Buffer | null;
  file_content_type: string | null;
  file_name: string | null;
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

const RECEIPT_COLUMNS =
  'id, trip_id, category, merchant, amount_cents, payment_method, receipt_date, file_name, file_content_type, note, created_at';

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
    hatDatei: !!row.file_name,
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

export async function getTripById(id: string): Promise<Trip | null> {
  const row = await queryOne<TripRow>('SELECT * FROM trips WHERE id = $1', [id]);
  return row ? mapTrip(row) : null;
}

export async function listTripsForEmployee(employeeId: string): Promise<Trip[]> {
  const rows = await query<TripRow>(
    'SELECT * FROM trips WHERE employee_id = $1 ORDER BY created_at DESC',
    [employeeId]
  );
  return rows.map(mapTrip);
}

export async function listTripsForReview(): Promise<Trip[]> {
  const rows = await query<TripRow>(
    `SELECT * FROM trips WHERE status IN ('EINGEREICHT', 'IN_PRUEFUNG') ORDER BY submitted_at ASC`
  );
  return rows.map(mapTrip);
}

export async function listReceipts(tripId: string): Promise<Receipt[]> {
  const rows = await query<ReceiptRow>(
    `SELECT ${RECEIPT_COLUMNS} FROM receipts WHERE trip_id = $1 ORDER BY receipt_date DESC, created_at DESC`,
    [tripId]
  );
  return rows.map(mapReceipt);
}

export async function findReceiptById(id: string): Promise<Receipt | null> {
  const row = await queryOne<ReceiptRow>(`SELECT ${RECEIPT_COLUMNS} FROM receipts WHERE id = $1`, [id]);
  return row ? mapReceipt(row) : null;
}

export async function getReceiptFile(id: string): Promise<
  { data: Buffer; contentType: string; fileName: string } | null
> {
  const row = await queryOne<ReceiptFileRow>(
    'SELECT file_data, file_content_type, file_name FROM receipts WHERE id = $1',
    [id]
  );
  if (!row || !row.file_data) return null;
  return {
    data: row.file_data,
    contentType: row.file_content_type ?? 'application/octet-stream',
    fileName: row.file_name ?? 'beleg',
  };
}

export async function listMileageEntries(tripId: string): Promise<MileageEntry[]> {
  const rows = await query<MileageRow>(
    'SELECT * FROM mileage_entries WHERE trip_id = $1 ORDER BY entry_date DESC, created_at DESC',
    [tripId]
  );
  return rows.map(mapMileage);
}

export async function findMileageEntryById(id: string): Promise<MileageEntry | null> {
  const row = await queryOne<MileageRow>('SELECT * FROM mileage_entries WHERE id = $1', [id]);
  return row ? mapMileage(row) : null;
}

export async function listAuditLog(tripId: string): Promise<AuditLogEntry[]> {
  const rows = await query<AuditRow>(
    'SELECT * FROM audit_log_entries WHERE trip_id = $1 ORDER BY created_at ASC',
    [tripId]
  );
  return rows.map(mapAudit);
}

async function addAuditEntry(
  tx: TxQuery,
  tripId: string,
  userId: string,
  action: AuditAction,
  comment?: string | null
): Promise<void> {
  await tx(
    'INSERT INTO audit_log_entries (id, trip_id, user_id, action, comment, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [newId(), tripId, userId, action, comment ?? null, nowIso()]
  );
}

export async function tripLineItemCount(tripId: string): Promise<number> {
  const receiptCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM receipts WHERE trip_id = $1',
    [tripId]
  );
  const mileageCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM mileage_entries WHERE trip_id = $1',
    [tripId]
  );
  return Number(receiptCount?.count ?? 0) + Number(mileageCount?.count ?? 0);
}

export async function tripReimbursementTotalCents(tripId: string): Promise<number> {
  const receiptSum = await queryOne<{ total: string }>(
    'SELECT COALESCE(SUM(amount_cents), 0) as total FROM receipts WHERE trip_id = $1',
    [tripId]
  );
  const mileageRows = await query<{ kilometers: number; rate_snapshot_cents: number }>(
    'SELECT kilometers, rate_snapshot_cents FROM mileage_entries WHERE trip_id = $1',
    [tripId]
  );
  const mileageSum = mileageRows.reduce(
    (sum, row) => sum + Math.round(row.kilometers * row.rate_snapshot_cents),
    0
  );
  return Number(receiptSum?.total ?? 0) + mileageSum;
}

export async function getTripWithDetails(id: string): Promise<TripWithDetails | null> {
  const trip = await getTripById(id);
  if (!trip) return null;

  const employee = await findUserById(trip.employeeId);
  if (!employee) return null;
  const reviewer = trip.reviewerId ? await findUserById(trip.reviewerId) : null;

  const rawAuditLog = await listAuditLog(id);
  const auditLog = await Promise.all(
    rawAuditLog.map(async (entry) => {
      const user = await findUserById(entry.userId);
      return { ...entry, user: user ? toPublicUser(user) : toPublicUser(employee) };
    })
  );

  return {
    ...trip,
    employee: toPublicUser(employee),
    reviewer: reviewer ? toPublicUser(reviewer) : null,
    receipts: await listReceipts(id),
    mileageEntries: await listMileageEntries(id),
    auditLog,
    erstattungGesamtCent: await tripReimbursementTotalCents(id),
  };
}

export async function createTrip(
  employeeId: string,
  input: { zweck: string; ziel: string; kostenstelle: string; vonDatum: string; bisDatum: string }
): Promise<Trip> {
  const id = newId();
  const now = nowIso();
  await withTransaction(async (tx) => {
    await tx(
      `INSERT INTO trips (id, employee_id, purpose, destination, cost_center, start_date, end_date, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ENTWURF', $8, $8)`,
      [id, employeeId, input.zweck, input.ziel, input.kostenstelle, input.vonDatum, input.bisDatum, now]
    );
    await addAuditEntry(tx, id, employeeId, 'ANGELEGT');
  });
  return (await getTripById(id))!;
}

export async function updateTripDetails(
  tripId: string,
  input: { zweck: string; ziel: string; kostenstelle: string; vonDatum: string; bisDatum: string }
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE trips SET purpose = $1, destination = $2, cost_center = $3, start_date = $4, end_date = $5, updated_at = $6
     WHERE id = $7 AND status IN ('ENTWURF', 'ZURUECKGEGEBEN')
     RETURNING id`,
    [input.zweck, input.ziel, input.kostenstelle, input.vonDatum, input.bisDatum, nowIso(), tripId]
  );
  return rows.length > 0;
}

export async function addReceipt(
  tripId: string,
  input: {
    kategorie: ReceiptCategory;
    haendler: string;
    betragCent: number;
    zahlungsart: PaymentMethod;
    belegDatum: string;
    notiz?: string | null;
  }
): Promise<Receipt> {
  const id = newId();
  await query(
    `INSERT INTO receipts (id, trip_id, category, merchant, amount_cents, payment_method, receipt_date, note, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      tripId,
      input.kategorie,
      input.haendler,
      input.betragCent,
      input.zahlungsart,
      input.belegDatum,
      input.notiz ?? null,
      nowIso(),
    ]
  );
  await query("UPDATE trips SET updated_at = $1 WHERE id = $2", [nowIso(), tripId]);
  return (await findReceiptById(id))!;
}

export async function attachReceiptFile(
  id: string,
  file: { data: Buffer; fileName: string; contentType: string }
): Promise<void> {
  await query(
    'UPDATE receipts SET file_data = $1, file_name = $2, file_content_type = $3 WHERE id = $4',
    [file.data, file.fileName, file.contentType, id]
  );
}

export async function deleteReceipt(id: string): Promise<void> {
  await query('DELETE FROM receipts WHERE id = $1', [id]);
}

export async function addMileageEntry(
  tripId: string,
  input: {
    start: string;
    ziel: string;
    datum: string;
    anlass: string;
    vehicleTypeId: string;
    kilometer: number;
  }
): Promise<MileageEntry> {
  const vehicleType = await findVehicleTypeById(input.vehicleTypeId);
  if (!vehicleType) throw new Error('Unbekannte Fahrzeugart');

  const id = newId();
  await query(
    `INSERT INTO mileage_entries (id, trip_id, start_location, destination, entry_date, reason, vehicle_type_id, kilometers, rate_snapshot_cents, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      tripId,
      input.start,
      input.ziel,
      input.datum,
      input.anlass,
      input.vehicleTypeId,
      input.kilometer,
      vehicleType.satzProKmCent,
      nowIso(),
    ]
  );
  await query('UPDATE trips SET updated_at = $1 WHERE id = $2', [nowIso(), tripId]);
  return (await findMileageEntryById(id))!;
}

export async function deleteMileageEntry(id: string): Promise<void> {
  await query('DELETE FROM mileage_entries WHERE id = $1', [id]);
}

export async function submitTrip(tripId: string, employeeId: string): Promise<boolean> {
  return withTransaction(async (tx) => {
    const rows = await tx<{ id: string }>(
      `UPDATE trips SET status = 'EINGEREICHT', submitted_at = $1, reviewer_id = NULL, decided_at = NULL, updated_at = $1
       WHERE id = $2 AND employee_id = $3 AND status IN ('ENTWURF', 'ZURUECKGEGEBEN')
       RETURNING id`,
      [nowIso(), tripId, employeeId]
    );
    if (rows.length > 0) {
      await addAuditEntry(tx, tripId, employeeId, 'EINGEREICHT');
    }
    return rows.length > 0;
  });
}

export async function takeTripForReview(tripId: string, reviewerId: string): Promise<boolean> {
  return withTransaction(async (tx) => {
    const rows = await tx<{ id: string }>(
      `UPDATE trips SET status = 'IN_PRUEFUNG', reviewer_id = $1, updated_at = $2
       WHERE id = $3 AND status = 'EINGEREICHT'
       RETURNING id`,
      [reviewerId, nowIso(), tripId]
    );
    if (rows.length > 0) {
      await addAuditEntry(tx, tripId, reviewerId, 'IN_PRUEFUNG_GENOMMEN');
    }
    return rows.length > 0;
  });
}

export async function approveTrip(tripId: string, reviewerId: string, comment?: string): Promise<boolean> {
  return withTransaction(async (tx) => {
    const rows = await tx<{ id: string }>(
      `UPDATE trips SET status = 'FREIGEGEBEN', decided_at = $1, updated_at = $1
       WHERE id = $2 AND reviewer_id = $3 AND status = 'IN_PRUEFUNG'
       RETURNING id`,
      [nowIso(), tripId, reviewerId]
    );
    if (rows.length > 0) {
      await addAuditEntry(tx, tripId, reviewerId, 'FREIGEGEBEN', comment);
    }
    return rows.length > 0;
  });
}

export async function returnTrip(tripId: string, reviewerId: string, comment: string): Promise<boolean> {
  return withTransaction(async (tx) => {
    const rows = await tx<{ id: string }>(
      `UPDATE trips SET status = 'ZURUECKGEGEBEN', decided_at = $1, updated_at = $1
       WHERE id = $2 AND reviewer_id = $3 AND status = 'IN_PRUEFUNG'
       RETURNING id`,
      [nowIso(), tripId, reviewerId]
    );
    if (rows.length > 0) {
      await addAuditEntry(tx, tripId, reviewerId, 'ZURUECKGEGEBEN', comment);
    }
    return rows.length > 0;
  });
}
