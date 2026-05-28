'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { einheiten } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { Calculator, Info } from 'lucide-react';
import { Suspense } from 'react';

function Rechner() {
  const sp = useSearchParams();
  const einheitId = sp.get('einheitId');
  const einheit = einheitId ? einheiten.find(e => e.id === einheitId) : null;

  // Eingaben
  const [kaufpreis, setKaufpreis] = useState(einheit?.kaufpreis ?? 280000);
  const [kaltmiete, setKaltmiete] = useState(einheit?.kaltmiete ?? 1050);
  const [eigenkapital, setEigenkapital] = useState(80000);
  const [zinssatz, setZinssatz] = useState(3.8);
  const [tilgung, setTilgung] = useState(2.0);
  const [jahreseinkommen, setJahreseinkommen] = useState(85000);
  const [steuersatz, setSteuersatz] = useState(42);
  const [baujahr, setBaujahr] = useState(2026);
  const [werbungskosten, setWerbungskosten] = useState(300);

  useEffect(() => {
    if (einheit) {
      setKaufpreis(einheit.kaufpreis);
      setKaltmiete(einheit.kaltmiete);
    }
  }, [einheit]);

  // Berechnungen
  const darlehen = Math.max(0, kaufpreis - eigenkapital);
  const zinsenJahr = darlehen * (zinssatz / 100);
  const tilgungJahr = darlehen * (tilgung / 100);
  const annuitaetMonat = (zinsenJahr + tilgungJahr) / 12;

  const mieteinnahmenJahr = kaltmiete * 12;
  const werbungskostenJahr = werbungskosten * 12;

  // AfA: 2% p.a. bei Neubau (Baujahr > 2023: 3%)
  const afaSatz = baujahr >= 2023 ? 3 : 2;
  const afaJahr = kaufpreis * 0.8 * (afaSatz / 100); // 80% Gebäudeanteil

  const werbungskostenGesamt = werbungskostenJahr + zinsenJahr + afaJahr;
  const steuerlicherUeberschuss = mieteinnahmenJahr - werbungskostenGesamt;
  const steuerersparnis = steuerlicherUeberschuss < 0 ? Math.abs(steuerlicherUeberschuss) * (steuersatz / 100) : 0;
  const steuermehrbelastung = steuerlicherUeberschuss > 0 ? steuerlicherUeberschuss * (steuersatz / 100) : 0;

  const bruttorendite = (mieteinnahmenJahr / kaufpreis) * 100;
  const einnahmenMonat = kaltmiete;
  const ausgabenMonat = annuitaetMonat + werbungskosten;
  const steuereffektMonat = (steuerlicherUeberschuss < 0 ? steuerersparnis : -steuermehrbelastung) / 12;
  const liquiditaetMonat = einnahmenMonat - ausgabenMonat + steuereffektMonat;

  const cashOnCash = eigenkapital > 0 ? (liquiditaetMonat * 12) / eigenkapital * 100 : 0;
  const ekRendite = eigenkapital > 0 ? ((mieteinnahmenJahr - zinsenJahr - werbungskostenJahr) / eigenkapital) * 100 : 0;

  return (
    <div className="min-h-full">
      <Header title="Steuer- & Renditerechner" />
      <div className="p-4 lg:p-6 space-y-4 max-w-5xl mx-auto">
        {einheit && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <Info size={15} className="text-blue-600" />
            <p className="text-sm text-blue-700 font-medium">
              Vorbelegt mit: {einheit.bezeichnung} · {formatCurrency(einheit.kaufpreis)} · {formatCurrency(einheit.kaltmiete)}/Mo
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Eingaben */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-4">Objekt</h3>
              <div className="space-y-4">
                <NumInput label="Kaufpreis (€)" value={kaufpreis} onChange={setKaufpreis} min={50000} max={2000000} step={1000} />
                <NumInput label="Kaltmiete/Monat (€)" value={kaltmiete} onChange={setKaltmiete} min={300} max={5000} step={50} />
                <NumInput label="Baujahr" value={baujahr} onChange={setBaujahr} min={1900} max={2030} step={1} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">AfA-Satz (automatisch)</span>
                  <span className="font-semibold text-slate-700">{afaSatz} % p.a.</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-4">Finanzierung</h3>
              <div className="space-y-4">
                <NumInput label="Eigenkapital (€)" value={eigenkapital} onChange={setEigenkapital} min={0} max={kaufpreis} step={5000} />
                <div className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-slate-500">Darlehen</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(darlehen)}</span>
                </div>
                <NumInput label="Zinssatz (% p.a.)" value={zinssatz} onChange={setZinssatz} min={0.5} max={8} step={0.1} decimals={1} />
                <NumInput label="Tilgung (% p.a.)" value={tilgung} onChange={setTilgung} min={1} max={5} step={0.5} decimals={1} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-4">Steuer & Kosten</h3>
              <div className="space-y-4">
                <NumInput label="Jahreseinkommen (€)" value={jahreseinkommen} onChange={setJahreseinkommen} min={20000} max={500000} step={5000} />
                <NumInput label="Steuersatz (%)" value={steuersatz} onChange={setSteuersatz} min={14} max={45} step={1} />
                <NumInput label="Verwaltungskosten/Mo (€)" value={werbungskosten} onChange={setWerbungskosten} min={0} max={2000} step={50} />
              </div>
            </div>
          </div>

          {/* Ergebnis */}
          <div className="space-y-4">
            {/* Monatliche Liquidität */}
            <div className={`rounded-xl p-5 border-2 ${liquiditaetMonat >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-sm font-medium text-slate-600 mb-1">Monatliche Liquidität (nach Steuern)</p>
              <p className={`text-4xl font-bold ${liquiditaetMonat >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {liquiditaetMonat >= 0 ? '+' : ''}{formatCurrency(liquiditaetMonat)}
              </p>
              <p className="text-sm text-slate-500 mt-1">pro Monat</p>
            </div>

            {/* Liquiditätsaufschlüsselung */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-4">Monatliche Rechnung</h3>
              <div className="space-y-2">
                <LiqRow label="+ Mieteinnahme" value={formatCurrency(einnahmenMonat)} green />
                <LiqRow label="− Annuität (Zins + Tilgung)" value={`−${formatCurrency(annuitaetMonat)}`} red />
                <LiqRow label="− Verwaltungskosten" value={`−${formatCurrency(werbungskosten)}`} red />
                <div className="border-t border-slate-100 pt-2">
                  <LiqRow label={steuereffektMonat >= 0 ? '+ Steuerersparnis' : '− Steuerlast'} value={`${steuereffektMonat >= 0 ? '+' : ''}${formatCurrency(steuereffektMonat)}`} green={steuereffektMonat >= 0} red={steuereffektMonat < 0} />
                </div>
                <div className="border-t border-slate-200 pt-2">
                  <LiqRow label="= Liquidität/Monat" value={`${liquiditaetMonat >= 0 ? '+' : ''}${formatCurrency(liquiditaetMonat)}`} bold green={liquiditaetMonat >= 0} red={liquiditaetMonat < 0} />
                </div>
              </div>
            </div>

            {/* Renditekennzahlen */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-4">Rendite-Kennzahlen</h3>
              <div className="space-y-3">
                <RendRow label="Bruttorendite" value={`${bruttorendite.toFixed(2)} %`} />
                <RendRow label="Cash-on-Cash" value={`${cashOnCash.toFixed(2)} %`} />
                <RendRow label="EK-Rendite (vor Tilgung)" value={`${ekRendite.toFixed(2)} %`} />
              </div>
            </div>

            {/* AfA & Steuer */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-4">Steuerliche Wirkung (p.a.)</h3>
              <div className="space-y-2">
                <RendRow label="Mieteinnahmen" value={formatCurrency(mieteinnahmenJahr)} />
                <RendRow label="− AfA" value={`−${formatCurrency(afaJahr)}`} />
                <RendRow label="− Zinsen" value={`−${formatCurrency(zinsenJahr)}`} />
                <RendRow label="− Verwaltungskosten" value={`−${formatCurrency(werbungskostenJahr)}`} />
                <div className="border-t border-slate-100 pt-2">
                  <RendRow
                    label={steuerlicherUeberschuss < 0 ? 'Steuerpflichtiger Verlust' : 'Steuerpflichtiger Überschuss'}
                    value={formatCurrency(steuerlicherUeberschuss)}
                    color={steuerlicherUeberschuss < 0 ? 'text-emerald-600' : 'text-red-600'}
                  />
                  <RendRow
                    label={steuerersparnis > 0 ? 'Steuerersparnis p.a.' : 'Steuermehrbelastung p.a.'}
                    value={formatCurrency(steuerersparnis > 0 ? steuerersparnis : steuermehrbelastung)}
                    color={steuerersparnis > 0 ? 'text-emerald-700 font-bold' : 'text-red-700'}
                  />
                </div>
              </div>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Calculator size={16} />
              Als PDF exportieren (Kundenunterlage)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RechnerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Lädt...</div>}>
      <Rechner />
    </Suspense>
  );
}

function NumInput({ label, value, onChange, min, max, step, decimals = 0 }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; decimals?: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <input
          type="number"
          min={min} max={max} step={step}
          value={decimals > 0 ? value.toFixed(decimals) : value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-24 text-right text-sm border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

function LiqRow({ label, value, green, red, bold }: { label: string; value: string; green?: boolean; red?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={`font-${bold ? 'bold' : 'medium'} ${green ? 'text-emerald-700' : red ? 'text-red-600' : 'text-slate-700'}`}>{value}</span>
    </div>
  );
}

function RendRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${color ?? 'text-slate-800'}`}>{value}</span>
    </div>
  );
}
