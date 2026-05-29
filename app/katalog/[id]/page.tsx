'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { einheiten, projekte } from '@/lib/data';
import { formatCurrency, bruttorendite, statusConfig, daysUntil } from '@/lib/utils';
import { MapPin, Zap, Home, Euro, Calendar, CheckCircle2, AlertTriangle, ChevronLeft, Calculator } from 'lucide-react';
import Link from 'next/link';

export default function EinheitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const einheit = einheiten.find(e => e.id === id);
  const [reserviert, setReserviert] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!einheit) {
    return (
      <div className="min-h-full">
        <Header title="Einheit nicht gefunden" />
        <div className="p-6 text-center text-slate-500">
          <p>Diese Einheit existiert nicht.</p>
          <Link href="/katalog" className="text-blue-600 hover:underline mt-2 inline-block">← Zurück zum Katalog</Link>
        </div>
      </div>
    );
  }

  const projekt = projekte.find(p => p.id === einheit.projektId);
  const cfg = statusConfig[einheit.status];
  const rendite = bruttorendite(einheit.kaltmiete, einheit.kaufpreis);
  const canReserve = einheit.status === 'verfuegbar' && !reserviert;
  const isReserviert = einheit.status === 'reserviert' || reserviert;
  const ablaufTage = einheit.reserviertBis ? daysUntil(einheit.reserviertBis) : null;

  const gesamtExtras = einheit.extras.filter(ex => ex.verfuegbar).reduce((s, ex) => s + ex.preis, 0);
  const gesamtMitExtras = einheit.kaufpreis + gesamtExtras;

  function handleReservieren() {
    setReserviert(true);
    setShowConfirm(false);
  }

  return (
    <div className="min-h-full">
      <Header
        title={einheit.bezeichnung}
        actions={
          <Link href="/katalog" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <ChevronLeft size={16} /> Katalog
          </Link>
        }
      />
      <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">

        {/* Status-Banner */}
        {(isReserviert && !reserviert) && einheit.reserviertBis && (
          <div className={`rounded-xl p-4 flex gap-3 ${ablaufTage !== null && ablaufTage <= 2 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <AlertTriangle size={18} className={ablaufTage !== null && ablaufTage <= 2 ? 'text-red-600' : 'text-amber-600'} />
            <div>
              <p className="font-semibold text-sm text-amber-800">Einheit reserviert durch {einheit.reserviertVon}</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Reservierung läuft ab in {ablaufTage} Tag{ablaufTage !== 1 ? 'en' : ''} — danach wieder verfügbar
              </p>
            </div>
          </div>
        )}

        {reserviert && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <div>
              <p className="font-semibold text-sm text-emerald-800">Reservierung gesetzt!</p>
              <p className="text-xs text-emerald-700 mt-0.5">14 Tage · Einheit ist jetzt für andere Vermittler gesperrt.</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Hauptkarte */}
          <div className="lg:col-span-2 space-y-4">
            {/* Kopf */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{einheit.bezeichnung}</h2>
                  {projekt && (
                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                      <MapPin size={14} />
                      <span>{projekt.name} · {projekt.ort}</span>
                    </div>
                  )}
                </div>
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">Zimmer</p>
                  <p className="text-lg font-bold text-slate-800">{einheit.zimmer}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fläche</p>
                  <p className="text-lg font-bold text-slate-800">{einheit.flaeche} m²</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Etage</p>
                  <p className="text-lg font-bold text-slate-800">{einheit.etage === 0 ? 'EG' : einheit.etage === 3 ? 'DG' : `${einheit.etage}. OG`}</p>
                </div>
              </div>
            </div>

            {/* Kennzahlen */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Euro size={16} /> Kennzahlen
              </h3>
              <div className="space-y-3">
                <KZ label="Kaufpreis" value={formatCurrency(einheit.kaufpreis)} bold />
                <KZ label="Kaltmiete/Monat" value={formatCurrency(einheit.kaltmiete)} />
                <KZ label="Kaltmiete/Jahr" value={formatCurrency(einheit.kaltmiete * 12)} />
                <KZ label="Bruttorendite" value={`${rendite.toFixed(2)} %`} highlight />
                <KZ label="Preis/m²" value={formatCurrency(einheit.kaufpreis / einheit.flaeche)} />
              </div>
            </div>

            {/* Extras */}
            {einheit.extras.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-700 mb-4">Buchbare Extras</h3>
                <div className="space-y-2">
                  {einheit.extras.map(ex => (
                    <div key={ex.id} className={`flex items-center justify-between p-3 rounded-lg ${ex.verfuegbar ? 'bg-slate-50' : 'bg-slate-50 opacity-50'}`}>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{ex.bezeichnung}</p>
                        <p className="text-xs text-slate-500 capitalize">{ex.typ.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">{formatCurrency(ex.preis)}</p>
                        <p className={`text-xs font-medium ${ex.verfuegbar ? 'text-emerald-600' : 'text-red-500'}`}>
                          {ex.verfuegbar ? 'Verfügbar' : 'Vergeben'}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Gesamt mit allen Extras</span>
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(gesamtMitExtras)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Eigenschaften */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Home size={16} /> Eigenschaften
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Prop label="Balkon/Terrasse" value={einheit.balkon ? 'Ja' : 'Nein'} />
                <Prop label="KfW-Standard" value={einheit.kfwStandard} />
                {projekt && <>
                  <Prop label="Fertigstellung" value={projekt.fertigstellung} />
                  <Prop label="Projektstatus" value={projekt.status === 'in_bau' ? 'In Bau' : projekt.status === 'planung' ? 'Planung' : 'Fertig'} />
                </>}
              </div>
            </div>
          </div>

          {/* Seitenleiste */}
          <div className="space-y-4">
            {/* Aktionen */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-700">Aktionen</h3>

              {canReserve && !showConfirm && (
                <button onClick={() => setShowConfirm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm">
                  Reservieren (14 Tage)
                </button>
              )}

              {showConfirm && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-800 mb-3">Einheit für 14 Tage reservieren?</p>
                  <p className="text-xs text-blue-600 mb-3">Die Einheit wird netzwerkweit für andere Vermittler gesperrt.</p>
                  <div className="flex gap-2">
                    <button onClick={handleReservieren}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                      Bestätigen
                    </button>
                    <button onClick={() => setShowConfirm(false)}
                      className="flex-1 border border-slate-200 text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-50 transition-colors">
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {(isReserviert && !canReserve) && (
                <div className="w-full bg-slate-100 text-slate-500 font-medium py-3 px-4 rounded-xl text-sm text-center">
                  {einheit.status === 'verkauft' ? 'Verkauft' : einheit.status === 'notariell' ? 'Notariell gebunden' : 'Reserviert'}
                </div>
              )}

              <Link href={`/rechner?einheitId=${einheit.id}`}
                className="w-full border border-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Calculator size={16} />
                Steuerrechner öffnen
              </Link>

              <button className="w-full border border-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                Exposé als PDF
              </button>
            </div>

            {/* Projekt-Info */}
            {projekt && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Zap size={16} /> Projekt
                </h3>
                <p className="font-medium text-slate-800 text-sm">{projekt.name}</p>
                <p className="text-xs text-slate-500 mt-1">{projekt.ort}, {projekt.bundesland}</p>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">{projekt.beschreibung}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KZ({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-slate-800 text-base' : highlight ? 'font-semibold text-emerald-700' : 'font-medium text-slate-700'}`}>{value}</span>
    </div>
  );
}

function Prop({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}
