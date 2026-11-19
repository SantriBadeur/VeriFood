'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface StockItem {
  id: string;
  name: string;
  remainingQuantity: number;
  unit: string;
  expiryAt: string;
  evaluation: { label: string; badge: string; canDistribute: boolean };
}

interface Beneficiary {
  id: string;
  name: string;
  capacity?: number | null;
}

export default function CreateDistributionPage() {
  const router = useRouter();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [stockList, setStockList] = useState<StockItem[]>([]);

  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ foodStockId: string; quantity: string }[]>([]);
  const [forceBypassCapacity, setForceBypassCapacity] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedBeneficiary = beneficiaries.find((b) => b.id === beneficiaryId);
  const totalAllocated = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  const isOverCapacity = Boolean(
    selectedBeneficiary?.capacity &&
      selectedBeneficiary.capacity > 0 &&
      totalAllocated > selectedBeneficiary.capacity
  );

  useEffect(() => {
    // Load beneficiaries
    fetch('/api/beneficiaries')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((res) => {
        setBeneficiaries(res.data || []);
        if (res.data?.length > 0) setBeneficiaryId(res.data[0].id);
      });

    // Load available FEFO stock
    fetch('/api/food/fefo')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setStockList(data);
        if (data.length > 0) {
          setItems([{ foodStockId: data[0].id, quantity: '1' }]);
        }
      });
  }, []);

  const addItemRow = () => {
    if (stockList.length === 0) return;
    setItems([...items, { foodStockId: stockList[0].id, quantity: '1' }]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: 'foodStockId' | 'quantity', value: string) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (items.length === 0) {
      setError('Pilih minimal satu jenis makanan.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId,
          scheduledDate: new Date(scheduledDate).toISOString(),
          notes,
          forceBypassCapacity,
          items: items.map((i) => ({
            foodStockId: i.foodStockId,
            quantity: parseFloat(i.quantity),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menjadwalkan distribusi');

      router.push('/distribusi');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/distribusi" className="p-2 border rounded-lg hover:bg-slate-50 text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jadwalkan Distribusi Makanan</h1>
          <p className="text-sm text-slate-500">
            Pilih penerima manfaat dan alokasikan paket makanan dari stok FEFO.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Penerima Manfaat</label>
              {selectedBeneficiary && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {selectedBeneficiary.capacity
                    ? `Kapasitas: ${selectedBeneficiary.capacity} porsi`
                    : 'Kapasitas: Tanpa Batas'}
                </span>
              )}
            </div>
            <select
              value={beneficiaryId}
              onChange={(e) => setBeneficiaryId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            >
              {beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.capacity ? `(Kapasitas: ${b.capacity})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal & Waktu Distribusi</label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            />
          </div>
        </div>

        {/* Multi-Item Selector */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Daftar Makanan (FEFO Picker)</h3>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Item Makanan
            </button>
          </div>

          <div className="space-y-3">
            {items.map((row, idx) => {
              const selectedStock = stockList.find((s) => s.id === row.foodStockId);
              return (
                <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <select
                      value={row.foodStockId}
                      onChange={(e) => updateItemRow(idx, 'foodStockId', e.target.value)}
                      className="w-full rounded-md border border-slate-300 p-2 text-sm bg-white"
                    >
                      {stockList.map((stock) => (
                        <option
                          key={stock.id}
                          value={stock.id}
                          disabled={!stock.evaluation.canDistribute}
                        >
                          {stock.name} - Sisa: {stock.remainingQuantity} {stock.unit} ({stock.evaluation.label})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        max={selectedStock?.remainingQuantity}
                        value={row.quantity}
                        onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                        placeholder="Jumlah"
                        required
                        className="w-full rounded-md border border-slate-300 p-2 text-sm bg-white"
                      />
                      <span className="text-xs text-slate-500">{selectedStock?.unit}</span>
                    </div>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Logistik</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Instruksi pengantaran khusus..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
          />
        </div>

        {isOverCapacity && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-sm text-amber-900">
            <div className="font-semibold flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Peringatan: Alokasi ({totalAllocated} porsi) Melebihi Kapasitas ({selectedBeneficiary?.capacity} porsi)
              </span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Penerima manfaat ini tercatat memiliki kapasitas maksimum {selectedBeneficiary?.capacity} porsi. Alokasi melebihi kapasitas dapat menyebabkan makanan terbuang percuma apabila tidak habis dikonsumsi.
            </p>
            <label className="flex items-start sm:items-center gap-2 text-xs font-semibold text-amber-950 cursor-pointer pt-1 bg-amber-100/60 p-2.5 rounded-lg border border-amber-200">
              <input
                type="checkbox"
                checked={forceBypassCapacity}
                onChange={(e) => setForceBypassCapacity(e.target.checked)}
                className="rounded mt-0.5 sm:mt-0 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Saya menyetujui alokasi melebihi kapasitas untuk kebutuhan bantuan darurat (Bypass Kuota).</span>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (isOverCapacity && !forceBypassCapacity)}
          className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {loading
            ? 'Menyimpan...'
            : isOverCapacity && !forceBypassCapacity
            ? 'Konfirmasi Bypass Diperlukan'
            : 'Jadwalkan Distribusi'}
        </button>
      </form>
    </div>
  );
}

