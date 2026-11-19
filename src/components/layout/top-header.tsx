'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Menu, Shield, HeartHandshake, AlertTriangle, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

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
  const pathname = usePathname() || '';
  const tabs = getHeaderTabs(currentUser?.role);

  // Critical Notification Alarm (<= 2 Hours)
  const [criticalCount, setCriticalCount] = useState(0);
  const [criticalItems, setCriticalItems] = useState<
    Array<{
      id: string;
      name: string;
      unit: string;
      remainingQuantity: number;
      unreservedQuantity: number;
      minutesLeft: number;
      donorName: string;
    }>
  >([]);
  const [isBellOpen, setIsBellOpen] = useState(false);

  useEffect(() => {
    const fetchCritical = () => {
      fetch('/api/notifications/critical')
        .then((res) => (res.ok ? res.json() : { count: 0, criticalItems: [] }))
        .then((data) => {
          setCriticalCount(data.count || 0);
          setCriticalItems(data.criticalItems || []);
        })
        .catch(() => {});
    };

    fetchCritical();
    const interval = setInterval(fetchCritical, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-close notification dropdown when user scrolls
  useEffect(() => {
    if (!isBellOpen) return;
    const handleScroll = () => {
      setIsBellOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isBellOpen]);

  return (
    <header className="sticky top-0 z-30 w-full pt-3 pb-2 px-2.5 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 select-none">
      {/* Left: Brand Badge & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2.5 rounded-2xl bg-white dark:bg-[#131b2a] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-[#131b2a]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm hover:scale-[1.02] transition-transform"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#245246] to-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
            SB
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100">
              SisaBerkah
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">
              Food Bank
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Segmented Capsule Tabs */}
      <nav className="hidden md:flex items-center p-1 rounded-2xl bg-white/90 dark:bg-[#131b2a]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm relative">
        {tabs.map((tab) => {
          const active = isTabActive(tab.href, pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-4 py-1.5 text-xs font-semibold rounded-xl transition-colors duration-200 ${
                active
                  ? 'text-white dark:text-slate-900 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="activeHeaderPill"
                  className="absolute inset-0 rounded-xl bg-slate-900 dark:bg-slate-200 shadow-sm z-0"
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
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-[#131b2a]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs shadow-sm hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px] font-medium">Cari data...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Icon with Interactive Critical Alarm Dropdown */}
        <div className="relative">
          {/* Backdrop for click outside / mobile touch dismiss */}
          {isBellOpen && (
            <div
              onClick={() => setIsBellOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-[1px]"
            />
          )}

          <button
            onClick={() => setIsBellOpen(!isBellOpen)}
            className={`relative p-2 rounded-2xl bg-white/90 dark:bg-[#131b2a]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm transition ${
              criticalCount > 0
                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title={criticalCount > 0 ? `🚨 Ada ${criticalCount} pangan kritis <= 2 jam!` : 'Notifikasi'}
          >
            <Bell className="w-4 h-4" />
            {criticalCount > 0 ? (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[9px] shadow-sm animate-pulse ring-2 ring-white dark:ring-[#131b2a]">
                {criticalCount}
              </span>
            ) : (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#131b2a]" />
            )}
          </button>

          {/* Floating Dropdown Panel */}
          {isBellOpen && (
            <div className="absolute right-0 top-12 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white dark:bg-[#131b2a] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${criticalCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Alarm Kedaluwarsa Kritis</h4>
                    <p className="text-[10px] text-slate-400">Pangan $\le 2$ jam yang belum terjadwal</p>
                  </div>
                </div>
                {criticalCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                    {criticalCount} Batch
                  </span>
                )}
              </div>

              <div className="py-2 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                {criticalCount === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Semua Stok Aman</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada batch yang basi dalam waktu $\le 2$ jam.</p>
                  </div>
                ) : (
                  criticalItems.map((item) => (
                    <div key={item.id} className="py-2.5 flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1 rounded-xl transition">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.minutesLeft <= 60
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 animate-pulse'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {item.minutesLeft <= 0 ? 'Basi Sekarang!' : `Sisa ${item.minutesLeft} mnt`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{item.donorName}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {item.unreservedQuantity} {item.unit} tersisa
                        </span>
                      </div>
                      <div className="pt-1 flex items-center justify-end">
                        <Link
                          href={`/distribusi/buat?foodStockId=${item.id}`}
                          onClick={() => setIsBellOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                          Distribusikan Segera <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {criticalCount > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/10 text-center">
                  <Link
                    href="/makanan/kelola"
                    onClick={() => setIsBellOpen(false)}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Buka Manajemen Gudang →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Chip */}
        <div
          title={`${currentUser?.name || 'Pengguna'} (${currentUser?.role === 'ADMIN' ? 'Admin' : 'Relawan'})`}
          className="flex items-center gap-2 p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-2xl bg-white/90 dark:bg-[#131b2a]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm shrink-0"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-[#F4B942] flex items-center justify-center text-white font-bold text-xs shadow-inner shrink-0">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[120px]">
              {currentUser?.name || 'Memuat...'}
            </span>
            <div className="flex items-center gap-1">
              {currentUser?.role === 'ADMIN' ? (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
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
