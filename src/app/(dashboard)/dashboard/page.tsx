'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">FEFO Real-Time Dashboard</h1>
        <p className="text-sm text-slate-500">
          Prioritas penyaluran stok makanan berdasarkan First Expired, First Out.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aman</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{countAman} Batch</h3>
            <p className="text-xs text-slate-400 mt-1">&gt; 24 jam tersisa</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mendekati Expired</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{countMendekati} Batch</h3>
            <p className="text-xs text-slate-400 mt-1">&le; 24 jam tersisa (Prioritaskan!)</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kedaluwarsa</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{countKedaluwarsa} Batch</h3>
            <p className="text-xs text-slate-400 mt-1">Harus segera dicatat pembuangan</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FEFO Prioritized Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-800">Antrean FEFO Makanan Masuk</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Nama Makanan</th>
                <th className="px-6 py-3.5">Donatur</th>
                <th className="px-6 py-3.5">Sisa Stok</th>
                <th className="px-6 py-3.5">Batas Kedaluwarsa</th>
                <th className="px-6 py-3.5">Status FEFO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Memuat data stok FEFO...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Belum ada stok makanan aktif di sistem.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4">{item.donor.name}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {item.remainingQuantity} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(item.expiryAt).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.evaluation.badge === 'green'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.evaluation.badge === 'yellow'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.evaluation.label}
                      </span>
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

