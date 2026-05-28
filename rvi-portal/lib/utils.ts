import { EinheitStatus, OpportunityPhase } from './types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const statusConfig: Record<EinheitStatus, { label: string; color: string; bg: string }> = {
  verfuegbar: { label: 'Verfügbar', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  reserviert: { label: 'Reserviert', color: 'text-amber-700', bg: 'bg-amber-100' },
  notariell: { label: 'Notariell', color: 'text-blue-700', bg: 'bg-blue-100' },
  verkauft: { label: 'Verkauft', color: 'text-red-700', bg: 'bg-red-100' },
  in_bau: { label: 'In Bau', color: 'text-slate-600', bg: 'bg-slate-100' },
};

export const phaseConfig: Record<OpportunityPhase, { label: string; color: string; bg: string; step: number }> = {
  erstgespraech: { label: 'Erstgespräch', color: 'text-slate-700', bg: 'bg-slate-100', step: 1 },
  qualifizierung: { label: 'Qualifizierung', color: 'text-blue-700', bg: 'bg-blue-100', step: 2 },
  angebot: { label: 'Angebot', color: 'text-violet-700', bg: 'bg-violet-100', step: 3 },
  reservierung: { label: 'Reservierung', color: 'text-amber-700', bg: 'bg-amber-100', step: 4 },
  notartermin: { label: 'Notartermin', color: 'text-orange-700', bg: 'bg-orange-100', step: 5 },
  abgeschlossen: { label: 'Abgeschlossen', color: 'text-emerald-700', bg: 'bg-emerald-100', step: 6 },
  verloren: { label: 'Verloren', color: 'text-red-700', bg: 'bg-red-100', step: 0 },
};

export function bruttorendite(kaltmiete: number, kaufpreis: number): number {
  return (kaltmiete * 12) / kaufpreis * 100;
}
