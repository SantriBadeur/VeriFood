'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Menu, Shield, HeartHandshake, AlertTriangle, Clock, ArrowRight, CheckCircle2, X, KeyRound, LogOut, ChevronDown, UserCheck, User } from 'lucide-react';
import { CommandPaletteModal } from './command-palette-modal';
import { ChangePasswordModal } from '../ChangePasswordModal';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      window.location.href = '/login';
    }
  };

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K to toggle Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Auto-close notification dropdown whenever user navigates to a new page
  useEffect(() => {
    setIsBellOpen(false);
  }, [pathname]);

  // Auto-close profile dropdown whenever user navigates to a new page
  useEffect(() => {
    setIsProfileOpen(false);
  }, [pathname]);

  // Close dropdowns when Escape key is pressed
  useEffect(() => {
    if (!isBellOpen && !isProfileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBellOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBellOpen, isProfileOpen]);

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
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-[#131b2a]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs shadow-sm hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Cari data (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px] font-medium">Cari data...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Icon with Interactive Critical Alarm Dropdown */}
        <div className="relative">
          {/* Backdrop for click outside (dark on mobile, transparent on laptop/desktop) */}
          {isBellOpen && (
            <div
              onClick={() => setIsBellOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent backdrop-blur-[2px] sm:backdrop-blur-none transition-opacity"
              aria-label="Tutup notifikasi"
            />
          )}

          <button
            onClick={() => setIsBellOpen(!isBellOpen)}
            className={`relative p-2 rounded-2xl bg-white/90 dark:bg-[#131b2a]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm transition active:scale-95 ${
              criticalCount > 0
                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
            title={criticalCount > 0 ? `🚨 Ada ${criticalCount} pangan kritis <= 2 jam!` : 'Notifikasi'}
            aria-label="Notifikasi Alarm Kritis"
          >
            <Bell className="w-4 h-4" />
            {criticalCount > 0 ? (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] shadow-sm animate-pulse ring-2 ring-white dark:ring-[#131b2a] min-w-[18px] text-center leading-none">
                {criticalCount > 99 ? '99+' : criticalCount}
              </span>
            ) : (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#131b2a]" />
            )}
          </button>

          {/* Floating Dropdown Panel */}
          {isBellOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Panel Notifikasi Alarm Kedaluwarsa Kritis"
              className="fixed top-16 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-0 sm:top-12 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white dark:bg-[#131b2a] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-white/10 p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      criticalCount > 0
                        ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                      Alarm Kedaluwarsa Kritis
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Pangan ≤ 2 jam yang belum terjadwal
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {criticalCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-black">
                      {criticalCount > 99 ? '99+' : criticalCount} Batch
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsBellOpen(false)}
                    className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                    title="Tutup Notifikasi"
                    aria-label="Tutup Notifikasi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable List */}
              <div className="py-2.5 max-h-[55vh] sm:max-h-80 overflow-y-auto overscroll-contain space-y-2 pr-0.5">
                {criticalCount === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Semua Stok Aman</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Tidak ada batch yang basi dalam kurun waktu ≤ 2 jam.
                    </p>
                  </div>
                ) : (
                  criticalItems.map((item) => {
                    const isImmediate = item.minutesLeft <= 0;
                    const isUrgent = item.minutesLeft <= 60;

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 transition flex flex-col gap-2 border border-slate-100/90 dark:border-white/5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                              🏢 {item.donorName}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 flex items-center gap-1 ${
                              isImmediate
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 animate-pulse'
                                : isUrgent
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {isImmediate ? 'Basi Sekarang!' : `Sisa ${item.minutesLeft} mnt`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 dark:border-white/5">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            Stok:{' '}
                            <strong className="text-slate-900 dark:text-slate-100 font-extrabold">
                              {item.unreservedQuantity} {item.unit}
                            </strong>
                          </span>
                          <Link
                            href={`/distribusi/buat?foodStockId=${item.id}`}
                            onClick={() => setIsBellOpen(false)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold shadow-sm transition"
                          >
                            Distribusikan <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                {criticalCount > 0 ? (
                  <Link
                    href="/makanan/kelola"
                    onClick={() => setIsBellOpen(false)}
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    Buka Kelola Gudang →
                  </Link>
                ) : (
                  <span className="text-[11px] text-slate-400">Gudang optimal</span>
                )}
                <button
                  type="button"
                  onClick={() => setIsBellOpen(false)}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold transition active:scale-95"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Interactive User Profile Menu */}
        <div className="relative">
          {/* Backdrop for click outside */}
          {isProfileOpen && (
            <div
              onClick={() => setIsProfileOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent transition-opacity"
              aria-label="Tutup menu profil"
            />
          )}

          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            title={`${currentUser?.name || 'Pengguna'} (${currentUser?.role === 'ADMIN' ? 'Admin' : 'Relawan'})`}
            className="flex items-center gap-2 p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-2xl bg-white/90 dark:bg-[#131b2a]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition active:scale-95 shrink-0 text-left"
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
            aria-label="Menu Profil Pengguna"
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
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block ${
                isProfileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Floating Profile Dropdown Card */}
          {isProfileOpen && (
            <div
              role="menu"
              aria-label="Menu Akun Pengguna"
              className="absolute right-0 top-12 w-64 bg-white dark:bg-[#131b2a] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-white/10 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs"
            >
              {/* User Info Header */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-[#F4B942] flex items-center justify-center text-white font-black text-sm shadow-inner shrink-0">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                    {currentUser?.name || 'Pengguna'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser?.email || 'email@sisaberkah.org'}
                  </p>
                  <div className="mt-1">
                    {currentUser?.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-[9px] uppercase tracking-wider">
                        <Shield className="w-2.5 h-2.5" /> Administrator
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[9px] uppercase tracking-wider">
                        <HeartHandshake className="w-2.5 h-2.5" /> Relawan
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="py-2 space-y-1">
                {currentUser?.role === 'ADMIN' && (
                  <Link
                    href="/pengguna"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition font-medium"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Kelola Akun Pengguna</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition font-medium text-left"
                >
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Ganti Kata Sandi</span>
                </button>
              </div>

              {/* Divider & Logout */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition font-bold text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Command Palette Modal (Ctrl+K / Cmd+K) */}
      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentUser={currentUser}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
}
