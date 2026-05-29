'use client';
import { Menu } from 'lucide-react';
import { useSidebarToggle } from './SidebarContext';

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export default function Header({ title, actions }: HeaderProps) {
  const toggle = useSidebarToggle();
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
      <button onClick={toggle} className="lg:hidden text-slate-500 hover:text-slate-700 p-1">
        <Menu size={22} />
      </button>
      <h1 className="text-lg font-semibold text-slate-800 flex-1">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
