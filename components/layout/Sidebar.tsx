'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, TrendingUp, Calculator, Bell, X
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Cockpit', icon: LayoutDashboard },
  { href: '/katalog', label: 'Objektkatalog', icon: Building2 },
  { href: '/kunden', label: 'Kunden', icon: Users },
  { href: '/opportunities', label: 'Opportunities', icon: TrendingUp },
  { href: '/rechner', label: 'Steuer-Rechner', icon: Calculator },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const path = usePathname();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-950 flex flex-col z-30 transform transition-transform duration-200 border-r border-slate-800
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <div>
              <div className="text-white font-semibold text-sm tracking-tight leading-none">RVI Portal</div>
              <div className="text-slate-500 text-[11px] mt-1 leading-none">Vertriebspartner</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-3 pb-2 text-[11px] font-medium text-slate-600 uppercase tracking-wider">Navigation</p>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/' && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-blue-600/10 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-blue-500" />}
                <Icon size={18} className={active ? 'text-blue-400' : ''} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-slate-800/80">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-white text-sm rounded-lg hover:bg-slate-800/60 transition-colors">
            <Bell size={16} />
            <span>Benachrichtigungen</span>
            <span className="ml-auto bg-blue-600 text-white text-[11px] font-semibold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">3</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              AM
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium leading-none truncate">Alex Meyer</div>
              <div className="text-slate-500 text-xs mt-1 leading-none">Vermittler</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
