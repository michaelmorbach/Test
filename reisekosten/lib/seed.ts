import bcrypt from 'bcryptjs';
import { pool } from './db';
import { createUser, findUserByEmail } from './repo/users';
import { createVehicleType, listVehicleTypes } from './repo/vehicleTypes';

const SEED_PASSWORD = 'Rvi-Test-2026!';

async function seedVehicleTypes() {
  if ((await listVehicleTypes(true)).length > 0) return;
  await createVehicleType({ name: 'Privat-Pkw', satzProKmCent: 30 });
  await createVehicleType({ name: 'Motorrad/Motorroller', satzProKmCent: 20 });
  console.log('Kilometersätze angelegt: Privat-Pkw (0,30 €/km), Motorrad/Motorroller (0,20 €/km)');
}

async function seedUser(input: { name: string; email: string; isApprover: boolean; isAdmin: boolean }) {
  if (await findUserByEmail(input.email)) return;
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  await createUser({ ...input, passwordHash });
  console.log(`Test-Account angelegt: ${input.email} / ${SEED_PASSWORD}`);
}

async function main() {
  await seedVehicleTypes();
  await seedUser({
    name: 'Erika Mitarbeitend',
    email: 'mitarbeiterin@rvi.de',
    isApprover: false,
    isAdmin: false,
  });
  await seedUser({
    name: 'Frank Freigabe',
    email: 'freigabe@rvi.de',
    isApprover: true,
    isAdmin: false,
  });
  await seedUser({
    name: 'Anna Admin',
    email: 'admin@rvi.de',
    isApprover: true,
    isAdmin: true,
  });
  console.log('Seed abgeschlossen.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
