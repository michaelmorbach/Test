'use client';
import { use } from 'react';
import Header from '@/components/layout/Header';
import { kunden, opportunities, einheiten, projekte } from '@/lib/data';
import { formatCurrency, phaseConfig } from '@/lib/utils';
import { Phone, Mail, Euro, User, FileText, ChevronLeft, MessageSquare, Phone as PhoneIcon, Calendar, StickyNote } from 'lucide-react';
import Link from 'next/link';

const AKTIVITAET_ICONS = {
  telefonat: PhoneIcon,
  email: Mail,
  termin: Calendar,
  notiz: StickyNote,
};

export default function KundeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const kunde = kunden.find(k => k.id === id);

  if (!kunde) {
    return (
      <div className="min-h-full">
        <Header title="Kunde nicht gefunden" />
        <div className="p-6 text-center text-slate-500">
          <Link href="/kunden" className="text-blue-600 hover:underline">← Zurück zu Kunden</Link>
        </div>
      </div>
    );
  }

  const kundeOpps = opportunities.filter(o => o.kundeId === id);
  const aktivitaeten = [...kunde.aktivitaeten].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());

  return (
    <div className="min-h-full">
      <Header
        title={`${kunde.vorname} ${kunde.nachname}`}
        actions={
          <Link href="/kunden" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <ChevronLeft size={16} /> Kunden
          </Link>
        }
      />
      <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Linke Spalte */}
          <div className="lg:col-span-2 space-y-4">
            {/* Opportunities */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Opportunities</h3>
                <Link href="/opportunities" className="text-sm text-blue-600 hover:underline">Alle</Link>
              </div>
              {kundeOpps.length === 0 ? (
                <p className="text-slate-500 text-sm">Keine Opportunities vorhanden.</p>
              ) : (
                <div className="space-y-3">
                  {kundeOpps.map(opp => {
                    const cfg = phaseConfig[opp.phase];
                    const positionen = opp.positionen.map(p => einheiten.find(e => e.id === p.einheitId)).filter(Boolean);
                    return (
                      <Link key={opp.id} href={`/opportunities/${opp.id}`}
                        className="block border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{opp.bezeichnung}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {positionen.map(e => e?.bezeichnung).join(', ')}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-slate-800">{formatCurrency(opp.gesamtwert)}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Aktivitätenlog */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Aktivitäten</h3>
                <button className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">
                  + Eintrag
                </button>
              </div>
              {aktivitaeten.length === 0 ? (
                <p className="text-slate-500 text-sm">Noch keine Aktivitäten.</p>
              ) : (
                <div className="space-y-4">
                  {aktivitaeten.map((a, i) => {
                    const Icon = AKTIVITAET_ICONS[a.typ] ?? MessageSquare;
                    return (
                      <div key={a.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                            <Icon size={14} className="text-slate-600" />
                          </div>
                          {i < aktivitaeten.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1" />}
                        </div>
                        <div className="pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-600 capitalize">{a.typ}</span>
                            <span className="text-xs text-slate-400">{new Date(a.datum).toLocaleDateString('de-DE')}</span>
                          </div>
                          <p className="text-sm text-slate-700 mt-1">{a.notiz}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Rechte Spalte */}
          <div className="space-y-4">
            {/* Kontakt */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold">
                  {kunde.vorname[0]}{kunde.nachname[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{kunde.vorname} {kunde.nachname}</p>
                  <p className="text-xs text-slate-500 capitalize">{kunde.segment === 'kapitalanleger' ? 'Kapitalanleger' : 'Eigennutzer'} · {kunde.familienstand}</p>
                </div>
              </div>
              <div className="space-y-2">
                <a href={`mailto:${kunde.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600">
                  <Mail size={14} className="text-slate-400" /> {kunde.email}
                </a>
                <a href={`tel:${kunde.telefon}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600">
                  <Phone size={14} className="text-slate-400" /> {kunde.telefon}
                </a>
              </div>
            </div>

            {/* Finanzprofil */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Euro size={15} /> Finanzprofil
              </h3>
              <div className="space-y-2">
                <FinRow label="Jahreseinkommen" value={formatCurrency(kunde.einkommen)} />
                <FinRow label="Eigenkapital" value={formatCurrency(kunde.eigenkapital)} />
                <FinRow label="Steuersatz" value={`${kunde.steuersatz} %`} />
              </div>
            </div>

            {/* Notizen */}
            {kunde.notizen && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <FileText size={15} /> Notizen
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{kunde.notizen}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}
