'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Receipt, ClipboardCheck, Users, Car, LogOut, ChevronRight, X } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import type { PublicUser } from '@/lib/types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user: PublicUser;
}

export default function Sidebar({ open, onClose, user }: SidebarProps) {
  const path = usePathname();

  const nav = [
    { href: '/reisekosten', label: 'Meine Reisekosten', icon: Receipt, show: true },
    { href: '/freigaben', label: 'Freigaben', icon: ClipboardCheck, show: user.isApprover || user.isAdmin },
    { href: '/admin/team', label: 'Team & Rollen', icon: Users, show: user.isAdmin },
    { href: '/admin/kilometersaetze', label: 'Kilometersätze', icon: Car, show: user.isAdmin },
  ].filter((item) => item.show);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 flex flex-col z-30 transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <div>
            <div className="text-white font-bold text-lg tracking-tight">RVI Reisekosten</div>
            <div className="text-slate-400 text-xs mt-0.5">Intern</div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
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
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user.name
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{user.name}</div>
              <div className="text-slate-400 text-xs truncate">
                {user.isAdmin ? 'Admin' : user.isApprover ? 'Freigabeberechtigt' : 'Mitarbeitend'}
              </div>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white text-sm rounded-lg hover:bg-slate-800 transition-colors"
            >
              <LogOut size={16} />
              <span>Abmelden</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
