'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, CheckCircle2, XCircle, Plus, Calendar, UserCheck } from 'lucide-react';
import { useCurrentUser } from '@/lib/user-context';

interface Distribution {
  id: string;
  status: 'TERJADWAL' | 'DIKIRIM' | 'DITERIMA' | 'DIBATALKAN';
  scheduledDate: string;
  beneficiary: { name: string; address: string };
  items: { id: string; quantity: number; foodStock: { name: string; unit: string } }[];
  createdByUserId: string;
  createdByUser?: { name: string; role: string };
  assignedToUserId?: string | null;
  assignedToUser?: { name: string };
  dispatchedByUser?: { name: string };
  deliveredByUser?: { name: string };
}

export default function DistributionListPage() {
  const currentUser = useCurrentUser();
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my-tasks'>('all');

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

  const myTasksCount = distributions.filter(
    (dist) =>
      currentUser &&
      (dist.assignedToUserId === currentUser.id || dist.createdByUserId === currentUser.id)
  ).length;

  const displayedDistributions =
    activeTab === 'my-tasks'
      ? distributions.filter(
          (dist) =>
            currentUser &&
            (dist.assignedToUserId === currentUser.id || dist.createdByUserId === currentUser.id)
        )
      : distributions;

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

      {/* Filter Tabs: Semua Distribusi vs Tugas Saya */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Semua Distribusi</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
            {distributions.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('my-tasks')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'my-tasks'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Tugas Saya</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              myTasksCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {myTasksCount}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Memuat daftar distribusi...
          </div>
        ) : displayedDistributions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            {activeTab === 'my-tasks'
              ? 'Belum ada tugas distribusi yang ditugaskan ke Anda atau dibuat oleh Anda.'
              : 'Belum ada jadwal distribusi aktif.'}
          </div>
        ) : (
          displayedDistributions.map((dist) => (
            <div
              key={dist.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center flex-wrap gap-2">
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

                  {/* Personal assignment badges */}
                  {currentUser && dist.assignedToUserId === currentUser.id && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <UserCheck className="w-3 h-3" /> Tugas Anda
                    </span>
                  )}
                  {currentUser && dist.createdByUserId === currentUser.id && dist.assignedToUserId !== currentUser.id && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Dibuat oleh Anda
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">{dist.beneficiary.name}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-slate-500">{dist.beneficiary.address}</p>
                  {dist.beneficiary?.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dist.beneficiary.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      📍 Buka di Google Maps
                    </a>
                  )}
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Daftar Makanan: </span>
                  {dist.items.map((i) => `${i.foodStock.name} (${i.quantity} ${i.foodStock.unit})`).join(', ')}
                </div>

                <div className="text-[11px] text-slate-400 flex flex-wrap gap-4">
                  {dist.assignedToUser && (
                    <span>Petugas: <strong className="font-medium text-slate-600">{dist.assignedToUser.name}</strong></span>
                  )}
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

