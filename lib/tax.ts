// Deutsche Einkommensteuer – Grundtarif 2025 (§32a EStG)
// Reine Berechnungsfunktionen für den Steuer- & Renditerechner.

/**
 * Einkommensteuer im Grundtarif (Einzelveranlagung) für 2025.
 * zvE = zu versteuerndes Einkommen.
 */
export function estGrundtarif(zve: number): number {
  const x = Math.floor(Math.max(0, zve)); // Tarif rechnet mit vollem Euro
  if (x <= 12096) return 0; // Grundfreibetrag 2025
  if (x <= 17443) {
    const y = (x - 12096) / 10000;
    return Math.floor((932.3 * y + 1400) * y);
  }
  if (x <= 68480) {
    const z = (x - 17443) / 10000;
    return Math.floor((176.64 * z + 2397) * z + 1015.13);
  }
  if (x <= 277825) {
    return Math.floor(0.42 * x - 10911.92);
  }
  return Math.floor(0.45 * x - 19246.67);
}

/**
 * Einkommensteuer inkl. Ehegatten-Splitting bei Verheirateten.
 */
export function einkommensteuer(zve: number, verheiratet: boolean): number {
  if (verheiratet) {
    return 2 * estGrundtarif(zve / 2);
  }
  return estGrundtarif(zve);
}

/**
 * Grenzsteuersatz (0…0,45) – Steuer auf den nächsten Euro Einkommen.
 * Genau dieser Satz bestimmt die Steuerwirkung von Mietüberschuss/-verlust.
 * Numerisch über kleinen Delta-Betrag berechnet (robust gegen Tarifzonen).
 */
export function grenzsteuersatz(zve: number, verheiratet: boolean): number {
  if (zve <= 0) return 0;
  const delta = 100;
  const t1 = einkommensteuer(zve, verheiratet);
  const t2 = einkommensteuer(zve + delta, verheiratet);
  const rate = (t2 - t1) / delta;
  return Math.max(0, Math.min(0.45, rate));
}

/**
 * Durchschnittssteuersatz (0…1) – nur zur Information / Anzeige.
 */
export function durchschnittssteuersatz(zve: number, verheiratet: boolean): number {
  if (zve <= 0) return 0;
  return einkommensteuer(zve, verheiratet) / zve;
}
