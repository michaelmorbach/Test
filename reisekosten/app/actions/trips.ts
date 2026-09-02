'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/dal';
import { parseEuroToCents, parseGermanDecimal } from '@/lib/money';
import { findVehicleTypeById } from '@/lib/repo/vehicleTypes';
import {
  addMileageEntry,
  addReceipt,
  attachReceiptFile,
  createTrip,
  deleteMileageEntry,
  deleteReceipt,
  findMileageEntryById,
  findReceiptById,
  getTripById,
  submitTrip,
  tripLineItemCount,
  updateTripDetails,
} from '@/lib/repo/trips';

export interface ActionState {
  error?: string;
}

const TripSchema = z
  .object({
    zweck: z.string().trim().min(2, 'Reisezweck angeben.'),
    ziel: z.string().trim().min(2, 'Ziel angeben.'),
    kostenstelle: z.string().trim().min(1, 'Kostenstelle angeben.'),
    vonDatum: z.string().min(1, 'Startdatum angeben.'),
    bisDatum: z.string().min(1, 'Enddatum angeben.'),
  })
  .refine((data) => data.vonDatum <= data.bisDatum, {
    message: 'Das Enddatum darf nicht vor dem Startdatum liegen.',
    path: ['bisDatum'],
  });

export async function createTripAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const validated = TripSchema.safeParse({
    zweck: formData.get('zweck'),
    ziel: formData.get('ziel'),
    kostenstelle: formData.get('kostenstelle'),
    vonDatum: formData.get('vonDatum'),
    bisDatum: formData.get('bisDatum'),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Bitte alle Felder prüfen.' };
  }

  const trip = await createTrip(user.id, validated.data);
  revalidatePath('/reisekosten');
  redirect(`/reisekosten/${trip.id}`);
}

