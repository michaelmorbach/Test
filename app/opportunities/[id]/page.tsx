'use client';
import { use } from 'react';
import Header from '@/components/layout/Header';
import { opportunities, kunden, einheiten, projekte } from '@/lib/data';
import { formatCurrency, phaseConfig, statusConfig, formatDate } from '@/lib/utils';
import { OpportunityPhase } from '@/lib/types';
import Link from 'next/link';
import { ChevronLeft, User, Building2, Euro, Calendar, ChevronRight } from 'lucide-react';

const PHASEN_ORDER: OpportunityPhase[] = ['erstgespraech', 'qualifizierung', 'angebot', 'reservierung', 'notartermin', 'abgeschlossen'];

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const opp = opportunities.find(o => o.id === id);

  if (!opp) {
    return (
      <div className="min-h-full">
        <Header title="Opportunity nicht gefunden" />
        <div className="p-6 text-center">
          <Link href="/opportunities" className="text-blue-600 hover:underline">← Zurück</Link>
        </div>
      </div>
    );
  }

  const kunde = kunden.find(k => k.id === opp.kundeId);
  const cfg = phaseConfig[opp.phase];
  const currentStep = cfg.step;

  const positionen = opp.positionen.map(pos => {
    const einheit = einheiten.find(e => e.id === pos.einheitId);
    const projekt = einheit ? projekte.find(p => p.id === einheit.projektId) : null;
    const extras = einheit?.extras.filter(ex => pos.extrasIds.includes(ex.id)) ?? [];
    const posWert = (einheit?.kaufpreis ?? 0) + extras.reduce((s, ex) => s + ex.preis, 0);
    return { pos, einheit, projekt, extras, posWert };
  });

  return (
    <div className="min-h-full">
      <Header
        title={opp.bezeichnung}
        actions={
          <Link href="/opportunities" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <ChevronLeft size={16} /> Opportunities
          </Link>
        }
      />
      <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">

        {/* Pipeline-Fortschritt */}
        {opp.phase !== 'verloren' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-700 mb-4">Pipeline-Phase</h3>
            <div className="flex items-center gap-0 overflow-x-auto pb-1">
              {PHASEN_ORDER.map((phase, i) => {
                const pCfg = phaseConfig[phase];
                const isActive = phase === opp.phase;
                const isDone = pCfg.step < currentStep;
                return (
                  <div key={phase} className="flex items-center">
                    <div className={`flex flex-col items-center px-2`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                        ${isActive ? 'bg-blue-600 border-blue-600 text-white' : isDone ? 'bg-emerald-100 border-emerald-400 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs mt-1 whitespace-nowrap font-medium
                        ${isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {pCfg.label}
                      </span>
                    </div>
                    {i < PHASEN_ORDER.length - 1 && (
                      <div className={`h-0.5 w-4 shrink-0 mb-4 ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">

            {/* Positionen */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Building2 size={16} /> Positionen
              </h3>
              <div className="space-y-4">
                {positionen.map(({ pos, einheit, projekt, extras, posWert }) => {
                  if (!einheit) return null;
                  const sCfg = statusConfig[einheit.status];
                  return (
                    <div key={pos.einheitId} className="border border-slate-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <Link href={`/katalog/${einheit.id}`} className="font-semibold text-slate-800 hover:text-blue-600 text-sm">
                            {einheit.bezeichnung}
                          </Link>
                          <p className="text-xs text-slate-500">{projekt?.name} · {einheit.zimmer} Zi · {einheit.flaeche} m²</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${sCfg.bg} ${sCfg.color}`}>{sCfg.label}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Kaufpreis</span>
                          <span className="font-medium text-slate-700">{formatCurrency(einheit.kaufpreis)}</span>
                        </div>
                        {extras.map(ex => (
                          <div key={ex.id} className="flex justify-between text-sm">
                            <span className="text-slate-500">{ex.bezeichnung}</span>
                            <span className="text-slate-600">{formatCurrency(ex.preis)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold border-t border-slate-100 pt-1 mt-1">
                          <span className="text-slate-700">Positionswert</span>
                          <span className="text-slate-800">{formatCurrency(posWert)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-200">
                  <span>Gesamtwert</span>
                  <span className="text-lg">{formatCurrency(opp.gesamtwert)}</span>
                </div>
              </div>
            </div>

            {/* Notizen */}
            {opp.notizen && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-700 mb-2">Notizen</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{opp.notizen}</p>
              </div>
            )}
          </div>

          {/* Seitenleiste */}
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-3">Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Phase</span>
                  <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Zieldatum</span>
                  <span className="font-medium text-slate-700">{formatDate(opp.zieldatum)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Erstellt</span>
                  <span className="text-slate-500">{formatDate(opp.erstellt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Aktualisiert</span>
                  <span className="text-slate-500">{formatDate(opp.aktualisiert)}</span>
                </div>
              </div>
            </div>

            {/* Kunde */}
            {kunde && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <User size={15} /> Kunde
                </h3>
                <Link href={`/kunden/${kunde.id}`}
                  className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-2 -mx-2 transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {kunde.vorname[0]}{kunde.nachname[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{kunde.vorname} {kunde.nachname}</p>
                    <p className="text-xs text-slate-500">{kunde.telefon}</p>
                  </div>
                  <ChevronRight size={14} className="ml-auto text-slate-400" />
                </Link>
              </div>
            )}

            {/* Aktionen */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-slate-700 mb-3">Aktionen</h3>
              <button className="w-full text-sm border border-slate-200 rounded-xl py-2.5 px-4 text-slate-700 hover:bg-slate-50 transition-colors font-medium">
                Phase aktualisieren
              </button>
              <Link href={`/rechner?einheitId=${opp.positionen[0]?.einheitId}`}
                className="block w-full text-sm border border-slate-200 rounded-xl py-2.5 px-4 text-center text-slate-700 hover:bg-slate-50 transition-colors font-medium">
                Steuerrechner
              </Link>
              <button className="w-full text-sm border border-slate-200 rounded-xl py-2.5 px-4 text-slate-700 hover:bg-slate-50 transition-colors font-medium">
                Exposé generieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
