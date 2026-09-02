import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FileDown } from 'lucide-react';
import Header from '@/components/layout/Header';
import { requireUser } from '@/lib/dal';
import { getTripWithDetails } from '@/lib/repo/trips';
import { listVehicleTypes } from '@/lib/repo/vehicleTypes';
import { formatCents, formatDate, formatDateTime } from '@/lib/money';
import { auditActionLabels, categoryLabels, paymentMethodLabels, statusConfig, STATUS_PATH } from '@/lib/statusConfig';
import {
  AddMileageForm,
  AddReceiptForm,
  ApproveForm,
  DeleteMileageButton,
  DeleteReceiptButton,
  EditTripForm,
  ReturnForm,
  SubmitTripButton,
  TakeForReviewButton,
} from './forms';

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const trip = getTripWithDetails(id);
  if (!trip) notFound();

  const isOwner = trip.employeeId === user.id;
  const isApprover = user.isApprover || user.isAdmin;
  if (!isOwner && !isApprover) redirect('/reisekosten');

  const canEdit = isOwner && (trip.status === 'ENTWURF' || trip.status === 'ZURUECKGEGEBEN');
  const canReview = isApprover && trip.status === 'EINGEREICHT';
  const isMyReview = isApprover && trip.status === 'IN_PRUEFUNG' && trip.reviewerId === user.id;
  const status = statusConfig[trip.status];
  const vehicleTypes = listVehicleTypes();

  return (
    <div className="min-h-full">
      <Header
        title={trip.zweck}
        actions={
          trip.status !== 'ENTWURF' ? (
            <a
              href={`/reisekosten/${trip.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <FileDown size={15} />
              PDF
            </a>
          ) : undefined
        }
      />
      <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">
        {!isOwner && (
          <p className="text-sm text-slate-500">
            Mitarbeitend: <span className="font-medium text-slate-700">{trip.employee.name}</span>
          </p>
        )}

        <StatusPath status={trip.status} />

        {trip.status === 'ZURUECKGEGEBEN' && isOwner && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Diese Reise wurde zurückgegeben. Bitte die angeforderten Änderungen vornehmen und erneut einreichen.
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-700">Stammdaten</h2>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
              {canEdit ? (
                <EditTripForm
                  tripId={trip.id}
                  defaults={{
                    zweck: trip.zweck,
                    ziel: trip.ziel,
                    kostenstelle: trip.kostenstelle,
                    vonDatum: trip.vonDatum,
                    bisDatum: trip.bisDatum,
                  }}
                />
              ) : (
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Ziel" value={trip.ziel} />
                  <Info label="Kostenstelle" value={trip.kostenstelle} />
                  <Info label="Zeitraum" value={`${formatDate(trip.vonDatum)} – ${formatDate(trip.bisDatum)}`} />
                </dl>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-700 mb-4">Belege</h2>
              <div className="space-y-2 mb-4">
                {trip.receipts.length === 0 && <p className="text-sm text-slate-400">Noch keine Belege erfasst.</p>}
                {trip.receipts.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-slate-700">{r.haendler}</span>
                      <span className="text-slate-400"> · {categoryLabels[r.kategorie]} · {paymentMethodLabels[r.zahlungsart]} · {formatDate(r.belegDatum)}</span>
                      {r.dateiPfad && (
                        <>
                          {' · '}
                          <a
                            href={`/reisekosten/${trip.id}/belege/${r.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Beleg ansehen
                          </a>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800">{formatCents(r.betragCent)}</span>
                      {canEdit && <DeleteReceiptButton tripId={trip.id} receiptId={r.id} />}
                    </div>
                  </div>
                ))}
              </div>
              {canEdit && <AddReceiptForm tripId={trip.id} />}
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-700 mb-4">Kilometerabrechnung</h2>
              <div className="space-y-2 mb-4">
                {trip.mileageEntries.length === 0 && (
                  <p className="text-sm text-slate-400">Noch keine Fahrten erfasst.</p>
                )}
                {trip.mileageEntries.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-slate-700">
                        {m.start} → {m.ziel}
                      </span>
                      <span className="text-slate-400">
                        {' '}
                        · {m.anlass} · {formatDate(m.datum)} · {m.kilometer} km
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800">
                        {formatCents(Math.round(m.kilometer * m.satzSnapshotCent))}
                      </span>
                      {canEdit && <DeleteMileageButton tripId={trip.id} entryId={m.id} />}
                    </div>
                  </div>
                ))}
              </div>
              {canEdit && <AddMileageForm tripId={trip.id} vehicleTypes={vehicleTypes} />}
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-700 mb-4">Prüfprotokoll</h2>
              <ol className="space-y-3">
                {trip.auditLog.map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <p className="text-slate-700">
                      <span className="font-medium">{auditActionLabels[entry.action]}</span>
                      <span className="text-slate-400"> · {entry.user.name} · {formatDateTime(entry.createdAt)}</span>
                    </p>
                    {entry.comment && <p className="text-slate-500 mt-0.5">„{entry.comment}“</p>}
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="space-y-4">
            <section className="bg-white border-2 border-emerald-200 bg-emerald-50 rounded-xl p-5">
              <p className="text-sm font-medium text-slate-600 mb-1">Erstattungsfähiger Betrag</p>
              <p className="text-3xl font-bold text-emerald-700">{formatCents(trip.erstattungGesamtCent)}</p>
            </section>

            {canEdit && (
              <section className="bg-white border border-slate-200 rounded-xl p-5">
                <SubmitTripButton tripId={trip.id} />
              </section>
            )}

            {canReview && (
              <section className="bg-white border border-slate-200 rounded-xl p-5">
                <TakeForReviewButton tripId={trip.id} />
              </section>
            )}

            {isMyReview && (
              <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h2 className="font-semibold text-slate-700">Entscheidung</h2>
                <ApproveForm tripId={trip.id} />
                <div className="border-t border-slate-100 pt-4">
                  <ReturnForm tripId={trip.id} />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-700 font-medium">{value}</dd>
    </div>
  );
}

function StatusPath({ status }: { status: keyof typeof statusConfig }) {
  const returned = status === 'ZURUECKGEGEBEN';
  const currentStep = statusConfig[status].step;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-2 overflow-x-auto">
      {STATUS_PATH.map((s, i) => {
        const stepNumber = i + 1;
        const active = stepNumber <= currentStep && !(returned && stepNumber > 1);
        const isReturnedMarker = returned && stepNumber === 2;
        return (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <div
              className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                isReturnedMarker
                  ? 'bg-red-100 text-red-700'
                  : active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isReturnedMarker ? 'Zurückgegeben' : statusConfig[s].label}
            </div>
            {i < STATUS_PATH.length - 1 && <div className="w-4 h-px bg-slate-200" />}
          </div>
        );
      })}
      <Link href="/reisekosten" className="ml-auto text-xs text-blue-600 hover:underline shrink-0">
        ← Zur Übersicht
      </Link>
    </div>
  );
}
