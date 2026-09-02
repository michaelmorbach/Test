'use client';

import { useActionState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import {
  addMileageEntryAction,
  addReceiptAction,
  deleteMileageEntryAction,
  deleteReceiptAction,
  submitTripAction,
  updateTripAction,
  type ActionState,
} from '@/app/actions/trips';
import { approveTripAction, returnTripAction, takeForReviewAction } from '@/app/actions/review';
import type { VehicleType } from '@/lib/types';

const initialState: ActionState = {};

export function EditTripForm({
  tripId,
  defaults,
}: {
  tripId: string;
  defaults: { zweck: string; ziel: string; kostenstelle: string; vonDatum: string; bisDatum: string };
}) {
  const boundAction = updateTripAction.bind(null, tripId);
  const [state, action, pending] = useActionState(boundAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <FormField label="Reisezweck" name="zweck" defaultValue={defaults.zweck} required />
      <FormField label="Ziel" name="ziel" defaultValue={defaults.ziel} required />
      <FormField label="Kostenstelle" name="kostenstelle" defaultValue={defaults.kostenstelle} required />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Von" name="vonDatum" type="date" defaultValue={defaults.vonDatum} required />
        <FormField label="Bis" name="bisDatum" type="date" defaultValue={defaults.bisDatum} required />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 px-4 py-2 rounded-lg transition-colors"
      >
        {pending ? 'Speichert…' : 'Änderungen speichern'}
      </button>
    </form>
  );
}

export function AddReceiptForm({ tripId }: { tripId: string }) {
  const boundAction = addReceiptAction.bind(null, tripId);
  const [state, action, pending] = useActionState(boundAction, initialState);

  return (
    <form action={action} className="space-y-3 bg-slate-50 rounded-lg p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Kategorie</label>
          <select name="kategorie" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="FAHRT">Fahrt</option>
            <option value="UEBERNACHTUNG">Übernachtung</option>
            <option value="VERPFLEGUNG">Verpflegung</option>
            <option value="SONSTIGES">Sonstiges</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Zahlungsart</label>
          <select name="zahlungsart" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="PRIVAT">Privat</option>
            <option value="FIRMENKARTE">Firmenkarte</option>
            <option value="BAR">Bar</option>
          </select>
        </div>
      </div>
      <FormField label="Händler" name="haendler" placeholder="z. B. Deutsche Bahn" required />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Betrag (€)" name="betrag" placeholder="12,50" required />
        <FormField label="Belegdatum" name="belegDatum" type="date" required />
      </div>
      <FormField label="Notiz (optional)" name="notiz" />
      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1">Belegfoto/-scan (optional)</label>
        <input
          type="file"
          name="beleg"
          accept="image/*,application/pdf"
          className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-700 file:text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
      >
        {pending ? 'Fügt hinzu…' : 'Beleg hinzufügen'}
      </button>
    </form>
  );
}

export function AddMileageForm({ tripId, vehicleTypes }: { tripId: string; vehicleTypes: VehicleType[] }) {
  const boundAction = addMileageEntryAction.bind(null, tripId);
  const [state, action, pending] = useActionState(boundAction, initialState);

  return (
    <form action={action} className="space-y-3 bg-slate-50 rounded-lg p-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start" name="start" required />
        <FormField label="Ziel" name="ziel" required />
      </div>
      <FormField label="Anlass" name="anlass" required />
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Datum" name="datum" type="date" required />
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Fahrzeugart</label>
          <select name="vehicleTypeId" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            {vehicleTypes.map((vt) => (
              <option key={vt.id} value={vt.id}>
                {vt.name} ({(vt.satzProKmCent / 100).toFixed(2)} €/km)
              </option>
            ))}
          </select>
        </div>
        <FormField label="Kilometer" name="kilometer" placeholder="42,5" required />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
      >
        {pending ? 'Fügt hinzu…' : 'Fahrt hinzufügen'}
      </button>
    </form>
  );
}

export function DeleteReceiptButton({ tripId, receiptId }: { tripId: string; receiptId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => deleteReceiptAction(tripId, receiptId))}
      disabled={pending}
      className="text-slate-400 hover:text-red-600 disabled:opacity-50 transition-colors"
      title="Beleg löschen"
      type="button"
    >
      <Trash2 size={15} />
    </button>
  );
}

export function DeleteMileageButton({ tripId, entryId }: { tripId: string; entryId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => deleteMileageEntryAction(tripId, entryId))}
      disabled={pending}
      className="text-slate-400 hover:text-red-600 disabled:opacity-50 transition-colors"
      title="Eintrag löschen"
      type="button"
    >
      <Trash2 size={15} />
    </button>
  );
}

export function SubmitTripButton({ tripId }: { tripId: string }) {
  const boundAction = submitTripAction.bind(null, tripId);
  const [state, action, pending] = useActionState(boundAction, initialState);

  return (
    <form action={action} className="space-y-2">
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
      >
        {pending ? 'Wird eingereicht…' : 'Reise einreichen'}
      </button>
    </form>
  );
}

export function TakeForReviewButton({ tripId }: { tripId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => takeForReviewAction(tripId))}
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
      type="button"
    >
      {pending ? 'Wird übernommen…' : 'In Prüfung nehmen'}
    </button>
  );
}

export function ApproveForm({ tripId }: { tripId: string }) {
  const boundAction = approveTripAction.bind(null, tripId);
  const [state, action, pending] = useActionState(boundAction, initialState);
  return (
    <form action={action} className="space-y-2">
      <textarea
        name="comment"
        placeholder="Kommentar (optional)"
        rows={2}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
      >
        {pending ? 'Wird freigegeben…' : 'Freigeben'}
      </button>
    </form>
  );
}

export function ReturnForm({ tripId }: { tripId: string }) {
  const boundAction = returnTripAction.bind(null, tripId);
  const [state, action, pending] = useActionState(boundAction, initialState);
  return (
    <form action={action} className="space-y-2">
      <textarea
        name="comment"
        placeholder="Welche Änderungen sind nötig? (Pflichtfeld)"
        rows={2}
        required
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
      >
        {pending ? 'Wird zurückgegeben…' : 'Zurückgeben'}
      </button>
    </form>
  );
}

function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-medium text-slate-500 block mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
