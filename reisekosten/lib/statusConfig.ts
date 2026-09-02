import type { TripStatus } from '@/lib/types';

export const statusConfig: Record<TripStatus, { label: string; color: string; bg: string; step: number }> = {
  ENTWURF: { label: 'Entwurf', color: 'text-slate-700', bg: 'bg-slate-100', step: 1 },
  EINGEREICHT: { label: 'Eingereicht', color: 'text-blue-700', bg: 'bg-blue-100', step: 2 },
  IN_PRUEFUNG: { label: 'In Prüfung', color: 'text-amber-700', bg: 'bg-amber-100', step: 3 },
  FREIGEGEBEN: { label: 'Freigegeben', color: 'text-emerald-700', bg: 'bg-emerald-100', step: 4 },
  ZURUECKGEGEBEN: { label: 'Zurückgegeben', color: 'text-red-700', bg: 'bg-red-100', step: 2 },
};

export const STATUS_PATH: TripStatus[] = ['ENTWURF', 'EINGEREICHT', 'IN_PRUEFUNG', 'FREIGEGEBEN'];

export const categoryLabels: Record<string, string> = {
  FAHRT: 'Fahrt',
  UEBERNACHTUNG: 'Übernachtung',
  VERPFLEGUNG: 'Verpflegung',
  SONSTIGES: 'Sonstiges',
};

export const paymentMethodLabels: Record<string, string> = {
  PRIVAT: 'Privat',
  FIRMENKARTE: 'Firmenkarte',
  BAR: 'Bar',
};

export const auditActionLabels: Record<string, string> = {
  ANGELEGT: 'Reise angelegt',
  EINGEREICHT: 'Eingereicht',
  IN_PRUEFUNG_GENOMMEN: 'In Prüfung genommen',
  FREIGEGEBEN: 'Freigegeben',
  ZURUECKGEGEBEN: 'Zurückgegeben (Änderungen angefordert)',
  KOMMENTAR: 'Kommentar',
};
