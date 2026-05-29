'use client';
import { Menu } from 'lucide-react';
import { useSidebarToggle } from './SidebarContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const toggle = useSidebarToggle();
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center gap-3 sticky top-0 z-10">
      <button onClick={toggle} className="lg:hidden text-slate-500 hover:text-slate-700 p-1 -ml-1">
        <Menu size={22} />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-base lg:text-lg font-semibold text-slate-900 leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 leading-tight truncate">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
