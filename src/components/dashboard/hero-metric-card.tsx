'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, animate } from 'framer-motion';
import { PlusCircle, CalendarPlus, Layers, ArrowUpRight } from 'lucide-react';

interface HeroMetricCardProps {
  totalPorsi: number;
  totalKg: number;
  unitBreakdown?: Record<string, number>;
  selectedUnit: 'porsi' | 'kg' | 'all';
  onSelectUnit: (unit: 'porsi' | 'kg' | 'all') => void;
  monthlyGoal?: number;
}

export function HeroMetricCard({
  totalPorsi,
  totalKg,
  unitBreakdown = {},
  selectedUnit,
  onSelectUnit,
  monthlyGoal = 2500,
}: HeroMetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Compute primary target value based on selected unit
  const targetValue =
    selectedUnit === 'porsi'
      ? totalPorsi
      : selectedUnit === 'kg'
      ? totalKg
      : totalPorsi; // in 'all', lead with porsi

  // Animated counter
  useEffect(() => {
    const controls = animate(displayValue, targetValue, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [targetValue]);

  // Secondary units (units other than current selected)
  const secondaryUnits = Object.entries(unitBreakdown).filter(([u, qty]) => {
    if (selectedUnit === 'porsi' && u === 'porsi') return false;
    if (selectedUnit === 'kg' && u === 'kg') return false;
    return qty > 0;
  });

  const progressPercent = Math.min(
    100,
    Math.round((displayValue / (monthlyGoal || 1)) * 100)
  );

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="h-full flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#15181e] border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-900/5 dark:shadow-black/30 transition-all duration-300 relative overflow-hidden"
    >
      {/* Background Decorative Gradient Radial */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Label & Unit Filter Pill */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Stok Pangan Aktif
            </span>
          </div>

          {/* Unit Filter Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-[11px] font-semibold border border-slate-200/60 dark:border-zinc-700/60">
            <button
              onClick={() => onSelectUnit('porsi')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedUnit === 'porsi'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Porsi
            </button>
            <button
              onClick={() => onSelectUnit('kg')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedUnit === 'kg'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Kg
            </button>
            <button
              onClick={() => onSelectUnit('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedUnit === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        {/* Big Counter Value */}
        <div className="mt-3 flex items-baseline gap-2.5">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
            {displayValue.toLocaleString('id-ID')}
          </h2>
          <span className="text-sm sm:text-base font-bold text-slate-400 dark:text-zinc-500 capitalize">
            {selectedUnit === 'all' ? 'Porsi (Utama)' : selectedUnit}
          </span>
        </div>

        {/* Secondary Units Segregation Badge */}
        {secondaryUnits.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500">Satuan lain:</span>
            {secondaryUnits.map(([u, qty]) => (
              <span
                key={u}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700/60"
              >
                <Layers className="w-3 h-3 text-emerald-500" />
                {qty.toLocaleString('id-ID')} {u}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Center: Target Progress Bar */}
      <div className="my-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-600 dark:text-zinc-400">
            Target Penyelamatan Bulanan
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {progressPercent}% ({displayValue}/{monthlyGoal.toLocaleString('id-ID')})
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-[#245246] via-emerald-500 to-[#F4B942]"
          />
        </div>
      </div>

      {/* Bottom: Quick Action Pill Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <Link
          href="/makanan/masuk"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Catat Pangan Masuk</span>
        </Link>

        <Link
          href="/distribusi/buat"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-800 dark:text-white font-bold text-xs border border-slate-200/80 dark:border-white/10 transition-all hover:scale-[1.02]"
        >
          <CalendarPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Jadwalkan Distribusi</span>
        </Link>
      </div>
    </motion.div>
  );
}
