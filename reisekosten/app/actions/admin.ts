'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/dal';
import { parseEuroToCents } from '@/lib/money';
import { createUser, findUserByEmail, setUserActive, setUserRoles } from '@/lib/repo/users';
import { createVehicleType, updateVehicleType, setVehicleTypeActive } from '@/lib/repo/vehicleTypes';
import type { ActionState } from '@/app/actions/trips';

const CreateUserSchema = z.object({
  name: z.string().trim().min(2, 'Name angeben.'),
  email: z.string().trim().email('Bitte eine gültige E-Mail-Adresse angeben.'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben.'),
});

export async function createUserAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const validated = CreateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Bitte alle Felder prüfen.' };
  }
  if (findUserByEmail(validated.data.email)) {
    return { error: 'Diese E-Mail-Adresse ist bereits vergeben.' };
  }

  const passwordHash = await bcrypt.hash(validated.data.password, 10);
  createUser({
    name: validated.data.name,
    email: validated.data.email,
    passwordHash,
    isApprover: formData.get('isApprover') === 'on',
    isAdmin: formData.get('isAdmin') === 'on',
  });
  revalidatePath('/admin/team');
  return {};
}

export async function setUserRolesAction(userId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  setUserRoles(userId, {
    isApprover: formData.get('isApprover') === 'on',
    isAdmin: formData.get('isAdmin') === 'on',
  });
  revalidatePath('/admin/team');
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<void> {
  await requireAdmin();
  setUserActive(userId, active);
  revalidatePath('/admin/team');
}

const VehicleTypeSchema = z.object({
  name: z.string().trim().min(2, 'Bezeichnung angeben.'),
  satz: z.string().min(1, 'Satz angeben.'),
});

export async function createVehicleTypeAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const validated = VehicleTypeSchema.safeParse({
    name: formData.get('name'),
    satz: formData.get('satz'),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Bitte alle Felder prüfen.' };
  }
  const satzProKmCent = parseEuroToCents(validated.data.satz);
  if (satzProKmCent === null || satzProKmCent <= 0) {
    return { error: 'Bitte einen gültigen Satz angeben (z. B. 0,30).' };
  }
  createVehicleType({ name: validated.data.name, satzProKmCent });
  revalidatePath('/admin/kilometersaetze');
  return {};
}

export async function updateVehicleTypeAction(
  vehicleTypeId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const validated = VehicleTypeSchema.safeParse({
    name: formData.get('name'),
    satz: formData.get('satz'),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Bitte alle Felder prüfen.' };
  }
  const satzProKmCent = parseEuroToCents(validated.data.satz);
  if (satzProKmCent === null || satzProKmCent <= 0) {
    return { error: 'Bitte einen gültigen Satz angeben (z. B. 0,30).' };
  }
  updateVehicleType(vehicleTypeId, { name: validated.data.name, satzProKmCent });
  revalidatePath('/admin/kilometersaetze');
  return {};
}

export async function setVehicleTypeActiveAction(vehicleTypeId: string, aktiv: boolean): Promise<void> {
  await requireAdmin();
  setVehicleTypeActive(vehicleTypeId, aktiv);
  revalidatePath('/admin/kilometersaetze');
}
