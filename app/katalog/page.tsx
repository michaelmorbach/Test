'use client';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import { einheiten, projekte } from '@/lib/data';
import { formatCurrency, bruttorendite, statusConfig } from '@/lib/utils';
import { EinheitStatus, Einheit } from '@/lib/types';
import Link from 'next/link';
import { Search, X, LayoutGrid, List, ChevronRight } from 'lucide-react';

const ALLE_STATUS: EinheitStatus[] = ['verfuegbar', 'reserviert', 'notariell', 'verkauft', 'in_bau'];

function etageLabel(etage: number) {
  return etage === 0 ? 'EG' : etage === 3 ? 'DG' : `${etage}. OG`;
}

export default function KatalogPage() {
  const [suche, setSuche] = useState('');
  const [filterProjekt, setFilterProjekt] = useState('');
  const [filterStatus, setFilterStatus] = useState<EinheitStatus | ''>('');
  const [filterZimmer, setFilterZimmer] = useState('');
  const [ansicht, setAnsicht] = useState<'liste' | 'matrix'>('liste');

  const filtered = einheiten.filter(e => {
    if (filterProjekt && e.projektId !== filterProjekt) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    if (filterZimmer && e.zimmer !== parseInt(filterZimmer)) return false;
    if (suche) {
      const proj = projekte.find(p => p.id === e.projektId);
      const hay = `${e.bezeichnung} ${proj?.name ?? ''} ${proj?.ort ?? ''}`.toLowerCase();
      if (!hay.includes(suche.toLowerCase())) return false;
    }
    return true;
  });

  const hasFilter = filterProjekt || filterStatus || filterZimmer || suche;
  const verfuegbarGesamt = filtered.filter(e => e.status === 'verfuegbar').length;

  return (
    <div className="min-h-full">
      <Header title="Objektkatalog" subtitle={`${filtered.length} Einheiten · ${verfuegbarGesamt} verfügbar`} />
      <div className="p-4 lg:p-6 space-y-4">

        {/* Such- und Filterleiste */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={suche}
              onChange={e => setSuche(e.target.value)}
              placeholder="Einheit, Projekt oder Ort suchen …"
              className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={filterProjekt} onChange={e => setFilterProjekt(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Alle Projekte</option>
              {projekte.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as EinheitStatus | '')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Alle Status</option>
              {ALLE_STATUS.map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
            </select>
            <select value={filterZimmer} onChange={e => setFilterZimmer(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Zimmer</option>
              {[1, 2, 3, 4].map(z => <option key={z} value={z}>{z} Zi</option>)}
            </select>
            {hasFilter && (
              <button onClick={() => { setFilterProjekt(''); setFilterStatus(''); setFilterZimmer(''); setSuche(''); }}
                className="text-sm text-slate-500 hover:text-slate-700 px-2 flex items-center gap-1">
                <X size={14} /> Reset
              </button>
            )}
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button onClick={() => setAnsicht('liste')}
                className={`flex items-center gap-1.5 text-sm rounded-md px-3 py-1.5 font-medium transition-colors ${ansicht === 'liste' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <List size={15} /> Liste
              </button>
              <button onClick={() => setAnsicht('matrix')}
                className={`flex items-center gap-1.5 text-sm rounded-md px-3 py-1.5 font-medium transition-colors ${ansicht === 'matrix' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <LayoutGrid size={15} /> Matrix
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center">
            <p className="text-slate-500 font-medium">Keine Einheiten gefunden</p>
            <p className="text-slate-400 text-sm mt-1">Passe die Filter an oder setze sie zurück.</p>
          </div>
        )}

        {ansicht === 'liste' ? (
          <div className="space-y-5">
            {projekte.map(proj => {
              const projEinheiten = filtered.filter(e => e.projektId === proj.id);
              if (projEinheiten.length === 0) return null;
              const verf = projEinheiten.filter(e => e.status === 'verfuegbar').length;
              return (
                <div key={proj.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  {/* Projekt-Kopf */}
                  <div className="flex items-center justify-between gap-3 px-4 lg:px-5 py-3.5 border-b border-slate-100">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-slate-900 text-sm truncate">{proj.name}</h2>
                      <p className="text-xs text-slate-500 truncate">{proj.ort} · {proj.energiestandard} · Fertig: {proj.fertigstellung}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                      {verf} / {projEinheiten.length} verfügbar
                    </span>
                  </div>

                  {/* Tabellen-Kopf (Desktop) */}
                  <div className="hidden lg:grid grid-cols-[minmax(0,2.4fr)_1fr_1.1fr_1fr_0.9fr_1.1fr_auto] gap-4 px-5 py-2.5 bg-slate-50/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Einheit</span>
                    <span>Zi · Fläche</span>
                    <span className="text-right">Kaufpreis</span>
                    <span className="text-right">Miete/Mo</span>
                    <span className="text-right">Rendite</span>
                    <span className="text-right">Status</span>
                    <span className="w-4" />
                  </div>

                  {/* Zeilen */}
                  <div className="divide-y divide-slate-100">
                    {projEinheiten.map(e => <EinheitRow key={e.id} e={e} />)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <MatrixAnsicht filtered={filtered} />
        )}
      </div>
    </div>
  );
}

function EinheitRow({ e }: { e: Einheit }) {
  const cfg = statusConfig[e.status];
  const rendite = bruttorendite(e.kaltmiete, e.kaufpreis);

  return (
    <Link
      href={`/katalog/${e.id}`}
      className="group block hover:bg-slate-50 transition-colors"
    >
      {/* Desktop */}
      <div className="hidden lg:grid grid-cols-[minmax(0,2.4fr)_1fr_1.1fr_1fr_0.9fr_1.1fr_auto] gap-4 px-5 py-3 items-center">
        <div className="min-w-0">
          <p className="font-medium text-slate-800 text-sm truncate">{e.bezeichnung}</p>
          <p className="text-xs text-slate-400">{etageLabel(e.etage)}{e.balkon ? ' · Balkon' : ''}</p>
        </div>
        <span className="text-sm text-slate-600">{e.zimmer} Zi · {e.flaeche} m²</span>
        <span className="text-sm font-semibold text-slate-800 text-right">{formatCurrency(e.kaufpreis)}</span>
        <span className="text-sm text-slate-600 text-right">{formatCurrency(e.kaltmiete)}</span>
        <span className="text-sm font-medium text-emerald-700 text-right">{rendite.toFixed(2)} %</span>
        <span className="text-right">
          <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
        </span>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>

      {/* Mobile */}
      <div className="lg:hidden px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-medium text-slate-800 text-sm truncate">{e.bezeichnung}</p>
            <p className="text-xs text-slate-400">{e.zimmer} Zi · {e.flaeche} m² · {etageLabel(e.etage)}</p>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-slate-800">{formatCurrency(e.kaufpreis)}</span>
          <span className="text-slate-500">{formatCurrency(e.kaltmiete)}/Mo</span>
          <span className="font-medium text-emerald-700 ml-auto">{rendite.toFixed(2)} %</span>
        </div>
      </div>
    </Link>
  );
}

function MatrixAnsicht({ filtered }: { filtered: Einheit[] }) {
  return (
    <div className="space-y-5">
      {projekte.map(proj => {
        const projEinheiten = filtered.filter(e => e.projektId === proj.id);
        if (projEinheiten.length === 0) return null;
        const etagen = [...new Set(projEinheiten.map(e => e.etage))].sort((a, b) => b - a);
        return (
          <div key={proj.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm">{proj.name}</h2>
              <p className="text-xs text-slate-500">{proj.ort} · Verfügbarkeitsmatrix</p>
            </div>
            <div className="p-4 lg:p-5 overflow-x-auto">
              <div className="space-y-2 min-w-max">
                {etagen.map(etage => {
                  const etagenEinheiten = projEinheiten.filter(e => e.etage === etage);
                  return (
                    <div key={etage} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-xs font-medium text-slate-400">{etageLabel(etage)}</span>
                      <div className="flex gap-2 flex-wrap">
                        {etagenEinheiten.map(e => {
                          const cfg = statusConfig[e.status];
                          return (
                            <Link key={e.id} href={`/katalog/${e.id}`}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border border-transparent transition-all hover:shadow-sm hover:scale-[1.02] ${cfg.bg} ${cfg.color}`}>
                              {e.bezeichnung.split('–')[1]?.trim() ?? e.bezeichnung}
                              <span className="ml-1 opacity-60">· {e.zimmer}Zi</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-slate-100">
                {ALLE_STATUS.map(s => {
                  const cfg = statusConfig[s];
                  return (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-sm ${cfg.bg}`} />
                      <span className="text-xs text-slate-500">{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
