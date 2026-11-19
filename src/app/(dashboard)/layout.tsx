'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { UserProvider, CurrentUser } from '@/lib/user-context';
import { ThemeProvider } from '@/lib/theme-context';
import { FloatingDock } from '@/components/layout/floating-dock';
import { TopHeader } from '@/components/layout/top-header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  return (
    <ThemeProvider>
      <UserProvider user={currentUser}>
        <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#0b0f17] text-slate-800 dark:text-slate-200 transition-colors duration-300 flex overflow-x-hidden antialiased font-sans">
          {/* Left Floating Dock */}
          <FloatingDock
            currentUser={currentUser}
            onLogout={handleLogout}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />

          {/* Main Content Area (Offset for Left Floating Dock on Desktop with generous breathing room) */}
          <div className="flex-1 flex flex-col min-w-0 lg:pl-28 xl:pl-32 transition-all duration-300">
            {/* Top Floating Capsule Header */}
            <TopHeader
              currentUser={currentUser}
              onOpenMobile={() => setMobileOpen(true)}
            />

            {/* Page Canvas Container */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-16">
              {children}
            </main>
          </div>
        </div>
      </UserProvider>
    </ThemeProvider>
  );
}
