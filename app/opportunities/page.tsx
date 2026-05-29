import Header from '@/components/layout/Header';
import { opportunities, kunden, einheiten } from '@/lib/data';
import { formatCurrency, phaseConfig } from '@/lib/utils';
import { OpportunityPhase } from '@/lib/types';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const PHASEN: OpportunityPhase[] = ['erstgespraech', 'qualifizierung', 'angebot', 'reservierung', 'notartermin', 'abgeschlossen'];

export default function OpportunitiesPage() {
  const aktive = opportunities.filter(o => o.phase !== 'verloren');

  return (
    <div className="min-h-full">
      <Header
        title="Opportunities"
        actions={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Neue Opportunity
          </button>
        }
      />
      <div className="p-4 lg:p-6">
        {/* Pipeline-Phasen-Übersicht */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {PHASEN.map((phase, i) => {
              const cfg = phaseConfig[phase];
              const count = aktive.filter(o => o.phase === phase).length;
              const wert = aktive.filter(o => o.phase === phase).reduce((s, o) => s + o.gesamtwert, 0);
              return (
                <div key={phase} className="flex items-center">
                  <div className={`rounded-xl px-4 py-3 min-w-[140px] border ${count > 0 ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</p>
                    <p className="text-xl font-bold text-slate-800 mt-1">{count}</p>
                    <p className="text-xs text-slate-500">{wert > 0 ? formatCurrency(wert) : '–'}</p>
                  </div>
                  {i < PHASEN.length - 1 && (
                    <div className="text-slate-300 mx-1 text-lg">›</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Kanban */}
        <div className="hidden lg:grid grid-cols-3 gap-4">
          {PHASEN.filter(p => ['erstgespraech', 'qualifizierung', 'angebot', 'reservierung', 'notartermin'].includes(p)).map(phase => {
            const cfg = phaseConfig[phase];
            const opps = opportunities.filter(o => o.phase === phase);
            return (
              <div key={phase} className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                  <span className="bg-slate-200 text-slate-600 text-xs font-medium rounded-full px-2">{opps.length}</span>
                </div>
                <div className="space-y-2">
                  {opps.map(opp => <OppCard key={opp.id} opp={opp} />)}
                  {opps.length === 0 && <p className="text-slate-400 text-xs text-center py-4">Leer</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: Liste */}
        <div className="lg:hidden space-y-3">
          {PHASEN.map(phase => {
            const opps = opportunities.filter(o => o.phase === phase);
            if (opps.length === 0) return null;
            const cfg = phaseConfig[phase];
            return (
              <div key={phase}>
                <h2 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${cfg.color}`}>{cfg.label}</h2>
                <div className="space-y-2">
                  {opps.map(opp => <OppCard key={opp.id} opp={opp} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OppCard({ opp }: { opp: (typeof opportunities)[0] }) {
  const kunde = kunden.find(k => k.id === opp.kundeId);
  const cfg = phaseConfig[opp.phase];
  const positionen = opp.positionen.map(p => einheiten.find(e => e.id === p.einheitId)).filter(Boolean);
  return (
    <Link href={`/opportunities/${opp.id}`}
      className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <p className="font-semibold text-slate-800 text-sm">{opp.bezeichnung}</p>
      <p className="text-xs text-slate-500 mt-0.5">{kunde?.vorname} {kunde?.nachname}</p>
      <p className="text-xs text-slate-400 mt-1 truncate">{positionen.map(e => e?.bezeichnung).join(', ')}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm font-bold text-slate-800">{formatCurrency(opp.gesamtwert)}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
      </div>
    </Link>
  );
}
