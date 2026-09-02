'use client';

import { useActionState, useTransition } from 'react';
import {
  createVehicleTypeAction,
  setVehicleTypeActiveAction,
  updateVehicleTypeAction,
} from '@/app/actions/admin';
import type { ActionState } from '@/app/actions/trips';

const initialState: ActionState = {};

export function CreateVehicleTypeForm() {
  const [state, action, pending] = useActionState(createVehicleTypeAction, initialState);

  return (
    <form action={action} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-slate-700">Neue Fahrzeugart</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Bezeichnung</label>
          <input name="name" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Satz (€/km)</label>
          <input name="satz" required placeholder="0,30" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {pending ? 'Wird angelegt…' : 'Fahrzeugart anlegen'}
      </button>
    </form>
  );
}

export function EditVehicleTypeForm({
  id,
  name,
  satz,
}: {
  id: string;
  name: string;
  satz: string;
}) {
  const boundAction = updateVehicleTypeAction.bind(null, id);
  const [state, action, pending] = useActionState(boundAction, initialState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3 text-sm">
      <input
        name="name"
        defaultValue={name}
        required
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-48"
      />
      <div className="flex items-center gap-1">
        <input
          name="satz"
          defaultValue={satz}
          required
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-24"
        />
        <span className="text-slate-500">€/km</span>
      </div>
      {state?.error && <p className="text-sm text-red-600 w-full">{state.error}</p>}
      <button type="submit" disabled={pending} className="text-blue-600 hover:underline font-medium disabled:opacity-60">
        Speichern
      </button>
    </form>
  );
}

export function ToggleVehicleTypeActiveButton({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setVehicleTypeActiveAction(id, !active))}
      className={`text-xs font-medium px-2 py-1 rounded-full transition-colors disabled:opacity-60 ${
        active ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700' : 'bg-slate-200 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'
      }`}
    >
      {active ? 'Aktiv' : 'Deaktiviert'}
    </button>
  );
}
