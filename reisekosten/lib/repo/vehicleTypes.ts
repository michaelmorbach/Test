import { db, newId } from '@/lib/db';
import type { VehicleType } from '@/lib/types';

interface VehicleTypeRow {
  id: string;
  name: string;
  rate_per_km_cents: number;
  active: number;
}

function mapVehicleType(row: VehicleTypeRow): VehicleType {
  return {
    id: row.id,
    name: row.name,
    satzProKmCent: row.rate_per_km_cents,
    aktiv: !!row.active,
  };
}

export function listVehicleTypes(includeInactive = false): VehicleType[] {
  const rows = includeInactive
    ? (db.prepare('SELECT * FROM vehicle_types ORDER BY name').all() as VehicleTypeRow[])
    : (db.prepare('SELECT * FROM vehicle_types WHERE active = 1 ORDER BY name').all() as VehicleTypeRow[]);
  return rows.map(mapVehicleType);
}

export function findVehicleTypeById(id: string): VehicleType | null {
  const row = db.prepare('SELECT * FROM vehicle_types WHERE id = ?').get(id) as
    | VehicleTypeRow
    | undefined;
  return row ? mapVehicleType(row) : null;
}

export function createVehicleType(input: { name: string; satzProKmCent: number }): VehicleType {
  const id = newId();
  db.prepare('INSERT INTO vehicle_types (id, name, rate_per_km_cents, active) VALUES (?, ?, ?, 1)').run(
    id,
    input.name,
    input.satzProKmCent
  );
  return findVehicleTypeById(id)!;
}

export function updateVehicleType(
  id: string,
  input: { name: string; satzProKmCent: number }
): void {
  db.prepare('UPDATE vehicle_types SET name = ?, rate_per_km_cents = ? WHERE id = ?').run(
    input.name,
    input.satzProKmCent,
    id
  );
}

export function setVehicleTypeActive(id: string, aktiv: boolean): void {
  db.prepare('UPDATE vehicle_types SET active = ? WHERE id = ?').run(aktiv ? 1 : 0, id);
}
