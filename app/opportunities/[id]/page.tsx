'use client';
import { use, useState } from 'react';
import Header from '@/components/layout/Header';
import { opportunities, kunden, einheiten, projekte } from '@/lib/data';
import { formatCurrency, phaseConfig, statusConfig, formatDate } from '@/lib/utils';
import { OpportunityPhase, OpportunityPosition } from '@/lib/types';
import Link from 'next/link';
import { ChevronLeft, User, Building2, ChevronRight, Plus, Trash2, Calculator, CheckCircle2, XCircle } from 'lucide-react';

const PHASEN_ORDER: OpportunityPhase[] = ['erstgespraech', 'qualifizierung', 'angebot', 'reservierung', 'notartermin', 'abgeschlossen'];

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const opp = opportunities.find(o => o.id === id);

  // Lokaler State (Prototyp: kein Backend)
  const [phase, setPhase] = useState<OpportunityPhase>(opp?.phase ?? 'erstgespraech');
  const [positionen, setPositionen] = useState<OpportunityPosition[]>(opp?.positionen ?? []);
  const [addProjektId, setAddProjektId] = useState('');
  const [addEinheitId, setAddEinheitId] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showVerloren, setShowVerloren] = useState(false);

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
  const cfg = phaseConfig[phase];
  const currentStep = cfg.step;

  const positionenMitDaten = positionen.map(pos => {
    const einheit = einheiten.find(e => e.id === pos.einheitId);
    const projekt = einheit ? projekte.find(p => p.id === einheit.projektId) : null;
    const extras = einheit?.extras.filter(ex => pos.extrasIds.includes(ex.id)) ?? [];
    const posWert = (einheit?.kaufpreis ?? 0) + extras.reduce((s, ex) => s + ex.preis, 0);
    return { pos, einheit, projekt, extras, posWert };
  });

  const gesamtwert = positionenMitDaten.reduce((s, p) => s + p.posWert, 0);

  const verfuegbareEinheiten = addProjektId
    ? einheiten.filter(e => e.projektId === addProjektId && !positionen.find(p => p.einheitId === e.id))
    : [];

  function addEinheit() {
    const e = einheiten.find(x => x.id === addEinheitId);
    if (!e) return;
    setPositionen(prev => [...prev, { einheitId: e.id, extrasIds: [] }]);
    setAddEinheitId('');
    setAddProjektId('');
    setShowAdd(false);
  }

  function removeEinheit(einheitId: string) {
    setPositionen(prev => prev.filter(p => p.einheitId !== einheitId));
  }

  // URL für Steuerrechner: kundeId + alle einheitIds
  const einheitIds = positionen.map(p => p.einheitId).join(',');
  const rechnerUrl = `/rechner?kundeId=${opp.kundeId}${einheitIds ? `&einheitIds=${einheitIds}` : ''}`;

  if (phase === 'verloren') {
    return (
      <div className="min-h-full">
        <Header title={opp.bezeichnung} actions={
          <Link href="/opportunities" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <ChevronLeft size={16} /> Opportunities
          </Link>
        } />
        <div className="p-6 max-w-lg mx-auto text-center space-y-4">
          <XCircle size={48} className="text-red-400 mx-auto" />
          <p className="text-lg font-semibold text-slate-700">Opportunity verloren</p>
          <p className="text-slate-500 text-sm">{opp.bezeichnung}</p>
          <button onClick={() => setPhase('erstgespraech')}
            className="text-sm text-blue-600 hover:underline">Wieder öffnen</button>
        </div>
      </div>
    );
  }

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

        {/* Pipeline-Fortschritt – klickbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Pipeline-Phase</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          </div>
          <div className="flex items-center overflow-x-auto pb-1">
            {PHASEN_ORDER.map((p, i) => {
              const pCfg = phaseConfig[p];
              const isActive = p === phase;
              const isDone = pCfg.step < currentStep;
              const isClickable = true;
              return (
                <div key={p} className="flex items-center">
                  <button
                    onClick={() => setPhase(p)}
                    title={`Zu „${pCfg.label}" wechseln`}
                    className={`flex flex-col items-center px-2 group transition-all ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                      ${isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                        : isDone
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-600 group-hover:border-emerald-500'
                          : 'bg-slate-100 border-slate-200 text-slate-400 group-hover:border-blue-400 group-hover:text-blue-500'
                      }`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs mt-1 whitespace-nowrap font-medium transition-colors
                      ${isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
                      {pCfg.label}
                    </span>
                  </button>
                  {i < PHASEN_ORDER.length - 1 && (
                    <div className={`h-0.5 w-5 shrink-0 mb-4 transition-colors ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-3">Klick auf eine Phase um direkt dorthin zu wechseln.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">

            {/* Positionen */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Building2 size={16} /> Positionen
              </h3>
              <div className="space-y-3">
                {positionenMitDaten.map(({ pos, einheit, projekt, extras, posWert }) => {
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
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${sCfg.bg} ${sCfg.color}`}>{sCfg.label}</span>
                          <button onClick={() => removeEinheit(pos.einheitId)}
                            className="text-slate-300 hover:text-red-500 transition-colors" title="Entfernen">
                            <Trash2 size={14} />
                          </button>
                        </div>
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

                {/* Einheit hinzufügen */}
                {!showAdd ? (
                  <button onClick={() => setShowAdd(true)}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 text-slate-400 hover:text-blue-600 rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Plus size={15} /> Wohnung hinzufügen
                  </button>
                ) : (
                  <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Wohnung auswählen</p>
                    <select value={addProjektId} onChange={e => { setAddProjektId(e.target.value); setAddEinheitId(''); }}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Projekt wählen …</option>
                      {projekte.map(p => <option key={p.id} value={p.id}>{p.name} – {p.ort}</option>)}
                    </select>
                    {addProjektId && (
                      <select value={addEinheitId} onChange={e => setAddEinheitId(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Einheit wählen …</option>
                        {verfuegbareEinheiten.map(e => (
                          <option key={e.id} value={e.id}>{e.bezeichnung} · {formatCurrency(e.kaufpreis)} · {e.zimmer} Zi</option>
                        ))}
                        {verfuegbareEinheiten.length === 0 && <option disabled>Alle Einheiten bereits hinzugefügt</option>}
                      </select>
                    )}
                    <div className="flex gap-2">
                      <button onClick={addEinheit} disabled={!addEinheitId}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                        Hinzufügen
                      </button>
                      <button onClick={() => { setShowAdd(false); setAddProjektId(''); setAddEinheitId(''); }}
                        className="flex-1 border border-slate-200 text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-50 transition-colors">
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-200">
                  <span>Gesamtwert</span>
                  <span className="text-lg">{formatCurrency(gesamtwert)}</span>
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
              <h3 className="font-semibold text-slate-700 mb-3">Details</h3>
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

              <Link href={rechnerUrl}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                <Calculator size={15} />
                Steuerrechnung starten
              </Link>

              <button className="w-full text-sm border border-slate-200 rounded-xl py-2.5 px-4 text-slate-700 hover:bg-slate-50 transition-colors font-medium">
                Exposé generieren
              </button>

              {!showVerloren ? (
                <button onClick={() => setShowVerloren(true)}
                  className="w-full text-sm border border-red-200 rounded-xl py-2.5 px-4 text-red-500 hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2">
                  <XCircle size={14} /> Als verloren markieren
                </button>
              ) : (
                <div className="border border-red-200 bg-red-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-red-700 font-medium">Opportunity wirklich schließen?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPhase('verloren')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
                      Ja, verloren
                    </button>
                    <button onClick={() => setShowVerloren(false)}
                      className="flex-1 border border-slate-200 text-slate-600 text-xs py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
