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
      <body className="antialiased min-h-screen font-serif">{children}</body>
    </html>
  );
}

