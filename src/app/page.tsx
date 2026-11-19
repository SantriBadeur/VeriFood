import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, HeartHandshake, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#EBF7F3] dark:bg-[#0c0e12] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/40 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-amber-100/50 dark:bg-amber-950/15 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Island Card Container */}
      <div className="w-full max-w-md bg-white dark:bg-[#131b2a] rounded-3xl p-7 sm:p-9 shadow-2xl shadow-emerald-900/10 dark:shadow-none border border-emerald-100/70 dark:border-white/10 relative z-10 text-center space-y-6">
        {/* Geometric Logo */}
        <div className="inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#245246] to-emerald-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-900/25 relative group">
            SB
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F4B942] rounded-full border-2 border-white dark:border-[#131b2a]" />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#2B6153] dark:text-emerald-400 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-800/40">
            <Sparkles className="w-3.5 h-3.5 text-[#F4B942]" /> Food Bank Logistics Platform
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            SisaBerkah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
            Sistem Penyelamatan Pangan Berlebih & Distribusi Logistik Aman Berbasis FEFO.
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-2 gap-2 text-left pt-1">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-3.5 h-3.5" /> FEFO Safety
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Prioritas kedaluwarsa ketat</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-xs">
              <MapPin className="w-3.5 h-3.5" /> BAST & Rute
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Bukti foto & rute maps</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2.5 pt-2">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#2B6153] hover:bg-[#224D42] text-white font-semibold text-sm transition shadow-lg shadow-[#2B6153]/25 active:scale-95"
          >
            <span>Masuk ke Sistem</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-medium text-xs transition active:scale-95"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
            <span>Daftar sebagai Relawan</span>
          </Link>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-2">
          Kompatibel untuk kurir ponsel cerdas (layar 360px–414px)
        </p>
      </div>
    </main>
  );
}
