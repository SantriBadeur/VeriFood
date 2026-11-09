'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, Package, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface HistoryItem {
  id: string;
  status: string;
  scheduledDate: string;
  createdByUser: { name: string };
  dispatchedByUser?: { name: string };
  deliveredByUser?: { name: string };
  items: { id: string; quantity: number; foodStock: { name: string; unit: string } }[];
}

export default function BeneficiaryDistributionHistoryPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/distributions/history/${id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setHistory(data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/penerima" className="p-2 border rounded-lg hover:bg-slate-50 text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Penyaluran Makanan (US-16)</h1>
          <p className="text-sm text-slate-500">
            Daftar lengkap alokasi dan status logistik yang pernah dikirim ke penerima manfaat ini.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat riwayat distribusi...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Belum ada riwayat distribusi untuk penerima manfaat ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {history.map((item) => (
              <div key={item.id} className="p-5 hover:bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === 'DITERIMA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'DIKIRIM'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'TERJADWAL'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.scheduledDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                  <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" /> Logistik Makanan:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs pl-2">
                    {item.items.map((it) => (
                      <li key={it.id}>
                        {it.foodStock.name}: <span className="font-semibold">{it.quantity} {it.foodStock.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-xs text-slate-400 flex flex-wrap gap-4 pt-1">
                  <span>Dijadwalkan oleh: {item.createdByUser.name}</span>
                  {item.dispatchedByUser && <span>Dikirim oleh: {item.dispatchedByUser.name}</span>}
                  {item.deliveredByUser && <span>Diterima via: {item.deliveredByUser.name}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
