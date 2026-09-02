import { newId, query, queryOne } from '@/lib/db';
import type { VehicleType } from '@/lib/types';

interface VehicleTypeRow {
  id: string;
  name: string;
  rate_per_km_cents: number;
  active: boolean;
}

function mapVehicleType(row: VehicleTypeRow): VehicleType {
  return {
    id: row.id,
    name: row.name,
    satzProKmCent: row.rate_per_km_cents,
    aktiv: row.active,
  };
}

export async function listVehicleTypes(includeInactive = false): Promise<VehicleType[]> {
  const rows = includeInactive
    ? await query<VehicleTypeRow>('SELECT * FROM vehicle_types ORDER BY name')
    : await query<VehicleTypeRow>('SELECT * FROM vehicle_types WHERE active = TRUE ORDER BY name');
  return rows.map(mapVehicleType);
}

export async function findVehicleTypeById(id: string): Promise<VehicleType | null> {
  const row = await queryOne<VehicleTypeRow>('SELECT * FROM vehicle_types WHERE id = $1', [id]);
  return row ? mapVehicleType(row) : null;
}

export async function createVehicleType(input: {
  name: string;
  satzProKmCent: number;
}): Promise<VehicleType> {
  const id = newId();
  await query(
    'INSERT INTO vehicle_types (id, name, rate_per_km_cents, active) VALUES ($1, $2, $3, TRUE)',
    [id, input.name, input.satzProKmCent]
  );
  return (await findVehicleTypeById(id))!;
}

export async function updateVehicleType(
  id: string,
  input: { name: string; satzProKmCent: number }
): Promise<void> {
  await query('UPDATE vehicle_types SET name = $1, rate_per_km_cents = $2 WHERE id = $3', [
    input.name,
    input.satzProKmCent,
    id,
  ]);
}

export async function setVehicleTypeActive(id: string, aktiv: boolean): Promise<void> {
  await query('UPDATE vehicle_types SET active = $1 WHERE id = $2', [aktiv, id]);
}
