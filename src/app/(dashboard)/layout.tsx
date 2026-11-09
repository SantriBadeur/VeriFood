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
  Sparkles,
} from 'lucide-react';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RELAWAN';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      window.location.href = '/login';
    }
  };

  const navItems = [
    { label: 'FEFO Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Catat Makanan Masuk', href: '/makanan/masuk', icon: PackagePlus },
    { label: 'Kelola Stok & Buang', href: '/makanan/kelola', icon: Boxes, adminOnly: true },
    { label: 'Daftar Distribusi', href: '/distribusi', icon: Truck },
    { label: 'Jadwalkan Distribusi', href: '/distribusi/buat', icon: PlusCircle, adminOnly: true },
    { label: 'Data Donatur', href: '/donatur', icon: Building2 },
    { label: 'Data Penerima', href: '/penerima', icon: Users2 },
    { label: 'Kelola Pengguna', href: '/pengguna', icon: UserCog, adminOnly: true },
    { label: 'Laporan & Audit', href: '/laporan', icon: FileBarChart2, adminOnly: true },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (currentUser?.role === 'RELAWAN' && item.adminOnly) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#EBF7F3] p-2 sm:p-4 lg:p-6 flex items-center justify-center font-sans antialiased">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Floating Island Canvas Container (Matches reference image) */}
      <div className="w-full max-w-[1440px] h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] bg-white rounded-3xl shadow-2xl shadow-emerald-950/10 border border-emerald-100/60 flex overflow-hidden relative">
        {/* Left Curved Dock Sidebar (Deep Pine Green with Organic Curve) */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-20 bg-[#2B6153] flex flex-col items-center py-6 justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Top Geometric Logo */}
          <div className="flex flex-col items-center gap-3">
            <Link href="/dashboard" className="relative group">
              <div className="w-11 h-11 rounded-2xl bg-[#F4B942] flex items-center justify-center text-[#2B6153] font-black text-xl shadow-md transition group-hover:scale-105">
                SB
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-[#2B6153]" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-emerald-200 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Icons Dock */}
          <nav className="flex flex-col items-center gap-3 my-auto py-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  title={item.label}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-white text-[#2B6153] shadow-md shadow-black/10 scale-105'
                      : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {/* Tooltip for desktop */}
                  <span className="absolute left-16 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Dock Logout */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleLogout}
              title="Keluar Akun"
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-red-300 hover:text-white hover:bg-red-500/20 transition group relative"
            >
              <LogOut className="w-5 h-5" />
              <span className="absolute left-16 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50 shadow-lg">
                Keluar Akun
              </span>
            </button>
          </div>
        </aside>

        {/* Inner Canvas Area (Top Bar & Main Viewport) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
          {/* Top Bar Header (Reference styled with search bar pill and user profile pill) */}
          <header className="h-20 px-6 sm:px-8 flex items-center justify-between border-b border-slate-100/80 bg-white">
            {/* Mobile Toggle & Search Bar */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="relative w-full">
                <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search or type command..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200/60 rounded-full text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#2B6153] focus:ring-2 focus:ring-[#2B6153]/10 transition"
                />
              </div>
            </div>

            {/* Right Controls: Settings, Bell, & User Profile Pill */}
            <div className="flex items-center gap-2 sm:gap-4 pl-4">
              <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
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

              {/* User Profile Pill (Matches reference image top-right "Michael Smith") */}
              <div className="flex items-center gap-2.5 pl-2 sm:pl-3 py-1 pr-1.5 border border-slate-200/70 rounded-full bg-slate-50/50 hover:bg-slate-100/60 transition">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser?.name || (loadingUser ? 'Memuat...' : 'Pengguna')}
                  </p>
                  <p className="text-[10px] font-semibold text-[#2B6153] uppercase tracking-wider">
                    {currentUser?.role === 'ADMIN' ? 'Administrator' : 'Relawan'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#2B6153] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
            </div>
          </header>

          {/* Viewport for Dashboard & Other Pages */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
