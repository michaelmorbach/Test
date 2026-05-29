'use client';
import { createContext, useContext } from 'react';

export const SidebarToggleContext = createContext<() => void>(() => {});
export const useSidebarToggle = () => useContext(SidebarToggleContext);
