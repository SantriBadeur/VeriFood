'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PackagePlus,
  Boxes,
  Truck,
  PlusCircle,
  Building2,
  Users2,
  UserCog,
  FileBarChart2,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  HeartHandshake,
} from 'lucide-react';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RELAWAN';
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false));

    // Load collapse state preference if available
    const saved = localStorage.getItem('sb_sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sb_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      window.location.href = '/login';
    }
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Ringkasan',
      items: [
        { label: 'FEFO Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Operasional Logistik',
      items: [
        { label: 'Catat Makanan Masuk', href: '/makanan/masuk', icon: PackagePlus },
        { label: 'Kelola Stok & Buang', href: '/makanan/kelola', icon: Boxes, adminOnly: true },
        { label: 'Daftar Distribusi', href: '/distribusi', icon: Truck },
        { label: 'Jadwalkan Distribusi', href: '/distribusi/buat', icon: PlusCircle, adminOnly: true },
      ],
    },
    {
      title: 'Data Master',
      items: [
        { label: 'Data Donatur', href: '/donatur', icon: Building2 },
        { label: 'Data Penerima', href: '/penerima', icon: Users2 },
      ],
    },
    {
      title: 'Sistem & Audit',
      items: [
        { label: 'Kelola Pengguna', href: '/pengguna', icon: UserCog, adminOnly: true },
        { label: 'Laporan & Audit', href: '/laporan', icon: FileBarChart2, adminOnly: true },
      ],
    },
  ];

  // Filter groups and items based on role
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (currentUser?.role === 'RELAWAN' && item.adminOnly) {
          return false;
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#EBF7F3] p-2 sm:p-3 lg:p-4 flex flex-col font-serif antialiased">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Floating Island Canvas Container */}
      <div className="w-full h-full max-w-[1440px] mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-emerald-950/10 border border-emerald-100/60 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 bg-[#2B6153] text-white flex flex-col justify-between transition-all duration-300 overflow-x-hidden lg:static lg:translate-x-0 h-full shrink-0 select-none ${
            sidebarOpen
              ? 'translate-x-0 w-72 shadow-2xl'
              : '-translate-x-full lg:translate-x-0'
          } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
        >
          {/* Top Brand & Header */}
          <div className="p-4 sm:p-5 flex flex-col gap-3 shrink-0 border-b border-emerald-700/50">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-[#F4B942] flex items-center justify-center text-[#2B6153] font-black text-lg shadow-md transition group-hover:scale-105 shrink-0">
                  SB
                </div>
                {(!isCollapsed || sidebarOpen) && (
                  <div className="overflow-hidden leading-tight">
                    <span className="font-extrabold text-base tracking-wide text-white block">
                      SisaBerkah
                    </span>
                    <span className="text-[10px] text-emerald-200/80 uppercase tracking-widest block font-medium">
                      Bank Pangan & FEFO
                    </span>
                  </div>
                )}
              </Link>

              {/* Close button on mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Collapse button on desktop (when expanded) */}
              {!isCollapsed && (
                <button
                  onClick={toggleCollapse}
                  title="Ciutkan Sidebar"
                  className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-emerald-200/70 hover:text-white hover:bg-white/10 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Expand button when collapsed on desktop */}
            {isCollapsed && (
              <button
                onClick={toggleCollapse}
                title="Perluas Sidebar"
                className="hidden lg:flex items-center justify-center w-full py-1 rounded-lg text-emerald-200/70 hover:text-white hover:bg-white/10 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Role Indicator Card (Expanded Only) */}
            {(!isCollapsed || sidebarOpen) && (
              <div
                className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 transition ${
                  currentUser?.role === 'ADMIN'
                    ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-100'
                    : 'bg-teal-900/40 border-teal-500/30 text-teal-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    currentUser?.role === 'ADMIN'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-teal-500/20 text-teal-300'
                  }`}
                >
                  {currentUser?.role === 'ADMIN' ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <HeartHandshake className="w-4 h-4" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                      {currentUser?.role === 'ADMIN' ? 'Administrator' : 'Relawan'}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        currentUser?.role === 'ADMIN' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-emerald-200/70 truncate">
                    {currentUser?.role === 'ADMIN'
                      ? 'Akses Penuh (9 Menu)'
                      : 'Operasional Lapangan (5 Menu)'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items (Categorized & Scrollable without Horizontal Overflow) */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-3 px-2 sm:px-3 space-y-4">
            {visibleGroups.map((group, groupIdx) => (
              <div key={group.title} className="space-y-1">
                {/* Group Title or Separator */}
                {(!isCollapsed || sidebarOpen) ? (
                  <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-emerald-200/50 uppercase tracking-widest">
                    {group.title}
                  </p>
                ) : (
                  groupIdx > 0 && <div className="h-px w-8 bg-emerald-700/50 my-2 mx-auto" />
                )}

                {/* Group Items */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    if (isCollapsed && !sidebarOpen) {
                      // Collapsed Dock View (Icon only with native HTML title tooltip)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          title={`${item.label}${item.adminOnly ? ' (Admin)' : ''}`}
                          className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all duration-200 ${
                            isActive
                              ? 'bg-white text-[#2B6153] shadow-md shadow-emerald-950/20 scale-105 font-bold'
                              : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon className="w-5 h-5 shrink-0" />
                        </Link>
                      );
                    }

                    // Expanded View (Icon + Label)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 group ${
                          isActive
                            ? 'bg-white text-[#2B6153] shadow-md shadow-emerald-950/15 font-bold'
                            : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-[#2B6153]' : 'text-emerald-200/80'
                          }`}
                        />
                        <span className="truncate flex-1">{item.label}</span>
                        {item.adminOnly && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-200/90 font-medium">
                            Admin
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Dock User & Logout */}
          <div className="p-3 sm:p-4 border-t border-emerald-700/50 flex flex-col gap-2 shrink-0 bg-[#255549]/60">
            {(!isCollapsed || sidebarOpen) ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-emerald-800/80 border border-emerald-600/40 text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate leading-tight">
                      {currentUser?.name || (loadingUser ? 'Memuat...' : 'Pengguna')}
                    </p>
                    <p className="text-[10px] text-emerald-200/60 truncate leading-tight">
                      {currentUser?.email || 'User Session'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Keluar Akun"
                  className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-500/20 transition shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                title="Keluar Akun"
                className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-red-300 hover:text-white hover:bg-red-500/20 transition"
              >
                <LogOut className="w-5 h-5 shrink-0" />
              </button>
            )}
          </div>
        </aside>

        {/* Inner Canvas Area (Top Bar & Main Viewport) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/20 min-w-0">
          {/* Top Bar Header */}
          <header className="h-16 sm:h-18 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
            {/* Mobile Toggle & Search Bar */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                title="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="relative w-full">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search or type command..."
                  className="w-full pl-9 pr-4 py-1.5 sm:py-2 bg-slate-50/70 border border-slate-200/60 rounded-full text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#2B6153] focus:ring-2 focus:ring-[#2B6153]/10 transition"
                />
              </div>
            </div>

            {/* Right Controls: Settings, Bell, & User Profile Pill */}
            <div className="flex items-center gap-2 sm:gap-4 pl-3">
              <div className="hidden sm:flex items-center gap-1 text-slate-400">
                <button
                  title="Pengaturan"
                  className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  title="Notifikasi"
                  className="p-2 rounded-full hover:bg-slate-100 hover:text-slate-600 transition relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" />
                </button>
              </div>

              {/* User Profile Pill */}
              <div className="flex items-center gap-2 sm:gap-2.5 pl-2.5 sm:pl-3 py-1 pr-1.5 border border-slate-200/70 rounded-full bg-slate-50/50 hover:bg-slate-100/60 transition">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser?.name || (loadingUser ? 'Memuat...' : 'Pengguna')}
                  </p>
                  <p className="text-[10px] font-semibold text-[#2B6153] uppercase tracking-wider">
                    {currentUser?.role === 'ADMIN' ? 'Administrator' : 'Relawan'}
                  </p>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2B6153] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
            </div>
          </header>

          {/* Viewport for Pages (Scrolls independently) */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
