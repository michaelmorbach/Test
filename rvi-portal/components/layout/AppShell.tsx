'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';
import { SidebarToggleContext } from './SidebarContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarToggleContext.Provider value={() => setOpen(v => !v)}>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          {children}
        </div>
      </div>
    </SidebarToggleContext.Provider>
  );
}
