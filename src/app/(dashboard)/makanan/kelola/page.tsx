'use client';

import React, { useState, useEffect } from 'react';
import { AlertOctagon, Edit3, Trash2, FileText, Tag } from 'lucide-react';
import ShelfLabelModal from '@/components/ShelfLabelModal';

interface InventoryItem {
  id: string;
  name: string;
  donorId?: string;
  notes?: string | null;
  initialQuantity: number;
  remainingQuantity: number;
  unit: string;
  expiryAt: string;
  physicalStatus: string;
  isDisposed: boolean;
  donor: { id?: string; name: string };
  evaluation: { label: string; badge: string; canDistribute: boolean };
}

interface DonorOption {
  id: string;
  name: string;
}

export default function StockManagePage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Correction Modal
  const [correctItem, setCorrectItem] = useState<InventoryItem | null>(null);
  const [newInitialQty, setNewInitialQty] = useState('');
  const [correctError, setCorrectError] = useState('');

  // Disposal Modal
  const [disposeItem, setDisposeItem] = useState<InventoryItem | null>(null);
  const [disposalReason, setDisposalReason] = useState('Kedaluwarsa di gudang');
  const [disposeQty, setDisposeQty] = useState('');
  const [disposeError, setDisposeError] = useState('');

  // Metadata Edit Modal
  const [donors, setDonors] = useState<DonorOption[]>([]);
  const [editMetaItem, setEditMetaItem] = useState<InventoryItem | null>(null);
  const [metaName, setMetaName] = useState('');
  const [metaDonorId, setMetaDonorId] = useState('');
  const [metaExpiry, setMetaExpiry] = useState('');
  const [metaNotes, setMetaNotes] = useState('');
  const [metaError, setMetaError] = useState('');

  // Shelf Label Printing Modal
  const [shelfLabelItem, setShelfLabelItem] = useState<InventoryItem | null>(null);

  const loadData = () => {
    fetch('/api/food/fefo')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

    fetch('/api/donors')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((res) => setDonors(res.data || []))
      .catch(() => setDonors([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCorrect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctItem) return;
    setCorrectError('');

    try {
      const res = await fetch('/api/food/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockId: correctItem.id,
          newInitialQty: parseFloat(newInitialQty),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal koreksi stok');

      setCorrectItem(null);
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) setCorrectError(err.message);
    }
  };

  const handleDispose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposeItem) return;
    setDisposeError('');

    const parsedQty = parseFloat(disposeQty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setDisposeError('Jumlah yang dibuang harus lebih dari 0');
      return;
    }

    if (parsedQty > disposeItem.remainingQuantity) {
      setDisposeError(`Jumlah tidak boleh melebihi sisa stok (${disposeItem.remainingQuantity} ${disposeItem.unit})`);
      return;
    }

    try {
      const res = await fetch('/api/food/dispose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockId: disposeItem.id,
          reason: disposalReason,
          quantity: parsedQty,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat pembuangan');

      setDisposeItem(null);
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) setDisposeError(err.message);
      else setDisposeError('Terjadi kesalahan');
    }
  };

  const openEditMeta = (item: InventoryItem) => {
    setEditMetaItem(item);
    setMetaName(item.name);
    setMetaDonorId(item.donorId || item.donor?.id || '');
    try {
      const d = new Date(item.expiryAt);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setMetaExpiry(localIso);
    } catch {
      setMetaExpiry('');
    }
    setMetaNotes(item.notes || '');
    setMetaError('');
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMetaItem) return;
    setMetaError('');

    try {
      const res = await fetch(`/api/food/${editMetaItem.id}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metaName,
          donorId: metaDonorId || undefined,
          expiryAt: metaExpiry ? new Date(metaExpiry).toISOString() : undefined,
          notes: metaNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan perubahan metadata');

      setEditMetaItem(null);
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) setMetaError(err.message);
      else setMetaError('Terjadi kesalahan');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kelola Stok & Catat Pembuangan</h1>
        <p className="text-sm text-slate-500">
          Koreksi stok awal (Admin) dan catat pembuangan makanan rusak/expired (US-09, US-12).
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Mobile Card Stack (< 768px) */}
        <div className="block md:hidden divide-y divide-slate-200">
          {loading ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              Memuat stok...
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              Tidak ada stok aktif.
            </div>
          ) : (
            items.map((item) => {
              const totalDisalurkan = item.initialQuantity - item.remainingQuantity;
              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-normal mt-0.5">
                        {item.donor.name}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {item.evaluation.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Stok Awal:</span>
                      <span className="font-medium text-slate-700">
                        {item.initialQuantity} {item.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Tersalur: {totalDisalurkan} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Sisa Stok:</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {item.remainingQuantity} {item.unit}
                      </span>
                    </div>
                  </div>

                  {/* 4 Action Buttons in a Touch-Friendly Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShelfLabelItem(item)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-medium text-emerald-800 hover:bg-emerald-100 active:scale-[0.98] transition min-h-[40px]"
                      title="Cetak label stiker wadah gudang"
                    >
                      <Tag className="w-3.5 h-3.5" /> Cetak Label
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditMeta(item)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition min-h-[40px]"
                    >
                      <FileText className="w-3.5 h-3.5" /> Edit Info
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCorrectItem(item);
                        setNewInitialQty(item.initialQuantity.toString());
                        setCorrectError('');
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition min-h-[40px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Koreksi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDisposeItem(item);
                        setDisposeQty(item.remainingQuantity.toString());
                        setDisposeError('');
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50/50 text-xs font-medium text-red-600 hover:bg-red-50 active:scale-[0.98] transition min-h-[40px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Buang
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Makanan</th>
                <th className="px-6 py-3.5">Stok Awal</th>
                <th className="px-6 py-3.5">Sisa Stok</th>
                <th className="px-6 py-3.5">Status FEFO</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Memuat stok...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada stok aktif.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const totalDisalurkan = item.initialQuantity - item.remainingQuantity;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {item.name}
                        <div className="text-xs text-slate-400 font-normal">{item.donor.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        {item.initialQuantity} {item.unit}
                        <div className="text-xs text-slate-400">Tersalur: {totalDisalurkan} {item.unit}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {item.remainingQuantity} {item.unit}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {item.evaluation.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setShelfLabelItem(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition"
                          title="Cetak label stiker wadah gudang"
                        >
                          <Tag className="w-3.5 h-3.5" /> Cetak Label
                        </button>
                        <button
                          onClick={() => openEditMeta(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <FileText className="w-3.5 h-3.5" /> Edit Info
                        </button>
                        <button
                          onClick={() => {
                            setCorrectItem(item);
                            setNewInitialQty(item.initialQuantity.toString());
                            setCorrectError('');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Koreksi
                        </button>
                        <button
                          onClick={() => {
                            setDisposeItem(item);
                            setDisposeQty(item.remainingQuantity.toString());
                            setDisposeError('');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Buang
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Koreksi */}
      {correctItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCorrect} className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Koreksi Stok Awal</h3>
            <p className="text-xs text-slate-500">
              Sudah tersalurkan: {correctItem.initialQuantity - correctItem.remainingQuantity} {correctItem.unit}.
              Jumlah baru tidak boleh lebih rendah dari jumlah ini.
            </p>

            {correctError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {correctError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stok Awal Baru</label>
              <input
                type="number"
                step="any"
                value={newInitialQty}
                onChange={(e) => setNewInitialQty(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 p-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCorrectItem(null)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Pembuangan */}
      {disposeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleDispose} className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" /> Catat Pembuangan Makanan
            </h3>
            <p className="text-xs text-slate-600">
              Pencatatan pembuangan makanan rusak/kedaluwarsa untuk <strong>{disposeItem.name}</strong> ({disposeItem.donor.name}).
            </p>

            {disposeError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {disposeError}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Berapa jumlah yang ingin dibuang?
                </label>
                <button
                  type="button"
                  onClick={() => setDisposeQty(disposeItem.remainingQuantity.toString())}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                >
                  Buang Semua ({disposeItem.remainingQuantity} {disposeItem.unit})
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  max={disposeItem.remainingQuantity}
                  value={disposeQty}
                  onChange={(e) => setDisposeQty(e.target.value)}
                  required
                  placeholder={`Maks ${disposeItem.remainingQuantity}`}
                  className="w-full rounded-lg border border-slate-300 p-2 pr-16 text-sm"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">
                  {disposeItem.unit}
                </span>
              </div>
              {parseFloat(disposeQty) > 0 && parseFloat(disposeQty) <= disposeItem.remainingQuantity && (
                <div className="mt-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {parseFloat(disposeQty) === disposeItem.remainingQuantity ? (
                    <span className="text-amber-700 font-medium">
                      ⚠️ 100% sisa stok dibuang. Batch ini akan selesai/ditutup.
                    </span>
                  ) : (
                    <span>
                      Sisa stok setelah dibuang: <strong>{(disposeItem.remainingQuantity - parseFloat(disposeQty)).toFixed(1).replace(/\.0$/, '')} {disposeItem.unit}</strong> (tetap tersedia di FEFO).
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alasan Pembuangan</label>
              <textarea
                value={disposalReason}
                onChange={(e) => setDisposalReason(e.target.value)}
                required
                rows={2}
                placeholder="Contoh: 5 porsi basi/rusak terkena hujan"
                className="w-full rounded-lg border border-slate-300 p-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDisposeItem(null)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Konfirmasi Buang
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Edit Metadata */}
      {editMetaItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveMetadata} className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" /> Koreksi Metadata Makanan
            </h3>
            <p className="text-xs text-slate-500">
              Koreksi kesalahan ketik nama makanan, asal donatur, atau tanggal kedaluwarsa. Perubahan ini akan dicatat dalam riwayat audit sistem.
            </p>

            {metaError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {metaError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Makanan</label>
              <input
                type="text"
                value={metaName}
                onChange={(e) => setMetaName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Donatur Asal</label>
              <select
                value={metaDonorId}
                onChange={(e) => setMetaDonorId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- Tetap Gunakan Donatur Sebelumnya --</option>
                {donors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Kedaluwarsa</label>
              <input
                type="datetime-local"
                value={metaExpiry}
                onChange={(e) => setMetaExpiry(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan / Alasan Koreksi</label>
              <textarea
                value={metaNotes}
                onChange={(e) => setMetaNotes(e.target.value)}
                rows={2}
                placeholder="Misal: Koreksi salah pilih donatur saat input terburu-buru"
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditMetaItem(null)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shelf Label Modal */}
      {shelfLabelItem && (
        <ShelfLabelModal
          isOpen={Boolean(shelfLabelItem)}
          onClose={() => setShelfLabelItem(null)}
          food={shelfLabelItem}
        />
      )}
    </div>
  );
}

