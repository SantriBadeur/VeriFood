'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, CheckCircle2, XCircle, Plus, Calendar } from 'lucide-react';

interface Distribution {
  id: string;
  status: 'TERJADWAL' | 'DIKIRIM' | 'DITERIMA' | 'DIBATALKAN';
  scheduledDate: string;
  beneficiary: { name: string; address: string };
  items: { id: string; quantity: number; foodStock: { name: string; unit: string } }[];
  assignedToUser?: { name: string };
  dispatchedByUser?: { name: string };
  deliveredByUser?: { name: string };
}

export default function DistributionListPage() {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetch('/api/distributions')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((res) => setDistributions(res.data || []))
      .catch(() => setDistributions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Konfirmasi ubah status distribusi menjadi ${newStatus}?`)) return;

    try {
      const res = await fetch(`/api/distributions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status');

      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Distribusi Makanan</h1>
          <p className="text-sm text-slate-500">
            Kelola alur penyaluran makanan ke penerima manfaat (US-15).
          </p>
        </div>
        <Link
          href="/distribusi/buat"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" /> Buat Jadwal Baru
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Memuat daftar distribusi...
          </div>
        ) : distributions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Belum ada jadwal distribusi aktif.
          </div>
        ) : (
          distributions.map((dist) => (
            <div
              key={dist.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      dist.status === 'TERJADWAL'
                        ? 'bg-blue-100 text-blue-800'
                        : dist.status === 'DIKIRIM'
                        ? 'bg-amber-100 text-amber-800'
                        : dist.status === 'DITERIMA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {dist.status}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(dist.scheduledDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{dist.beneficiary.name}</h3>
                <p className="text-xs text-slate-500">{dist.beneficiary.address}</p>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Daftar Makanan: </span>
                  {dist.items.map((i) => `${i.foodStock.name} (${i.quantity} ${i.foodStock.unit})`).join(', ')}
                </div>

                <div className="text-[11px] text-slate-400 flex gap-4">
                  {dist.dispatchedByUser && <span>Dikirim oleh: {dist.dispatchedByUser.name}</span>}
                  {dist.deliveredByUser && <span>Diterima via: {dist.deliveredByUser.name}</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {dist.status === 'TERJADWAL' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(dist.id, 'DIKIRIM')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold"
                    >
                      <Truck className="w-3.5 h-3.5" /> Kirim Logistik
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(dist.id, 'DIBATALKAN')}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Batalkan
                    </button>
                  </>
                )}

                {dist.status === 'DIKIRIM' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(dist.id, 'DITERIMA')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi Diterima
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(dist.id, 'DIBATALKAN')}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Batalkan & Rollback Stok
                    </button>
                  </>
                )}

                {(dist.status === 'DITERIMA' || dist.status === 'DIBATALKAN') && (
                  <span className="text-xs text-slate-400 italic">Siklus selesai</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

