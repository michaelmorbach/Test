import Link from 'next/link';
import Header from '@/components/layout/Header';
import { requireApprover } from '@/lib/dal';
import { listTripsForReview, tripReimbursementTotalCents } from '@/lib/repo/trips';
import { findUserById } from '@/lib/repo/users';
import { formatCents, formatDate } from '@/lib/money';
import { statusConfig } from '@/lib/statusConfig';

export default async function FreigabenPage() {
  const user = await requireApprover();
  const trips = listTripsForReview();

  return (
    <div className="min-h-full">
      <Header title="Freigaben" />
      <div className="p-4 lg:p-6">
        {trips.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            Aktuell keine offenen Einreichungen.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => {
              const employee = findUserById(trip.employeeId);
              const status = statusConfig[trip.status];
              const total = tripReimbursementTotalCents(trip.id);
              const isMine = trip.reviewerId === user.id;
              return (
                <Link
                  key={trip.id}
                  href={`/reisekosten/${trip.id}`}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-semibold text-slate-800">{trip.zweck}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">{employee?.name ?? 'Unbekannt'} · {trip.ziel}</p>
                  <p className="text-xs text-slate-400 mb-4">
                    {formatDate(trip.vonDatum)} – {formatDate(trip.bisDatum)} · Kst. {trip.kostenstelle}
                  </p>
                  <div className="pt-3 border-t border-slate-100 flex justify-between text-sm">
                    <span className="text-slate-500">{isMine ? 'Bei dir in Prüfung' : 'Erstattung'}</span>
                    <span className="font-semibold text-slate-800">{formatCents(total)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
