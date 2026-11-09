'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PackagePlus,
  Truck,
  Boxes,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Heart,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface FoodItem {
  id: string;
  name: string;
  remainingQuantity: number;
  unit: string;
  expiryAt: string;
  evaluation: {
    status: 'AMAN' | 'MENDEKATI_KEDALUWARSA' | 'KEDALUWARSA' | 'DITOLAK';
    label: string;
    badge: 'green' | 'yellow' | 'red';
  };
  donor: {
    name: string;
  };
}

export default function DashboardPage() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetch('/api/food/fefo')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const countAman = items.filter((i) => i.evaluation.status === 'AMAN').length;
  const countMendekati = items.filter((i) => i.evaluation.status === 'MENDEKATI_KEDALUWARSA').length;
  const countKedaluwarsa = items.filter((i) => i.evaluation.status === 'KEDALUWARSA').length;
  const totalStokPorsi = items.reduce((acc, curr) => acc + curr.remainingQuantity, 0);

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* ROW 1: Hero Card ("My cards"), Quick Actions, & Wave Trend Card */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Hero Card & Balance (Left - 5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Stok Pangan Aktif</h2>
            <Link
              href="/makanan/masuk"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2B6153] hover:text-[#1e443a] transition"
            >
              Tambah baru <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-xs">+</span>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* The Stylized Food Rescue Card (Matches reference VISA card) */}
            <div className="w-full sm:w-56 h-36 rounded-2xl bg-gradient-to-tr from-[#245246] via-[#2F6758] to-[#3d8370] p-4 text-white shadow-lg shadow-[#2B6153]/25 flex flex-col justify-between relative overflow-hidden shrink-0">
              {/* Background waves effect */}
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="none">
                  <path d="M0,100 C40,160 120,40 200,100 L200,200 L0,200 Z" fill="#ffffff" />
                </svg>
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#F4B942]" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-100">
                    Food Bank
                  </span>
                </div>
                <span className="text-xs font-black tracking-widest text-[#F4B942]">FEFO</span>
              </div>

              <div className="relative z-10">
                <p className="text-[11px] text-emerald-200 tracking-widest font-mono">2026 • 8492 • 1024</p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-emerald-100 relative z-10">
                <span>SisaBerkah System</span>
                <span className="font-semibold text-white">READY</span>
              </div>
            </div>

            {/* Total Balance / Porsi Metrics */}
            <div className="flex-1 w-full flex flex-col justify-center">
              <span className="text-xs font-medium text-slate-400">Total Stok Tersedia</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
                {totalStokPorsi > 0 ? totalStokPorsi.toLocaleString('id-ID') : '1.450'}{' '}
                <span className="text-sm font-semibold text-slate-500">Porsi</span>
              </div>
              <a
                href="#tabel-fefo"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2B6153] mt-2 hover:gap-2 transition-all"
              >
                <span>Lihat antrean FEFO</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Action Pill Buttons (Center - 3 Cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-400 mb-3">Aksi Cepat Operasional</p>
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/makanan/masuk"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/70 border border-slate-100 transition group text-center"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#2B6153] flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <PackagePlus className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700">Catat</span>
            </Link>

            <Link
              href="/distribusi/buat"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/70 border border-slate-100 transition group text-center"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#2B6153] flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700">Salur</span>
            </Link>

            <Link
              href="/makanan/kelola"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/70 border border-slate-100 transition group text-center"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#2B6153] flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
                <Boxes className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700">Kelola</span>
            </Link>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            {countMendekati > 0 ? (
              <span className="text-amber-600 font-semibold">⚠️ {countMendekati} batch mendekati expired</span>
            ) : (
              <span className="text-emerald-600 font-medium">✓ Seluruh batch dalam masa aman</span>
            )}
          </div>
        </div>

        {/* Profit / Trend Wave Chart (Right - 4 Cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-800">Efisiensi Penyelamatan</h3>
            <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-full text-[10px] font-semibold text-slate-600">
              <button
                onClick={() => setChartTab('week')}
                className={`px-2 py-0.5 rounded-full transition ${chartTab === 'week' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
              >
                Week
              </button>
              <button
                onClick={() => setChartTab('month')}
                className={`px-2 py-0.5 rounded-full transition ${chartTab === 'month' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
              >
                Month
              </button>
              <button
                onClick={() => setChartTab('year')}
                className={`px-2 py-0.5 rounded-full transition ${chartTab === 'year' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
              >
                Year
              </button>
            </div>
          </div>

          {/* Smooth Green SVG Wave Curve (Matches reference "Profit" chart) */}
          <div className="w-full h-24 my-2">
            <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2B6153" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2B6153" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,55 C40,65 70,30 110,40 C150,50 180,60 220,35 C250,20 280,15 300,10 L300,80 L0,80 Z"
                fill="url(#profitGradient)"
              />
              <path
                d="M0,55 C40,65 70,30 110,40 C150,50 180,60 220,35 C250,20 280,15 300,10"
                fill="none"
                stroke="#2B6153"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="300" cy="10" r="3.5" fill="#2B6153" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
            <span className="font-bold text-[#2B6153]">Min</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 2: Income/Expense Wave Cards & Dual-Tone Spending Statistic */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        {/* Income Card (Matches reference "Income" +$4,465.00) - 3 Cols */}
        <div className="lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#2B6153] flex items-center justify-center">
                <PackagePlus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Donasi Masuk</span>
            </div>
            <span className="text-slate-300">•••</span>
          </div>

          {/* Smooth wave line */}
          <div className="w-full h-12 my-3">
            <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M0,30 C30,35 60,10 90,20 C120,30 150,5 200,15"
                fill="none"
                stroke="#2B6153"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-slate-800">+1.450 <span className="text-xs font-normal text-slate-400">Porsi</span></span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              +18% ↑
            </span>
          </div>
        </div>

        {/* Expenses Card (Matches reference "Expences" -$2,465.00) - 3 Cols */}
        <div className="lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Tersalurkan</span>
            </div>
            <span className="text-slate-300">•••</span>
          </div>

          {/* Smooth wave line */}
          <div className="w-full h-12 my-3">
            <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M0,20 C40,5 80,35 120,20 C160,10 180,30 200,25"
                fill="none"
                stroke="#3B8272"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-slate-800">1.120 <span className="text-xs font-normal text-slate-400">Porsi</span></span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              82% Rasio
            </span>
          </div>
        </div>

        {/* Spendings Statistic Dual-Tone Bar Chart (Matches reference 6 Cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#2B6153] flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Statistik Penyelamatan Bulanan</h3>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span>Tahun 2026</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Dual-color pill bars matching reference image (Yellow and soft mint background bars) */}
          <div className="grid grid-cols-11 gap-2 items-end h-24 my-2 px-1">
            {[
              { m: 'Jan', h: 45, y: 30 },
              { m: 'Feb', h: 65, y: 50 },
              { m: 'Mar', h: 80, y: 70 },
              { m: 'Apr', h: 90, y: 85 },
              { m: 'Mei', h: 50, y: 35 },
              { m: 'Jun', h: 75, y: 60 },
              { m: 'Jul', h: 40, y: 25 },
              { m: 'Agu', h: 60, y: 45 },
              { m: 'Sep', h: 70, y: 55 },
              { m: 'Okt', h: 85, y: 70 },
              { m: 'Nov', h: 95, y: 80 },
            ].map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full max-w-[14px] bg-[#E8F6F1] rounded-full h-full flex flex-col justify-end overflow-hidden relative">
                  {/* Yellow pill fill matching reference */}
                  <div
                    className="w-full bg-[#F4B942] rounded-full transition-all duration-500"
                    style={{ height: `${bar.y}%` }}
                  />
                </div>
                <span className="text-[9px] font-semibold text-slate-400">{bar.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 3: Planning Progress, Latest Transactions, & Callout Card  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        {/* Planning Section (Matches reference "Planning") - 4 Cols */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Target Distribusi Sasaran</h3>
            <Link href="/penerima" className="text-xs font-semibold text-[#2B6153]">
              Kelola +
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 font-semibold">Panti Asuhan Kasih Bunda</span>
                <span className="text-slate-400 text-[11px]">350 / 500 Porsi</span>
              </div>
              <div className="w-full h-2.5 bg-[#E8F6F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#F4B942] rounded-full w-[70%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 font-semibold">Komunitas Kaum Dhuafa</span>
                <span className="text-slate-400 text-[11px]">620 / 700 Porsi</span>
              </div>
              <div className="w-full h-2.5 bg-[#E8F6F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#2B6153] rounded-full w-[88%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 font-semibold">Keluarga Prasejahtera Sukamaju</span>
                <span className="text-slate-400 text-[11px]">180 / 200 Porsi</span>
              </div>
              <div className="w-full h-2.5 bg-[#E8F6F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#F4B942] rounded-full w-[90%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Latest Activity Feed (Matches reference "Latest transactions") - 5 Cols */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Aktivitas Penyelamatan Terkini</h3>
            <span className="text-xs text-slate-400">Hari ini</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#2B6153] flex items-center justify-center font-bold text-xs">
                  R
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Restoran Sedap Rasa</p>
                  <p className="text-[10px] text-slate-400">Nasi Kotak Ayam Panggang • 50 porsi</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Diterima
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  B
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Bakery Lestari Jaya</p>
                  <p className="text-[10px] text-slate-400">Roti Gandum Manis • 120 pack</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                Mendekati FEFO
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  K
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Katering Barokah</p>
                  <p className="text-[10px] text-slate-400">Sayur Lodeh & Tempe Bacem • 40 porsi</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Terjadwal
              </span>
            </div>
          </div>
        </div>

        {/* Callout Card (Matches reference "Go premium" section) - 3 Cols */}
        <div className="lg:col-span-3 bg-gradient-to-br from-[#2B6153] to-[#20493e] text-white p-5 rounded-3xl shadow-md shadow-[#2B6153]/20 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold tracking-tight text-white">Misi Zero Waste</h3>
              <Sparkles className="w-4 h-4 text-[#F4B942]" />
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed mt-1">
              Setiap porsi makanan terselamatkan adalah senyuman dan berkah bagi sesama serta bumi kita.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-600/50 flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-200">FEFO Engine 2.0</span>
            <Link
              href="/laporan"
              className="px-3 py-1.5 rounded-xl bg-white text-[#2B6153] text-xs font-bold hover:bg-[#F4B942] hover:text-slate-900 transition shadow-sm"
            >
              Lihat Dampak
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 4: Real-Time FEFO Prioritized Inventory Table              */}
      {/* ============================================================== */}
      <div id="tabel-fefo" className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Antrean Prioritas FEFO (First Expired, First Out)</h2>
            <p className="text-xs text-slate-400">
              Urutan batch makanan aktif yang wajib disalurkan terlebih dahulu.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              🟢 {countAman} Aman
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              🟡 {countMendekati} Prioritas Segera
            </span>
            {countKedaluwarsa > 0 && (
              <span className="flex items-center gap-1 font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                🔴 {countKedaluwarsa} Kedaluwarsa
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Nama Makanan</th>
                <th className="px-5 py-3.5">Mitra Donatur</th>
                <th className="px-5 py-3.5">Sisa Stok</th>
                <th className="px-5 py-3.5">Batas Kedaluwarsa</th>
                <th className="px-5 py-3.5">Status FEFO</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Memuat data antrean FEFO...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Belum ada stok makanan aktif yang terdaftar.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-5 py-4 text-slate-600">{item.donor.name}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">
                      {item.remainingQuantity} <span className="font-normal text-slate-400 text-xs">{item.unit}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {new Date(item.expiryAt).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.evaluation.badge === 'green'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : item.evaluation.badge === 'yellow'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {item.evaluation.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href="/distribusi/buat"
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#2B6153] hover:text-white transition"
                      >
                        Salurkan <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
