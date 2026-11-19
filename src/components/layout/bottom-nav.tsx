'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  Truck,
  Building2,
  FileBarChart2,
} from 'lucide-react';

export interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export const ALL_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Ringkasan', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pangan', href: '/makanan/masuk', icon: Boxes },
  { label: 'Distribusi', href: '/distribusi', icon: Truck },
  { label: 'Mitra', href: '/donatur', icon: Building2 },
  { label: 'Laporan', href: '/laporan', icon: FileBarChart2, adminOnly: true },
];

export function getBottomNavItems(role?: string): BottomNavItem[] {
  if (role === 'ADMIN') {
    return ALL_BOTTOM_NAV_ITEMS;
  }
  return ALL_BOTTOM_NAV_ITEMS.filter((item) => !item.adminOnly);
}

export function isBottomNavActive(itemHref: string, currentPath: string): boolean {
  if (itemHref === '/dashboard') {
    return currentPath === '/dashboard';
  }
  if (itemHref === '/makanan/masuk') {
    return currentPath.startsWith('/makanan');
  }
  if (itemHref === '/distribusi') {
    return currentPath.startsWith('/distribusi');
  }
  if (itemHref === '/donatur') {
    return currentPath === '/donatur' || currentPath === '/penerima';
  }
  if (itemHref === '/laporan') {
    return currentPath.startsWith('/laporan');
  }
  return currentPath.startsWith(itemHref);
}

interface BottomNavProps {
  currentUser?: {
    name?: string;
    role?: string;
  } | null;
}

export default function BottomNav({ currentUser }: BottomNavProps) {
  const pathname = usePathname() || '';
  const items = getBottomNavItems(currentUser?.role);

  return (
    <nav
      aria-label="Navigasi Bawah Layar Ponsel"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-[#131b2a]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pb-[max(0.375rem,env(safe-area-inset-bottom))] select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const active = isBottomNavActive(item.href, pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 active:scale-95 min-h-[48px] ${
                active
                  ? 'text-[#2B6153] dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 shadow-sm'
                    : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    active ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
                  }`}
                />
              </div>

              <span
                className={`text-[10px] tracking-tight mt-0.5 leading-none ${
                  active
                    ? 'font-bold text-[#2B6153] dark:text-emerald-400'
                    : 'font-medium text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>

              {active && (
                <span className="absolute bottom-0 w-1.5 h-1 rounded-full bg-[#2B6153] dark:bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
