'use client';

import { useActionState, useTransition } from 'react';
import { createUserAction, setUserActiveAction, setUserRolesAction } from '@/app/actions/admin';
import type { ActionState } from '@/app/actions/trips';

const initialState: ActionState = {};

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUserAction, initialState);

  return (
    <form action={action} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-slate-700">Neues Teammitglied</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Name</label>
          <input name="name" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">E-Mail</label>
          <input name="email" type="email" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Initiales Passwort</label>
          <input name="password" type="text" required minLength={8} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isApprover" className="rounded" />
          Freigabeberechtigt
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isAdmin" className="rounded" />
          Administrator
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {pending ? 'Wird angelegt…' : 'Nutzer anlegen'}
      </button>
    </form>
  );
}

export function UserRoleForm({
  userId,
  isApprover,
  isAdmin,
}: {
  userId: string;
  isApprover: boolean;
  isAdmin: boolean;
}) {
  const boundAction = setUserRolesAction.bind(null, userId);
  const [, action, pending] = useActionState(async (_s: null, formData: FormData) => {
    await boundAction(formData);
    return null;
  }, null);

  return (
    <form action={action} className="flex items-center gap-4 text-sm">
      <label className="flex items-center gap-1.5">
        <input type="checkbox" name="isApprover" defaultChecked={isApprover} className="rounded" />
        Freigabeberechtigt
      </label>
      <label className="flex items-center gap-1.5">
        <input type="checkbox" name="isAdmin" defaultChecked={isAdmin} className="rounded" />
        Admin
      </label>
      <button
        type="submit"
        disabled={pending}
        className="text-blue-600 hover:underline disabled:opacity-60 font-medium"
      >
        Speichern
      </button>
    </form>
  );
}

export function ToggleActiveButton({ userId, active }: { userId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setUserActiveAction(userId, !active))}
      className={`text-xs font-medium px-2 py-1 rounded-full transition-colors disabled:opacity-60 ${
        active ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700' : 'bg-slate-200 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'
      }`}
    >
      {active ? 'Aktiv' : 'Deaktiviert'}
    </button>
  );
}
