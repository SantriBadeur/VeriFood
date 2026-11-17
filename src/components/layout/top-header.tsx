'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Bell, Menu, Shield, HeartHandshake } from 'lucide-react';

export interface HeaderTab {
  label: string;
  href: string;
  adminOnly?: boolean;
}

export const ALL_HEADER_TABS: HeaderTab[] = [
  { label: 'Ringkasan', href: '/dashboard' },
  { label: 'Pangan Masuk', href: '/makanan/masuk' },
  { label: 'Kelola Stok', href: '/makanan/kelola', adminOnly: true },
  { label: 'Distribusi', href: '/distribusi' },
  { label: 'Data Master', href: '/donatur' },
  { label: 'Laporan', href: '/laporan', adminOnly: true },
];

export function getHeaderTabs(role?: string): HeaderTab[] {
  if (role === 'ADMIN') {
    return ALL_HEADER_TABS;
  }
  return ALL_HEADER_TABS.filter((t) => !t.adminOnly);
}

export function isTabActive(tabHref: string, currentPath: string): boolean {
  if (tabHref === '/dashboard') {
    return currentPath === '/dashboard';
  }
  if (tabHref === '/donatur') {
    return currentPath === '/donatur' || currentPath === '/penerima';
  }
  return currentPath.startsWith(tabHref);
}

interface TopHeaderProps {
  currentUser?: {
    name: string;
    role: string;
    email?: string;
  } | null;
  onOpenMobile?: () => void;
}

export function TopHeader({ currentUser, onOpenMobile }: TopHeaderProps) {
  const pathname = usePathname();
  const tabs = getHeaderTabs(currentUser?.role);

  return (
    <header className="sticky top-0 z-30 w-full pt-3 pb-2 px-3 sm:px-4 flex items-center justify-between gap-3 select-none">
      {/* Left: Brand Badge & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2.5 rounded-2xl bg-white dark:bg-[#15181e] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-zinc-300 shadow-sm hover:bg-slate-100"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-[#15181e]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm hover:scale-[1.02] transition-transform"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#245246] to-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
            SB
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              SisaBerkah
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
              Food Bank
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Segmented Capsule Tabs */}
      <nav className="hidden md:flex items-center p-1 rounded-2xl bg-white/90 dark:bg-[#15181e]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm relative">
        {tabs.map((tab) => {
          const active = isTabActive(tab.href, pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-4 py-1.5 text-xs font-semibold rounded-xl transition-colors duration-200 ${
                active
                  ? 'text-white dark:text-zinc-950'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="activeHeaderPill"
                  className="absolute inset-0 rounded-xl bg-slate-900 dark:bg-white shadow-sm z-0"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right: Actions & User Profile Chip */}
      <div className="flex items-center gap-2.5">
        {/* Quick Search Button */}
        <button
          onClick={() => {
            // Focus global search or show tip
            const el = document.getElementById('search-input-field');
            if (el) el.focus();
          }}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-[#15181e]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-400 dark:text-zinc-400 text-xs shadow-sm hover:text-slate-700 dark:hover:text-zinc-200 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px] font-medium">Cari data...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Icon with Unread Indicator */}
        <button
          className="relative p-2 rounded-2xl bg-white/90 dark:bg-[#15181e]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
        </button>

        {/* User Profile Chip */}
        <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-2xl bg-white/90 dark:bg-[#15181e]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-[#F4B942] flex items-center justify-center text-white font-bold text-xs shadow-inner">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 line-clamp-1 max-w-[120px]">
              {currentUser?.name || 'Memuat...'}
            </span>
            <div className="flex items-center gap-1">
              {currentUser?.role === 'ADMIN' ? (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <HeartHandshake className="w-2.5 h-2.5" /> Relawan
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
