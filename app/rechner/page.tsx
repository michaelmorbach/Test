'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { einheiten, projekte, kunden } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { Calculator, Plus, Trash2, ChevronLeft, User } from 'lucide-react';
import Link from 'next/link';

interface EinheitPosition {
  einheitId: string;
  kaufpreis: number;
  kaltmiete: number;
  eigenkapital: number;
  baujahr: number;
}

function berechne(pos: EinheitPosition, zinssatz: number, tilgung: number, werbungskosten: number, steuersatz: number) {
  const darlehen = Math.max(0, pos.kaufpreis - pos.eigenkapital);
  const zinsenJahr = darlehen * (zinssatz / 100);
  const tilgungJahr = darlehen * (tilgung / 100);
  const annuitaetMonat = (zinsenJahr + tilgungJahr) / 12;
  const mietJahr = pos.kaltmiete * 12;
  const wkJahr = werbungskosten * 12;
  const afaSatz = pos.baujahr >= 2023 ? 3 : 2;
  const afaJahr = pos.kaufpreis * 0.8 * (afaSatz / 100);
  const steuerUeberschuss = mietJahr - zinsenJahr - wkJahr - afaJahr;
  const steuereffektJahr = steuerUeberschuss * (steuersatz / 100) * -1;
  const steuereffektMonat = steuereffektJahr / 12;
  const liquiditaetMonat = pos.kaltmiete - annuitaetMonat - werbungskosten + steuereffektMonat;
  return { darlehen, zinsenJahr, annuitaetMonat, mietJahr, wkJahr, afaJahr, afaSatz, steuerUeberschuss, steuereffektJahr, steuereffektMonat, liquiditaetMonat };
}

