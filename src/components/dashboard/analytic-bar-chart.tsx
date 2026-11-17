'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';

interface AnalyticBarChartProps {
  countAman: number;
  countMendekati: number;
  countKedaluwarsa: number;
}

export function AnalyticBarChart({
  countAman,
  countMendekati,
  countKedaluwarsa,
}: AnalyticBarChartProps) {
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'year'>('week');

  // Realistic sample trends for the selected range
  const chartData = {
    week: [
      { label: 'Sen', rescued: 65, distributed: 50 },
      { label: 'Sel', rescued: 80, distributed: 70 },
      { label: 'Rab', rescued: 45, distributed: 40 },
      { label: 'Kam', rescued: 90, distributed: 85 },
      { label: 'Jum', rescued: 120, distributed: 110 },
      { label: 'Sab', rescued: 75, distributed: 60 },
      { label: 'Min', rescued: 40, distributed: 35 },
    ],
    month: [
      { label: 'M1', rescued: 320, distributed: 280 },
      { label: 'M2', rescued: 450, distributed: 410 },
      { label: 'M3', rescued: 390, distributed: 370 },
      { label: 'M4', rescued: 510, distributed: 490 },
    ],
    year: [
      { label: 'Q1', rescued: 1200, distributed: 1100 },
      { label: 'Q2', rescued: 1450, distributed: 1350 },
      { label: 'Q3', rescued: 1600, distributed: 1520 },
      { label: 'Q4', rescued: 1380, distributed: 1310 },
    ],
  }[activeTab];

  const maxVal = Math.max(...chartData.map((d) => Math.max(d.rescued, d.distributed)), 1);

  const totalSafetyItems = Math.max(countAman + countMendekati + countKedaluwarsa, 1);
  const percentAman = Math.round((countAman / totalSafetyItems) * 100);
  const percentMendekati = Math.round((countMendekati / totalSafetyItems) * 100);
  const percentKedaluwarsa = Math.round((countKedaluwarsa / totalSafetyItems) * 100);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="h-full flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#15181e] border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-900/5 dark:shadow-black/30 transition-all duration-300"
    >
      {/* Header & Range Switcher */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tren Logistik Pangan
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                Penyelamatan vs Penyaluran
              </p>
            </div>
          </div>

          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-[11px] font-semibold border border-slate-200/60 dark:border-zinc-700/60">
            <button
              onClick={() => setActiveTab('week')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                activeTab === 'week'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              Mg
            </button>
            <button
              onClick={() => setActiveTab('month')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                activeTab === 'month'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              Bln
            </button>
            <button
              onClick={() => setActiveTab('year')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                activeTab === 'year'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              Thn
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-semibold mb-4 text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white" />
            <span>Disalurkan</span>
          </div>
        </div>

        {/* Vertical Rounded Bars */}
        <div className="h-40 flex items-end justify-between gap-2 pt-4 px-1 border-b border-slate-100 dark:border-zinc-800">
          {chartData.map((d) => {
            const heightRescued = Math.round((d.rescued / maxVal) * 100);
            const heightDistributed = Math.round((d.distributed / maxVal) * 100);

            return (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Rescued bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightRescued}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="w-2.5 sm:w-3 bg-emerald-500 rounded-t-lg transition-colors group-hover:bg-emerald-400"
                    title={`Masuk: ${d.rescued}`}
                  />
                  {/* Distributed bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightDistributed}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="w-2.5 sm:w-3 bg-slate-800 dark:bg-white rounded-t-lg transition-colors group-hover:bg-slate-700 dark:group-hover:bg-zinc-200"
                    title={`Disalurkan: ${d.distributed}`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mt-1">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: Food Safety Status Distribution */}
      <div className="mt-5 pt-3">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-slate-700 dark:text-zinc-300">
            Distribusi Keamanan FEFO
          </span>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500">
            {countAman + countMendekati + countKedaluwarsa} Batch
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 flex overflow-hidden">
          <div style={{ width: `${percentAman}%` }} className="bg-emerald-500 h-full" title={`Aman: ${percentAman}%`} />
          <div style={{ width: `${percentMendekati}%` }} className="bg-amber-500 h-full" title={`Mendekati: ${percentMendekati}%`} />
          <div style={{ width: `${percentKedaluwarsa}%` }} className="bg-rose-500 h-full" title={`Kedaluwarsa: ${percentKedaluwarsa}%`} />
        </div>

        {/* Status Breakdown Pills */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 text-center">
          <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
            <span className="text-[10px] block font-medium">Aman</span>
            <span className="text-xs font-extrabold">{countAman}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
            <span className="text-[10px] block font-medium">&le; 24 Jam</span>
            <span className="text-xs font-extrabold">{countMendekati}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400">
            <span className="text-[10px] block font-medium">Kedaluwarsa</span>
            <span className="text-xs font-extrabold">{countKedaluwarsa}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
