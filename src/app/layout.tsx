import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SisaBerkah - Food Bank Platform',
  description: 'Sistem Manajemen Penyelamatan dan Distribusi Pangan Berlebih Berbasis FEFO',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen font-sans bg-[#f8fafc] dark:bg-[#0c0e12] text-slate-900 dark:text-zinc-100 selection:bg-emerald-500 selection:text-white">{children}</body>
    </html>
  );
}

