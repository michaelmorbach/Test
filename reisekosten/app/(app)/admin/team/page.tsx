import Header from '@/components/layout/Header';
import { requireAdmin } from '@/lib/dal';
import { listUsers } from '@/lib/repo/users';
import { CreateUserForm, ToggleActiveButton, UserRoleForm } from './forms';

export default async function TeamPage() {
  await requireAdmin();
  const users = listUsers();

  return (
    <div className="min-h-full">
      <Header title="Team & Rollen" />
      <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
        <CreateUserForm />

        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="min-w-0 sm:w-48 shrink-0">
                <p className="font-medium text-slate-800 truncate">{u.name}</p>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
              </div>
              <div className="flex-1">
                <UserRoleForm userId={u.id} isApprover={u.isApprover} isAdmin={u.isAdmin} />
              </div>
              <ToggleActiveButton userId={u.id} active={u.active} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
