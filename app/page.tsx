import Header from '@/components/layout/Header';
import { einheiten, opportunities, kunden } from '@/lib/data';
import { formatCurrency, daysUntil, phaseConfig, statusConfig } from '@/lib/utils';
import { AlertTriangle, TrendingUp, Building2, Users, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const pipeline = opportunities.filter(o => o.phase !== 'abgeschlossen' && o.phase !== 'verloren');
  const abgeschlossen = opportunities.filter(o => o.phase === 'abgeschlossen');

  const verfuegbar = einheiten.filter(e => e.status === 'verfuegbar').length;
  const reserviert = einheiten.filter(e => e.status === 'reserviert').length;

  const ablaufendeReservierungen = einheiten.filter(e => {
    if (e.status !== 'reserviert' || !e.reserviertBis) return false;
    return daysUntil(e.reserviertBis) <= 3;
  });

  const pipelineWert = pipeline.reduce((s, o) => s + o.gesamtwert, 0);
  const abgeschlossenWert = abgeschlossen.reduce((s, o) => s + o.gesamtwert, 0);

  return (
    <div className="min-h-full">
      <Header title="Cockpit" subtitle="Willkommen zurück, Alex" />
      <div className="p-4 lg:p-6 space-y-6">

        {ablaufendeReservierungen.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-amber-800 font-semibold text-sm">
                {ablaufendeReservierungen.length} Reservierung{ablaufendeReservierungen.length > 1 ? 'en laufen' : ' läuft'} bald ab
              </p>
              <div className="mt-1 space-y-1">
                {ablaufendeReservierungen.map(e => (
                  <p key={e.id} className="text-amber-700 text-sm">
                    <Link href={`/katalog/${e.id}`} className="underline underline-offset-2 font-medium hover:text-amber-900">
                      {e.bezeichnung}
                    </Link>
                    {' — noch '}
                    <span className="font-bold">{daysUntil(e.reserviertBis!)} Tag{daysUntil(e.reserviertBis!) !== 1 ? 'e' : ''}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <KPICard icon={<TrendingUp size={20} className="text-blue-600" />} label="Pipeline" value={formatCurrency(pipelineWert)} sub={`${pipeline.length} offene Opportunities`} />
          <KPICard icon={<CheckCircle2 size={20} className="text-emerald-600" />} label="Abgeschlossen" value={formatCurrency(abgeschlossenWert)} sub={`${abgeschlossen.length} Abschlüsse`} />
          <KPICard icon={<Building2 size={20} className="text-violet-600" />} label="Verfügbar" value={String(verfuegbar)} sub={`${reserviert} reserviert`} />
          <KPICard icon={<Users size={20} className="text-orange-600" />} label="Kunden" value={String(kunden.length)} sub="in meiner Pipeline" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-700">Offene Opportunities</h2>
              <Link href="/opportunities" className="text-blue-600 text-sm hover:underline">Alle →</Link>
            </div>
            <div className="space-y-2">
              {pipeline.length === 0 && (
                <p className="text-slate-500 text-sm py-4 text-center">Keine offenen Opportunities</p>
              )}
              {pipeline.map(opp => {
                const kunde = kunden.find(k => k.id === opp.kundeId);
                const cfg = phaseConfig[opp.phase];
                return (
                  <Link key={opp.id} href={`/opportunities/${opp.id}`}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{opp.bezeichnung}</p>
                      <p className="text-slate-500 text-xs">{kunde?.vorname} {kunde?.nachname}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-slate-800 text-sm">{formatCurrency(opp.gesamtwert)}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-700">Verfügbare Einheiten</h2>
              <Link href="/katalog" className="text-blue-600 text-sm hover:underline">Katalog →</Link>
            </div>
            <div className="space-y-2">
              {einheiten.filter(e => e.status === 'verfuegbar').slice(0, 4).map(e => {
                const cfg = statusConfig[e.status];
                return (
                  <Link key={e.id} href={`/katalog/${e.id}`}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{e.bezeichnung}</p>
                      <p className="text-slate-500 text-xs">{e.zimmer} Zi · {e.flaeche} m²</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-slate-800 text-sm">{formatCurrency(e.kaufpreis)}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <section>
          <h2 className="font-semibold text-slate-700 mb-3">Anstehende Zieldaten</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pipeline
              .sort((a, b) => new Date(a.zieldatum).getTime() - new Date(b.zieldatum).getTime())
              .slice(0, 3)
              .map(opp => {
                const days = daysUntil(opp.zieldatum);
                const urgent = days <= 30;
                return (
                  <Link key={opp.id} href={`/opportunities/${opp.id}`}
                    className={`bg-white border rounded-xl p-4 hover:shadow-sm transition-all ${urgent ? 'border-amber-200' : 'border-slate-200'}`}>
                    <div className="flex items-start gap-2">
                      <Clock size={16} className={`${urgent ? 'text-amber-500' : 'text-slate-400'} mt-0.5 shrink-0`} />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{opp.bezeichnung}</p>
                        <p className={`text-xs mt-1 font-medium ${urgent ? 'text-amber-600' : 'text-slate-500'}`}>
                          {days > 0 ? `Ziel in ${days} Tagen` : 'Zieldatum überschritten'}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </section>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}
