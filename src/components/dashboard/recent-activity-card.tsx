'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Truck, ArrowRight, PackageCheck, Clock } from 'lucide-react';

export interface RecentActivityItem {
  id: string;
  recipientName: string;
  driverName?: string;
  status: 'TERJADWAL' | 'DIKIRIM' | 'DITERIMA' | 'DIBATALKAN';
  scheduledDate: string;
  itemsSummary: string;
  totalQuantity: number;
}

interface RecentActivityCardProps {
  activities: RecentActivityItem[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TERJADWAL' | 'DIKIRIM' | 'DITERIMA'>('ALL');

  const filtered = activities.filter((act) => {
    const matchesSearch =
      act.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      act.itemsSummary.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || act.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: RecentActivityItem['status']) => {
    switch (status) {
      case 'DITERIMA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
            DITERIMA
          </span>
        );
      case 'DIKIRIM':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
            DIKIRIM
          </span>
        );
      case 'TERJADWAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
            TERJADWAL
          </span>
        );
      case 'DIBATALKAN':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
            DIBATALKAN
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#131b2a] border border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-900/5 dark:shadow-black/40 transition-all">
      {/* Header with Search & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Aktivitas Distribusi Terkini
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Jadwal pengiriman dan penyaluran pangan ke penerima manfaat
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              id="recent-activity-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari penerima/pangan..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="TERJADWAL">Terjadwal</option>
            <option value="DIKIRIM">Dikirim</option>
            <option value="DITERIMA">Diterima</option>
          </select>
        </div>
      </div>

      {/* Activity Table */}
      <div className="overflow-x-auto max-h-[310px] overflow-y-auto pr-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="pb-3 pl-1">Penerima & Makanan</th>
              <th className="pb-3">Jadwal / Tanggal</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right pr-1">Total Item</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  Belum ada aktivitas distribusi yang sesuai filter
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 pl-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <Link
                          href={`/distribusi/riwayat/${item.id}`}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                        >
                          {item.recipientName}
                        </Link>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {item.itemsSummary}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{new Date(item.scheduledDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </td>
                  <td className="py-3.5">{getStatusBadge(item.status)}</td>
                  <td className="py-3.5 text-right pr-1 font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {item.totalQuantity.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <Link
          href="/distribusi"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:gap-2 transition-all"
        >
          <span>Lihat Semua Distribusi</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
