'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled root error:', error);
  }, [error]);

  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-[#EBF7F3] dark:bg-[#0c0e12] flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="w-full max-w-md bg-white dark:bg-[#131b2a] rounded-3xl p-8 sm:p-10 shadow-2xl shadow-red-900/10 border border-red-100 dark:border-red-900/30 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Terjadi Kesalahan Server</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {error?.message || 'Sistem mengalami kendala saat memuat aplikasi.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-[#2B6153] text-white font-semibold text-xs hover:bg-[#224D42] transition shadow"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