export async function updateTripAction(
  tripId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const trip = await getTripById(tripId);
  if (!trip || trip.employeeId !== user.id) {
    return { error: 'Reise nicht gefunden.' };
  }
  if (trip.status !== 'ENTWURF' && trip.status !== 'ZURUECKGEGEBEN') {
    return { error: 'Diese Reise kann nicht mehr bearbeitet werden.' };
  }

  const validated = TripSchema.safeParse({
    zweck: formData.get('zweck'),
    ziel: formData.get('ziel'),
    kostenstelle: formData.get('kostenstelle'),
    vonDatum: formData.get('vonDatum'),
    bisDatum: formData.get('bisDatum'),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Bitte alle Felder prüfen.' };
  }

  await updateTripDetails(tripId, validated.data);
  revalidatePath(`/reisekosten/${tripId}`);
  return {};
}

const ReceiptSchema = z.object({
  kategorie: z.enum(['FAHRT', 'UEBERNACHTUNG', 'VERPFLEGUNG', 'SONSTIGES']),
  haendler: z.string().trim().min(1, 'Händler angeben.'),
  betrag: z.string().min(1, 'Betrag angeben.'),
  zahlungsart: z.enum(['PRIVAT', 'FIRMENKARTE', 'BAR']),
  belegDatum: z.string().min(1, 'Datum angeben.'),
  notiz: z.string().trim().optional(),
});

export async function addReceiptAction(
  tripId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const trip = await getTripById(tripId);
  if (!trip || trip.employeeId !== user.id) return { error: 'Reise nicht gefunden.' };
  if (trip.status !== 'ENTWURF' && trip.status !== 'ZURUECKGEGEBEN') {
    return { error: 'Diese Reise kann nicht mehr bearbeitet werden.' };
  }

  const validated = ReceiptSchema.safeParse({
    kategorie: formData.get('kategorie'),
    haendler: formData.get('haendler'),
    betrag: formData.get('betrag'),
    zahlungsart: formData.get('zahlungsart'),
    belegDatum: formData.get('belegDatum'),
    notiz: formData.get('notiz') || undefined,
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Bitte alle Felder prüfen.' };
  }

  const betragCent = parseEuroToCents(validated.data.betrag);
  if (betragCent === null || betragCent <= 0) {
    return { error: 'Bitte einen gültigen Betrag angeben.' };
  }

  const receipt = await addReceipt(tripId, {
    kategorie: validated.data.kategorie,
    haendler: validated.data.haendler,
    betragCent,
    zahlungsart: validated.data.zahlungsart,
    belegDatum: validated.data.belegDatum,
    notiz: validated.data.notiz ?? null,
  });

  const file = formData.get('beleg');
  if (file instanceof File && file.size > 0) {
    const data = Buffer.from(await file.arrayBuffer());
    await attachReceiptFile(receipt.id, {
      data,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
    });
  }

  revalidatePath(`/reisekosten/${tripId}`);
  return {};
}

export async function deleteReceiptAction(tripId: string, receiptId: string): Promise<void> {
  const user = await requireUser();
  const trip = await getTripById(tripId);
  const receipt = await findReceiptById(receiptId);
  if (!trip || !receipt || trip.employeeId !== user.id || receipt.tripId !== tripId) return;
  if (trip.status !== 'ENTWURF' && trip.status !== 'ZURUECKGEGEBEN') return;
  await deleteReceipt(receiptId);
  revalidatePath(`/reisekosten/${tripId}`);
}

const MileageSchema = z.object({
  start: z.string().trim().min(1, 'Start angeben.'),
  ziel: z.string().trim().min(1, 'Ziel angeben.'),
  datum: z.string().min(1, 'Datum angeben.'),
  anlass: z.string().trim().min(1, 'Anlass angeben.'),
  vehicleTypeId: z.string().min(1, 'Fahrzeugart wählen.'),
  kilometer: z.string().min(1, 'Kilometer angeben.'),
});

export async function addMileageEntryAction(
  tripId: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const trip = await getTripById(tripId);
  if (!trip || trip.employeeId !== user.id) return { error: 'Reise nicht gefunden.' };
  if (trip.status !== 'ENTWURF' && trip.status !== 'ZURUECKGEGEBEN') {
    return { error: 'Diese Reise kann nicht mehr bearbeitet werden.' };
  }

  const validated = MileageSchema.safeParse({
    start: formData.get('start'),
    ziel: formData.get('ziel'),
    datum: formData.get('datum'),
    anlass: formData.get('anlass'),
    vehicleTypeId: formData.get('vehicleTypeId'),
    kilometer: formData.get('kilometer'),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Bitte alle Felder prüfen.' };
  }

  const vehicleType = await findVehicleTypeById(validated.data.vehicleTypeId);
  if (!vehicleType || !vehicleType.aktiv) {
    return { error: 'Bitte eine gültige Fahrzeugart wählen.' };
  }

  const kilometer = parseGermanDecimal(validated.data.kilometer);
  if (kilometer === null || kilometer <= 0) {
    return { error: 'Bitte eine gültige Kilometerzahl angeben.' };
  }

  await addMileageEntry(tripId, {
    start: validated.data.start,
    ziel: validated.data.ziel,
    datum: validated.data.datum,
    anlass: validated.data.anlass,
    vehicleTypeId: validated.data.vehicleTypeId,
    kilometer,
  });
  revalidatePath(`/reisekosten/${tripId}`);
  return {};
}

export async function deleteMileageEntryAction(tripId: string, entryId: string): Promise<void> {
  const user = await requireUser();
  const trip = await getTripById(tripId);
  const entry = await findMileageEntryById(entryId);
  if (!trip || !entry || trip.employeeId !== user.id || entry.tripId !== tripId) return;
  if (trip.status !== 'ENTWURF' && trip.status !== 'ZURUECKGEGEBEN') return;
  await deleteMileageEntry(entryId);
  revalidatePath(`/reisekosten/${tripId}`);
}

export async function submitTripAction(tripId: string): Promise<ActionState> {
  const user = await requireUser();
  const trip = await getTripById(tripId);
  if (!trip || trip.employeeId !== user.id) return { error: 'Reise nicht gefunden.' };
  if ((await tripLineItemCount(tripId)) === 0) {
    return { error: 'Bitte mindestens einen Beleg oder Kilometereintrag hinzufügen, bevor du einreichst.' };
  }

  const success = await submitTrip(tripId, user.id);
  if (!success) {
    return { error: 'Diese Reise kann in ihrem aktuellen Status nicht eingereicht werden.' };
  }
  revalidatePath(`/reisekosten/${tripId}`);
  revalidatePath('/reisekosten');
  return {};
}
