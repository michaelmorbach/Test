'use client';
import { createContext, useContext } from 'react';

export const SidebarToggleContext = createContext<() => void>(() => {});

export function useSidebarToggle() {
  return useContext(SidebarToggleContext);
}
