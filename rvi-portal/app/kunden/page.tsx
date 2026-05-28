import Header from '@/components/layout/Header';
import { kunden, opportunities } from '@/lib/data';
import { formatCurrency, phaseConfig } from '@/lib/utils';
import Link from 'next/link';
import { UserPlus, Phone, Mail } from 'lucide-react';

export default function KundenPage() {
  return (
    <div className="min-h-full">
      <Header
        title="Kunden"
        actions={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <UserPlus size={15} />
            Neuer Kunde
          </button>
        }
      />
      <div className="p-4 lg:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kunden.map(kunde => {
            const opps = opportunities.filter(o => o.kundeId === kunde.id && o.phase !== 'verloren' && o.phase !== 'abgeschlossen');
            const pipelineWert = opps.reduce((s, o) => s + o.gesamtwert, 0);
            const letzteAktivitaet = [...kunde.aktivitaeten].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())[0];
            return (
              <Link key={kunde.id} href={`/kunden/${kunde.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {kunde.vorname[0]}{kunde.nachname[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">{kunde.vorname} {kunde.nachname}</p>
                    <p className="text-xs text-slate-500 capitalize">{kunde.segment === 'kapitalanleger' ? 'Kapitalanleger' : 'Eigennutzer'}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{kunde.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{kunde.telefon}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pipeline</span>
                    <span className="font-semibold text-slate-800">{pipelineWert > 0 ? formatCurrency(pipelineWert) : '–'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Opportunities</span>
                    <span className="text-slate-700">{opps.length} offen</span>
                  </div>
                  {letzteAktivitaet && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Letzter Kontakt</span>
                      <span className="text-slate-600 text-xs">{new Date(letzteAktivitaet.datum).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
