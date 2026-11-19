'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  PackagePlus,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Heart,
  ArrowUpRight,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useCurrentUser } from '@/lib/user-context';
import { HeroMetricCard } from '@/components/dashboard/hero-metric-card';
import { BentoStatCard } from '@/components/dashboard/bento-stat-card';
import { AnalyticBarChart } from '@/components/dashboard/analytic-bar-chart';
import { RecentActivityCard, RecentActivityItem } from '@/components/dashboard/recent-activity-card';

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
    canDistribute?: boolean;
  };
  donor: {
    name: string;
  };
}

interface DashboardStats {
  totalPorsi: number;
  totalKg: number;
  unitBreakdown: Record<string, number>;
  countAman: number;
  countMendekati: number;
  countKedaluwarsa: number;
  disalurkanHariIni: number;
  activeDonorsCount: number;
  recentDistributions: any[];
}

export default function DashboardPage() {
  const currentUser = useCurrentUser();
  const [fefoItems, setFefoItems] = useState<FoodItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPorsi: 0,
    totalKg: 0,
    unitBreakdown: {},
    countAman: 0,
    countMendekati: 0,
    countKedaluwarsa: 0,
    disalurkanHariIni: 0,
    activeDonorsCount: 0,
    recentDistributions: [],
  });
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<'porsi' | 'kg' | 'all'>('porsi');
  const [fefoSearch, setFefoSearch] = useState('');
  const [fefoFilter, setFefoFilter] = useState<'ALL' | 'AMAN' | 'MENDEKATI_KEDALUWARSA' | 'KEDALUWARSA'>('ALL');

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/food/fefo').then((res) => (res.ok ? res.json() : [])),
      fetch('/api/notifications/critical').then((res) => (res.ok ? res.json() : { criticalItems: [] })),
    ])
      .then(([statsData, fefoData, criticalData]) => {
        if (statsData) setStats(statsData);
        if (Array.isArray(fefoData)) setFefoItems(fefoData);
        if (criticalData?.criticalItems) setCriticalAlerts(criticalData.criticalItems);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Map recent distributions to RecentActivityItem
  const recentActivities: RecentActivityItem[] = (stats.recentDistributions || []).map((dist: any) => {
    const itemsSummary = dist.items
      ?.map((i: any) => `${i.foodStock?.name || 'Makanan'} (${i.quantity} ${i.foodStock?.unit || ''})`)
      .join(', ') || 'Paket Bantuan';
    const totalQuantity = dist.items?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0;

    return {
      id: dist.id,
      recipientName: dist.beneficiary?.name || 'Penerima Manfaat',
      driverName: dist.driverName || undefined,
      status: dist.status,
      scheduledDate: dist.scheduledDate,
      itemsSummary,
      totalQuantity,
    };
  });

  const scrollToFefo = () => {
    const el = document.getElementById('antrean-fefo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter FEFO queue
  const filteredFefo = fefoItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(fefoSearch.toLowerCase()) ||
      item.donor.name.toLowerCase().includes(fefoSearch.toLowerCase());
    const matchesStatus = fefoFilter === 'ALL' || item.evaluation.status === fefoFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* ============================================================== */}
      {/* 1. Dynamic Welcome Banner                                      */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {getGreeting()}, {currentUser?.name?.split(' ')[0] || 'Relawan'}
            </h1>
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Pantau stok pangan masuk, prioritas FEFO, dan jadwal distribusi secara realtime.
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={scrollToFefo}
            className="px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs font-bold hover:scale-105 transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{stats.countMendekati} Prioritas FEFO</span>
          </button>
        </div>
      </div>

      {/* Critical Expiry Alarm Banner (<= 2 Hours) */}
      {criticalAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-red-500/30 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md shrink-0 shadow-inner">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <span>🚨 ALARM KRITIS: {criticalAlerts.length} Batch Pangan Basi dalam &le; 2 Jam!</span>
              </h3>
              <p className="text-xs text-red-100 mt-0.5 leading-relaxed">
                Terdapat makanan surplus siap konsumsi yang belum terjadwal untuk dikirim. Alokasikan ke penerima manfaat sekarang agar tidak terbuang.
              </p>
            </div>
          </div>
          <Link
            href="/distribusi/buat"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-red-700 text-xs font-black shadow-md hover:bg-red-50 hover:scale-105 transition-all shrink-0"
          >
            Jadwalkan Penyaluran Cepat <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. Tier 1: Core Operations & Hero Metrics (5 cols + 7 cols)    */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left: Hero Metric Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <HeroMetricCard
            totalPorsi={stats.totalPorsi}
            totalKg={stats.totalKg}
            unitBreakdown={stats.unitBreakdown}
            selectedUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
            monthlyGoal={2500}
          />
        </div>

        {/* Right: 2x2 Bento Stat Cards (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Gradient Alert for Urgent Expiry */}
          <BentoStatCard
            variant="gradient-urgent"
            title="Prioritas FEFO"
            value={stats.countMendekati}
            subtitle="Kedaluwarsa &le; 24 jam"
            badgeText="Salurkan Segera"
            icon={AlertTriangle}
            onClick={scrollToFefo}
          />

          {/* Card 2: Safe Stock */}
          <BentoStatCard
            title="Stok Aman"
            value={stats.countAman}
            subtitle="Kondisi segar & layak"
            icon={ShieldCheck}
            isPositive={true}
            change={12}
          />

          {/* Card 3: Distributed Today */}
          <BentoStatCard
            title="Penyaluran Hari Ini"
            value={stats.disalurkanHariIni}
            subtitle="Porsi terdistribusi"
            icon={Truck}
            isPositive={true}
            change={18}
          />

          {/* Card 4: Active Donors */}
          <BentoStatCard
            title="Donatur Aktif"
            value={stats.activeDonorsCount}
            subtitle="Mitra bank pangan"
            icon={Heart}
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. Tier 2: Logistical Analytics & Recent Activity (5 cols + 7 cols) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left: Analytic Bar Chart (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <AnalyticBarChart
            countAman={stats.countAman}
            countMendekati={stats.countMendekati}
            countKedaluwarsa={stats.countKedaluwarsa}
          />
        </div>

        {/* Right: Recent Distribution Activity (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <RecentActivityCard activities={recentActivities} />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. Antrean Prioritas FEFO (Interactive Table)                  */}
      {/* ============================================================== */}
      <div
        id="antrean-fefo"
        className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#131b2a] border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-900/5 dark:shadow-black/40 transition-all"
      >
        {/* Table Header with Search & Badge Counters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Antrean Prioritas FEFO (First Expired, First Out)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                Live Invariant
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Urutan batch makanan aktif yang wajib didistribusikan lebih dulu berdasarkan tanggal kedaluwarsa.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={fefoSearch}
                onChange={(e) => setFefoSearch(e.target.value)}
                placeholder="Cari nama makanan / donatur..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-56"
              />
            </div>

            <select
              value={fefoFilter}
              onChange={(e) => setFefoFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="AMAN">🟢 Aman</option>
              <option value="MENDEKATI_KEDALUWARSA">🟡 Prioritas (&le; 24 Jam)</option>
              <option value="KEDALUWARSA">🔴 Kedaluwarsa</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="pb-3 pl-1">Nama Makanan</th>
                <th className="pb-3">Mitra Donatur</th>
                <th className="pb-3">Sisa Stok</th>
                <th className="pb-3">Batas Kedaluwarsa</th>
                <th className="pb-3">Status FEFO</th>
                <th className="pb-3 text-right pr-1">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    Memuat antrean stok FEFO...
                  </td>
                </tr>
              ) : filteredFefo.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    Tidak ada stok makanan aktif yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredFefo.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 pl-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {item.name}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">
                      {item.donor.name}
                    </td>
                    <td className="py-3.5 font-sans font-bold tabular-nums text-slate-800 dark:text-slate-200 text-sm">
                      {item.remainingQuantity.toLocaleString('id-ID')}{' '}
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">
                      {new Date(item.expiryAt).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          item.evaluation.badge === 'green'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : item.evaluation.badge === 'yellow'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 animate-pulse'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                        }`}
                      >
                        {item.evaluation.label}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      {item.evaluation.status === 'KEDALUWARSA' || !item.evaluation.canDistribute ? (
                        <Link
                          href="/makanan/kelola"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-bold transition-all hover:scale-105"
                          title="Makanan telah kedaluwarsa. Alihkan ke pemusnahan barang."
                        >
                          <span>Musnahkan</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                        </Link>
                      ) : (
                        <Link
                          href="/distribusi/buat"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/20 transition-all hover:scale-105"
                        >
                          <span>Salurkan</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                        </Link>
                      )}
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
