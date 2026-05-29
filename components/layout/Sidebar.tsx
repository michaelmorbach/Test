'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, TrendingUp, Calculator, Bell, ChevronRight, X
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
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 flex flex-col z-30 transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <div>
            <div className="text-white font-bold text-lg tracking-tight">RVI Portal</div>
            <div className="text-slate-400 text-xs mt-0.5">Vertriebspartner</div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/' && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              AM
            </div>
            <div>
              <div className="text-white text-sm font-medium">Alex Meyer</div>
              <div className="text-slate-400 text-xs">Vermittler</div>
            </div>
          </div>
          <button className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white text-sm rounded-lg hover:bg-slate-800 transition-colors">
            <Bell size={16} />
            <span>3 Benachrichtigungen</span>
            <span className="ml-auto bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
          </button>
        </div>
      </aside>
    </>
  );
}
