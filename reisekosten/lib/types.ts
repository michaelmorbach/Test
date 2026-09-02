export type TripStatus = 'ENTWURF' | 'EINGEREICHT' | 'IN_PRUEFUNG' | 'FREIGEGEBEN' | 'ZURUECKGEGEBEN';
export type ReceiptCategory = 'FAHRT' | 'UEBERNACHTUNG' | 'VERPFLEGUNG' | 'SONSTIGES';
export type PaymentMethod = 'PRIVAT' | 'FIRMENKARTE' | 'BAR';
export type AuditAction =
  | 'ANGELEGT'
  | 'EINGEREICHT'
  | 'IN_PRUEFUNG_GENOMMEN'
  | 'FREIGEGEBEN'
  | 'ZURUECKGEGEBEN'
  | 'KOMMENTAR';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isApprover: boolean;
  isAdmin: boolean;
  active: boolean;
  createdAt: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export interface VehicleType {
  id: string;
  name: string;
  satzProKmCent: number;
  aktiv: boolean;
}

export interface Trip {
  id: string;
  employeeId: string;
  zweck: string;
  ziel: string;
  kostenstelle: string;
  vonDatum: string;
  bisDatum: string;
  status: TripStatus;
  reviewerId: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  tripId: string;
  kategorie: ReceiptCategory;
  haendler: string;
  betragCent: number;
  zahlungsart: PaymentMethod;
  belegDatum: string;
  dateiPfad: string | null;
  dateiName: string | null;
  notiz: string | null;
  createdAt: string;
}

export interface MileageEntry {
  id: string;
  tripId: string;
  start: string;
  ziel: string;
  datum: string;
  anlass: string;
  vehicleTypeId: string;
  kilometer: number;
  satzSnapshotCent: number;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  tripId: string;
  userId: string;
  action: AuditAction;
  comment: string | null;
  createdAt: string;
}

export interface TripWithDetails extends Trip {
  employee: PublicUser;
  reviewer: PublicUser | null;
  receipts: Receipt[];
  mileageEntries: MileageEntry[];
  auditLog: (AuditLogEntry & { user: PublicUser })[];
  erstattungGesamtCent: number;
}
