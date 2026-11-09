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
  UserCheck,
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

  // If user is RELAWAN, filter out adminOnly items. Default to showing all if loading or Admin.
  const visibleNavItems = navItems.filter((item) => {
    if (currentUser?.role === 'RELAWAN' && item.adminOnly) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 font-bold text-white shadow-sm">
              SB
            </span>
            <div>
              <span className="font-bold text-lg tracking-wide text-white block leading-tight">
                SisaBerkah
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Food Bank & FEFO
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card in Sidebar */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-100 truncate">
              {currentUser?.name || (loadingUser ? 'Memuat akun...' : 'Pengguna')}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  currentUser?.role === 'ADMIN'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {currentUser?.role || 'SISTEM'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Peran Aktif:</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                currentUser?.role === 'ADMIN'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {currentUser?.role === 'ADMIN' ? 'Administrator' : 'Relawan Lapangan'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              Sistem Aktif
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition sm:hidden"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
