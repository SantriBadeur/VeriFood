'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  Truck,
  Building2,
  UserCog,
  FileBarChart2,
  Sun,
  Moon,
  LogOut,
  X,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

export interface DockNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export const ALL_DOCK_ITEMS: DockNavItem[] = [
  { label: 'Ringkasan FEFO', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pangan & Stok', href: '/makanan/masuk', icon: Boxes },
  { label: 'Logistik Distribusi', href: '/distribusi', icon: Truck },
  { label: 'Data Master', href: '/donatur', icon: Building2 },
  { label: 'Kelola Pengguna', href: '/pengguna', icon: UserCog, adminOnly: true },
  { label: 'Laporan & Audit', href: '/laporan', icon: FileBarChart2, adminOnly: true },
];

export function getDockNavItems(role?: string): DockNavItem[] {
  if (role === 'ADMIN') {
    return ALL_DOCK_ITEMS;
  }
  return ALL_DOCK_ITEMS.filter((item) => !item.adminOnly);
}

interface FloatingDockProps {
  currentUser?: {
    name: string;
    role: string;
  } | null;
  onLogout: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function FloatingDock({
  currentUser,
  onLogout,
  mobileOpen = false,
  onCloseMobile,
}: FloatingDockProps) {
  const pathname = usePathname() || '';
  const { theme, toggleTheme } = useTheme();
  const navItems = getDockNavItems(currentUser?.role);

  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (href === '/makanan/masuk') {
      return pathname.startsWith('/makanan');
    }
    if (href === '/distribusi') {
      return pathname.startsWith('/distribusi');
    }
    if (href === '/donatur') {
      return pathname === '/donatur' || pathname === '/penerima';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Vertical Dock Container */}
      <aside
        className={`fixed inset-y-3 left-3 z-50 flex flex-col items-center justify-between py-4 px-2.5 w-16 sm:w-[68px] rounded-3xl bg-white/90 dark:bg-[#15181e]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-900/5 dark:shadow-black/40 transition-transform duration-300 select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-24 lg:translate-x-0'
        }`}
      >
        {/* Top: Theme Toggle Switch */}
        <div className="flex flex-col items-center gap-3 w-full">
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-amber-400 hover:scale-105 shadow-sm"
            title={`Ganti ke mode ${theme === 'light' ? 'gelap' : 'terang'}`}
          >
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-amber-500 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 text-amber-400 transition-transform hover:-rotate-12" />
            )}
          </button>

          <div className="w-8 h-[1px] bg-slate-200/80 dark:bg-zinc-800 my-1.5" />
        </div>

        {/* Center: Module Navigation Icons */}
        <nav className="flex flex-col items-center gap-2.5 my-auto w-full py-1">
          {navItems.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={item.label}
                className={`relative group flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-md ring-2 ring-emerald-500/20 dark:ring-emerald-400/30 scale-105'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />

                {/* Micro Tooltip */}
                <span className="absolute left-16 hidden lg:group-hover:inline-block px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-lg whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.label}
                </span>

                {/* Sleek integrated active indicator dot */}
                {active && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-600" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Status & Logout */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          <div className="w-8 h-[1px] bg-slate-200/80 dark:bg-zinc-800 my-1.5" />

          {/* System Online Status Indicator */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800/60 cursor-default"
            title="Sistem SisaBerkah FEFO Online"
          >
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-rose-500/80 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200"
            title="Keluar (Logout)"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  );
}
