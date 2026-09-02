import bcrypt from 'bcryptjs';
import { db } from './db';
import { createUser, findUserByEmail } from './repo/users';
import { createVehicleType, listVehicleTypes } from './repo/vehicleTypes';

const SEED_PASSWORD = 'Rvi-Test-2026!';

function seedVehicleTypes() {
  if (listVehicleTypes(true).length > 0) return;
  createVehicleType({ name: 'Privat-Pkw', satzProKmCent: 30 });
  createVehicleType({ name: 'Motorrad/Motorroller', satzProKmCent: 20 });
  console.log('Kilometersätze angelegt: Privat-Pkw (0,30 €/km), Motorrad/Motorroller (0,20 €/km)');
}

function seedUser(input: { name: string; email: string; isApprover: boolean; isAdmin: boolean }) {
  if (findUserByEmail(input.email)) return;
  const passwordHash = bcrypt.hashSync(SEED_PASSWORD, 10);
  createUser({ ...input, passwordHash });
  console.log(`Test-Account angelegt: ${input.email} / ${SEED_PASSWORD}`);
}

function main() {
  seedVehicleTypes();
  seedUser({
    name: 'Erika Mitarbeitend',
    email: 'mitarbeiterin@rvi.de',
    isApprover: false,
    isAdmin: false,
  });
  seedUser({
    name: 'Frank Freigabe',
    email: 'freigabe@rvi.de',
    isApprover: true,
    isAdmin: false,
  });
  seedUser({
    name: 'Anna Admin',
    email: 'admin@rvi.de',
    isApprover: true,
    isAdmin: true,
  });
  console.log('Seed abgeschlossen.');
}

main();
db.close();
