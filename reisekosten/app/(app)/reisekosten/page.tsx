import Link from 'next/link';
import { Plus } from 'lucide-react';
import Header from '@/components/layout/Header';
import { requireUser } from '@/lib/dal';
import { listTripsForEmployee, tripReimbursementTotalCents } from '@/lib/repo/trips';
import { formatCents, formatDate } from '@/lib/money';
import { statusConfig } from '@/lib/statusConfig';

export default async function ReisekostenPage() {
  const user = await requireUser();
  const trips = listTripsForEmployee(user.id);

  return (
    <div className="min-h-full">
      <Header
        title="Meine Reisekosten"
        actions={
          <Link
            href="/reisekosten/neu"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Neue Reise
          </Link>
        }
      />
      <div className="p-4 lg:p-6">
        {trips.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            Noch keine Reisen erfasst. Lege deine erste Reisekostenabrechnung an.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => {
              const status = statusConfig[trip.status];
              const total = tripReimbursementTotalCents(trip.id);
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
                  <p className="text-sm text-slate-500 mb-1">{trip.ziel}</p>
                  <p className="text-xs text-slate-400 mb-4">
                    {formatDate(trip.vonDatum)} – {formatDate(trip.bisDatum)} · Kst. {trip.kostenstelle}
                  </p>
                  <div className="pt-3 border-t border-slate-100 flex justify-between text-sm">
                    <span className="text-slate-500">Erstattung</span>
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
