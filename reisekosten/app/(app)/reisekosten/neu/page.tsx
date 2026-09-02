'use client';

import { useActionState } from 'react';
import Header from '@/components/layout/Header';
import { createTripAction, type ActionState } from '@/app/actions/trips';

const initialState: ActionState = {};

export default function NeueReisePage() {
  const [state, action, pending] = useActionState(createTripAction, initialState);

  return (
    <div className="min-h-full">
      <Header title="Neue Reise" />
      <div className="p-4 lg:p-6 max-w-xl mx-auto">
        <form action={action} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <Field label="Reisezweck" name="zweck" placeholder="z. B. Kundentermin Leipzig" required />
          <Field label="Ziel" name="ziel" placeholder="z. B. Leipzig" required />
          <Field label="Kostenstelle" name="kostenstelle" placeholder="z. B. KST-4200" required />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Von" name="vonDatum" type="date" required />
            <Field label="Bis" name="bisDatum" type="date" required />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            {pending ? 'Wird angelegt…' : 'Reise anlegen'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
