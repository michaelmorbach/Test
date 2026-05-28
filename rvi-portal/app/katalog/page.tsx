'use client';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import { einheiten, projekte } from '@/lib/data';
import { formatCurrency, bruttorendite, statusConfig } from '@/lib/utils';
import { EinheitStatus } from '@/lib/types';
import Link from 'next/link';
import { SlidersHorizontal, X } from 'lucide-react';

const ALLE_STATUS: EinheitStatus[] = ['verfuegbar', 'reserviert', 'notariell', 'verkauft', 'in_bau'];

export default function KatalogPage() {
  const [filterProjekt, setFilterProjekt] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<EinheitStatus | ''>('');
  const [filterZimmer, setFilterZimmer] = useState<string>('');
  const [ansicht, setAnsicht] = useState<'liste' | 'matrix'>('liste');

  const filtered = einheiten.filter(e => {
    if (filterProjekt && e.projektId !== filterProjekt) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    if (filterZimmer && e.zimmer !== parseInt(filterZimmer)) return false;
    return true;
  });

  const hasFilter = filterProjekt || filterStatus || filterZimmer;

  return (
    <div className="min-h-full">
      <Header title="Objektkatalog" />
      <div className="p-4 lg:p-6 space-y-4">

        {/* Filter */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-600">Filter</span>
            {hasFilter && (
              <button onClick={() => { setFilterProjekt(''); setFilterStatus(''); setFilterZimmer(''); }}
                className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1">
                <X size={12} /> Zurücksetzen
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              <option value="">Alle Zimmer</option>
              {[1, 2, 3, 4].map(z => <option key={z} value={z}>{z} Zimmer</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setAnsicht('liste')}
                className={`flex-1 text-sm rounded-lg px-3 py-2 font-medium transition-colors ${ansicht === 'liste' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                Liste
              </button>
              <button onClick={() => setAnsicht('matrix')}
                className={`flex-1 text-sm rounded-lg px-3 py-2 font-medium transition-colors ${ansicht === 'matrix' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                Matrix
              </button>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-500">{filtered.length} Einheit{filtered.length !== 1 ? 'en' : ''} gefunden</p>

        {ansicht === 'liste' ? (
          <div className="space-y-6">
            {projekte.map(proj => {
              const projEinheiten = filtered.filter(e => e.projektId === proj.id);
              if (projEinheiten.length === 0) return null;
              return (
                <div key={proj.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <div>
                      <h2 className="font-semibold text-slate-800">{proj.name}</h2>
                      <p className="text-xs text-slate-500">{proj.ort} · {proj.energiestandard} · Fertig: {proj.fertigstellung}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {projEinheiten.map(e => {
                      const cfg = statusConfig[e.status];
                      const rendite = bruttorendite(e.kaltmiete, e.kaufpreis);
                      const canReserve = e.status === 'verfuegbar';
                      return (
                        <Link key={e.id} href={`/katalog/${e.id}`}
                          className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{e.bezeichnung}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{e.zimmer} Zi · {e.flaeche} m² · {e.etage === 0 ? 'EG' : `${e.etage}. OG`}</p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Kaufpreis</span>
                              <span className="font-semibold text-slate-800">{formatCurrency(e.kaufpreis)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Kaltmiete/Mo</span>
                              <span className="text-slate-700">{formatCurrency(e.kaltmiete)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Bruttorendite</span>
                              <span className="font-medium text-emerald-700">{rendite.toFixed(2)} %</span>
                            </div>
                          </div>
                          {canReserve && (
                            <div className="text-xs text-blue-600 font-medium group-hover:underline">
                              Reservieren →
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Matrix-Ansicht (Verfügbarkeits-Spiegel)
          <div className="space-y-6">
            {projekte.map(proj => {
              const projEinheiten = filtered.filter(e => e.projektId === proj.id);
              if (projEinheiten.length === 0) return null;
              const etagen = [...new Set(projEinheiten.map(e => e.etage))].sort((a, b) => b - a);
              return (
                <div key={proj.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">{proj.name}</h2>
                    <p className="text-xs text-slate-500">{proj.ort} · Verfügbarkeitsmatrix</p>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="pr-4 pb-2 text-xs font-medium text-slate-500">Etage</th>
                          <th className="pb-2 text-xs font-medium text-slate-500" colSpan={4}>Einheiten</th>
                        </tr>
                      </thead>
                      <tbody>
                        {etagen.map(etage => {
                          const etagenEinheiten = projEinheiten.filter(e => e.etage === etage);
                          return (
                            <tr key={etage} className="border-t border-slate-50">
                              <td className="pr-4 py-2 text-xs font-medium text-slate-500 whitespace-nowrap">
                                {etage === 0 ? 'EG' : etage === 3 ? 'DG' : `${etage}. OG`}
                              </td>
                              <td className="py-2">
                                <div className="flex gap-2 flex-wrap">
                                  {etagenEinheiten.map(e => {
                                    const cfg = statusConfig[e.status];
                                    return (
                                      <Link key={e.id} href={`/katalog/${e.id}`}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:shadow-sm ${cfg.bg} ${cfg.color} border-current border-opacity-20`}>
                                        {e.bezeichnung.split('–')[1]?.trim() ?? e.bezeichnung}
                                        <span className="ml-1 opacity-70">· {e.zimmer}Zi</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {/* Legende */}
                    <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100">
                      {(['verfuegbar', 'reserviert', 'notariell', 'verkauft', 'in_bau'] as EinheitStatus[]).map(s => {
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
        )}
      </div>
    </div>
  );
}