function RechnerInner() {
  const sp = useSearchParams();
  const kundeId = sp.get('kundeId');
  const kunde = kundeId ? kunden.find(k => k.id === kundeId) : null;

  // Kundendaten (editierbar)
  const [steuersatz, setSteuersatz] = useState(kunde?.steuersatz ?? 42);
  const [zinssatz, setZinssatz] = useState(3.8);
  const [tilgung, setTilgung] = useState(2.0);
  const [werbungskosten, setWerbungskosten] = useState(200);

  // Einheiten-Positionen
  const [positionen, setPositionen] = useState<EinheitPosition[]>(() => {
    const einheitId = sp.get('einheitId');
    const e = einheitId ? einheiten.find(x => x.id === einheitId) : null;
    if (e) return [{ einheitId: e.id, kaufpreis: e.kaufpreis, kaltmiete: e.kaltmiete, eigenkapital: kunde?.eigenkapital ?? 60000, baujahr: 2025 }];
    return [];
  });

  // Einheit-Auswahl State
  const [addProjektId, setAddProjektId] = useState('');
  const [addEinheitId, setAddEinheitId] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const verfuegbareEinheiten = addProjektId
    ? einheiten.filter(e => e.projektId === addProjektId && !positionen.find(p => p.einheitId === e.id))
    : [];

  function addEinheit() {
    const e = einheiten.find(x => x.id === addEinheitId);
    if (!e) return;
    setPositionen(prev => [...prev, {
      einheitId: e.id,
      kaufpreis: e.kaufpreis,
      kaltmiete: e.kaltmiete,
      eigenkapital: kunde?.eigenkapital ?? 60000,
      baujahr: 2025,
    }]);
    setAddEinheitId('');
    setAddProjektId('');
    setShowAdd(false);
  }

  function removeEinheit(einheitId: string) {
    setPositionen(prev => prev.filter(p => p.einheitId !== einheitId));
  }

  function updatePos(einheitId: string, field: keyof EinheitPosition, value: number) {
    setPositionen(prev => prev.map(p => p.einheitId === einheitId ? { ...p, [field]: value } : p));
  }

  // Gesamtberechnung
  const ergebnisse = positionen.map(pos => ({ pos, ...berechne(pos, zinssatz, tilgung, werbungskosten, steuersatz) }));
  const totalLiquiditaet = ergebnisse.reduce((s, e) => s + e.liquiditaetMonat, 0);
  const totalSteuerUeberschuss = ergebnisse.reduce((s, e) => s + e.steuerUeberschuss, 0);
  const totalSteuereffektJahr = totalSteuerUeberschuss * (steuersatz / 100) * -1;
  const totalKaufpreis = positionen.reduce((s, p) => s + p.kaufpreis, 0);
  const totalEK = positionen.reduce((s, p) => s + p.eigenkapital, 0);

  return (
    <div className="min-h-full">
      <Header
        title={kunde ? `Steuerrechnung – ${kunde.vorname} ${kunde.nachname}` : 'Steuer- & Renditerechner'}
        actions={
          kunde && (
            <Link href={`/kunden/${kunde.id}`} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <ChevronLeft size={16} /> Kunde
            </Link>
          )
        }
      />

      <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Linke Spalte: Parameter */}
          <div className="space-y-4">
            {/* Kundenprofil */}
            {kunde && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {kunde.vorname[0]}{kunde.nachname[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{kunde.vorname} {kunde.nachname}</p>
                    <p className="text-xs text-slate-500">{kunde.segment === 'kapitalanleger' ? 'Kapitalanleger' : 'Eigennutzer'}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jahreseinkommen</span>
                    <span className="font-medium text-slate-700">{formatCurrency(kunde.einkommen)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Eigenkapital (gesamt)</span>
                    <span className="font-medium text-slate-700">{formatCurrency(kunde.eigenkapital)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Steuer */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-4">Steuer</h3>
              <SliderInput label="Steuersatz (%)" value={steuersatz} onChange={setSteuersatz} min={14} max={45} step={1} />
            </div>

            {/* Finanzierung (gilt für alle Einheiten) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-4">Finanzierung (alle Einheiten)</h3>
              <div className="space-y-4">
                <SliderInput label="Zinssatz (% p.a.)" value={zinssatz} onChange={setZinssatz} min={0.5} max={8} step={0.1} decimals={1} />
                <SliderInput label="Tilgung (% p.a.)" value={tilgung} onChange={setTilgung} min={1} max={5} step={0.5} decimals={1} />
                <SliderInput label="Verwaltung/Mo (€)" value={werbungskosten} onChange={setWerbungskosten} min={0} max={1000} step={50} />
              </div>
            </div>
          </div>

          {/* Mitte + Rechts: Einheiten + Ergebnis */}
          <div className="lg:col-span-2 space-y-4">

            {/* Einheiten-Liste */}
            {positionen.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
                <Calculator size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Noch keine Wohnung hinzugefügt</p>
                <p className="text-slate-400 text-sm mt-1">Füge eine oder mehrere Wohnungen hinzu, um die Steuerrechnung zu sehen.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ergebnisse.map(({ pos, darlehen, annuitaetMonat, afaSatz, steuerUeberschuss, steuereffektMonat, liquiditaetMonat }) => {
                  const einheit = einheiten.find(e => e.id === pos.einheitId);
                  const projekt = einheit ? projekte.find(p => p.id === einheit.projektId) : null;
                  return (
                    <div key={pos.einheitId} className="bg-white border border-slate-200 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div>
                          <p className="font-semibold text-slate-800">{einheit?.bezeichnung}</p>
                          <p className="text-xs text-slate-500">{projekt?.name} · {einheit?.zimmer} Zi · {einheit?.flaeche} m²</p>
                        </div>
                        <button onClick={() => removeEinheit(pos.einheitId)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <NumberField label="Kaufpreis (€)" value={pos.kaufpreis} onChange={v => updatePos(pos.einheitId, 'kaufpreis', v)} />
                        <NumberField label="Kaltmiete/Mo (€)" value={pos.kaltmiete} onChange={v => updatePos(pos.einheitId, 'kaltmiete', v)} />
                        <NumberField label="Eigenkapital (€)" value={pos.eigenkapital} onChange={v => updatePos(pos.einheitId, 'eigenkapital', v)} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100">
                        <MiniKPI label="Darlehen" value={formatCurrency(darlehen)} />
                        <MiniKPI label="Annuität/Mo" value={`−${formatCurrency(annuitaetMonat)}`} red />
                        <MiniKPI label={steuerUeberschuss < 0 ? 'Steuerersparnis/Mo' : 'Steuerlast/Mo'} value={`${steuereffektMonat >= 0 ? '+' : ''}${formatCurrency(steuereffektMonat)}`} green={steuereffektMonat > 0} red={steuereffektMonat < 0} />
                        <MiniKPI label="Liquidität/Mo" value={`${liquiditaetMonat >= 0 ? '+' : ''}${formatCurrency(liquiditaetMonat)}`} green={liquiditaetMonat >= 0} red={liquiditaetMonat < 0} bold />
                      </div>
                      <p className="text-xs text-slate-400 mt-2">AfA {afaSatz} % · steuerlicher {steuerUeberschuss < 0 ? 'Verlust' : 'Überschuss'}: {formatCurrency(steuerUeberschuss)}/Jahr</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Einheit hinzufügen */}
            {!showAdd ? (
              <button onClick={() => setShowAdd(true)}
                className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 text-slate-500 hover:text-blue-600 rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Plus size={16} /> Wohnung hinzufügen
              </button>
            ) : (
              <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-3">
                <p className="font-semibold text-slate-700 text-sm">Wohnung auswählen</p>
                <select value={addProjektId} onChange={e => { setAddProjektId(e.target.value); setAddEinheitId(''); }}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Projekt wählen …</option>
                  {projekte.map(p => <option key={p.id} value={p.id}>{p.name} – {p.ort}</option>)}
                </select>
                {addProjektId && (
                  <select value={addEinheitId} onChange={e => setAddEinheitId(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
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

            {/* Gesamtergebnis */}
            {positionen.length > 0 && (
              <div className="bg-slate-900 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Calculator size={16} />
                  Gesamtergebnis — {positionen.length} Wohnung{positionen.length > 1 ? 'en' : ''}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <GesamtKPI label="Gesamtkaufpreis" value={formatCurrency(totalKaufpreis)} />
                  <GesamtKPI label="Eigenkapital gesamt" value={formatCurrency(totalEK)} />
                  <GesamtKPI label="Steuereffekt p.a." value={`${totalSteuereffektJahr >= 0 ? '+' : ''}${formatCurrency(totalSteuereffektJahr)}`} highlight={totalSteuereffektJahr > 0} />
                  <GesamtKPI label="Liquidität/Monat gesamt" value={`${totalLiquiditaet >= 0 ? '+' : ''}${formatCurrency(totalLiquiditaet)}`} highlight={totalLiquiditaet >= 0} />
                </div>
                <p className="text-slate-400 text-xs">
                  Kombinierter steuerlicher {totalSteuerUeberschuss < 0 ? 'Verlust' : 'Überschuss'}: {formatCurrency(totalSteuerUeberschuss)}/Jahr · Steuersatz: {steuersatz} %
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                  <Calculator size={15} />
                  Als Kundenunterlage exportieren (PDF)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RechnerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Lädt …</div>}>
      <RechnerInner />
    </Suspense>
  );
}

function SliderInput({ label, value, onChange, min, max, step, decimals = 0 }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; decimals?: number;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs font-medium text-slate-500">{label}</label>
        <span className="text-xs font-bold text-slate-700">{decimals > 0 ? value.toFixed(decimals) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-600" />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs text-slate-500 block mb-1">{label}</label>
      <input type="number" value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function MiniKPI({ label, value, green, red, bold }: { label: string; value: string; green?: boolean; red?: boolean; bold?: boolean }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm ${bold ? 'font-bold' : 'font-semibold'} ${green ? 'text-emerald-700' : red ? 'text-red-600' : 'text-slate-700'}`}>{value}</p>
    </div>
  );
}

function GesamtKPI({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
