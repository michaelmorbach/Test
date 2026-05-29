export type EinheitStatus = 'verfuegbar' | 'reserviert' | 'notariell' | 'verkauft' | 'in_bau';
export type EinheitTyp = 'wohnung' | 'haus';
export type ExtraTyp = 'tiefgarage' | 'stellplatz' | 'keller';
export type OpportunityPhase =
  | 'erstgespraech'
  | 'qualifizierung'
  | 'angebot'
  | 'reservierung'
  | 'notartermin'
  | 'abgeschlossen'
  | 'verloren';
export type KundenSegment = 'kapitalanleger' | 'eigennutzer';

export interface Projekt {
  id: string;
  name: string;
  ort: string;
  plz: string;
  bundesland: string;
  status: 'planung' | 'in_bau' | 'fertiggestellt';
  fertigstellung: string;
  energiestandard: string;
  beschreibung: string;
  bild?: string;
  einheitenAnzahl: number;
}

export interface Extra {
  id: string;
  typ: ExtraTyp;
  bezeichnung: string;
  preis: number;
  verfuegbar: boolean;
}

export interface Einheit {
  id: string;
  projektId: string;
  bezeichnung: string;
  typ: EinheitTyp;
  etage: number;
  zimmer: number;
  flaeche: number;
  kaufpreis: number;
  kaltmiete: number;
  status: EinheitStatus;
  reserviertBis?: string;
  reserviertVon?: string;
  extras: Extra[];
  grundrissUrl?: string;
  balkon: boolean;
  kfwStandard: string;
}

export interface Aktivitaet {
  id: string;
  kundeId: string;
  datum: string;
  typ: 'telefonat' | 'email' | 'termin' | 'notiz';
  notiz: string;
}

export interface Kunde {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  segment: KundenSegment;
  familienstand: 'ledig' | 'verheiratet' | 'geschieden';
  einkommen: number;
  eigenkapital: number;
  steuersatz: number;
  notizen: string;
  angelegt: string;
  aktivitaeten: Aktivitaet[];
}

export interface OpportunityPosition {
  einheitId: string;
  extrasIds: string[];
}

export interface Opportunity {
  id: string;
  kundeId: string;
  bezeichnung: string;
  phase: OpportunityPhase;
  positionen: OpportunityPosition[];
  gesamtwert: number;
  zieldatum: string;
  notizen: string;
  erstellt: string;
  aktualisiert: string;
  verloren?: string;
}
