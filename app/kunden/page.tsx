'use client';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import { kunden, opportunities } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { UserPlus, Search, ChevronRight } from 'lucide-react';

export default function KundenPage() {
  const [suche, setSuche] = useState('');

  const gefiltert = kunden.filter(k => {
    if (!suche) return true;
    const hay = `${k.vorname} ${k.nachname} ${k.email}`.toLowerCase();
    return hay.includes(suche.toLowerCase());
  });

  return (
    <div className="min-h-full">
      <Header
        title="Kunden"
        subtitle={`${kunden.length} Kontakte`}
        actions={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <UserPlus size={15} />
            <span className="hidden sm:inline">Neuer Kunde</span>
          </button>
        }
      />
      <div className="p-4 lg:p-6 space-y-4">

        {/* Suche */}
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={suche}
              onChange={e => setSuche(e.target.value)}
              placeholder="Kunde suchen …"
              className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Tabellen-Kopf */}
          <div className="hidden lg:grid grid-cols-[minmax(0,2fr)_1.6fr_1fr_1fr_auto] gap-4 px-5 py-2.5 bg-slate-50/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Kunde</span>
            <span>Kontakt</span>
            <span className="text-right">Pipeline</span>
            <span className="text-right">Letzter Kontakt</span>
            <span className="w-4" />
          </div>

          <div className="divide-y divide-slate-100">
            {gefiltert.map(kunde => {
              const opps = opportunities.filter(o => o.kundeId === kunde.id && o.phase !== 'verloren' && o.phase !== 'abgeschlossen');
              const pipelineWert = opps.reduce((s, o) => s + o.gesamtwert, 0);
              const letzte = [...kunde.aktivitaeten].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())[0];
              return (
                <Link key={kunde.id} href={`/kunden/${kunde.id}`} className="group block hover:bg-slate-50 transition-colors">
                  {/* Desktop */}
                  <div className="hidden lg:grid grid-cols-[minmax(0,2fr)_1.6fr_1fr_1fr_auto] gap-4 px-5 py-3 items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {kunde.vorname[0]}{kunde.nachname[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{kunde.vorname} {kunde.nachname}</p>
                        <p className="text-xs text-slate-400">{kunde.segment === 'kapitalanleger' ? 'Kapitalanleger' : 'Eigennutzer'}</p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-600 truncate">{kunde.email}</p>
                      <p className="text-xs text-slate-400">{kunde.telefon}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800 text-sm">{pipelineWert > 0 ? formatCurrency(pipelineWert) : '–'}</p>
                      <p className="text-xs text-slate-400">{opps.length} offen</p>
                    </div>
                    <span className="text-sm text-slate-500 text-right">
                      {letzte ? new Date(letzte.datum).toLocaleDateString('de-DE') : '–'}
                    </span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>

                  {/* Mobile */}
                  <div className="lg:hidden px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {kunde.vorname[0]}{kunde.nachname[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 text-sm truncate">{kunde.vorname} {kunde.nachname}</p>
                      <p className="text-xs text-slate-400 truncate">{kunde.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-slate-800 text-sm">{pipelineWert > 0 ? formatCurrency(pipelineWert) : '–'}</p>
                      <p className="text-xs text-slate-400">{opps.length} offen</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
