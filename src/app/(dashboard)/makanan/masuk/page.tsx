'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, ShieldAlert, Clock } from 'lucide-react';
import { EXPIRY_SHORTCUTS, calculateExpiryPreset } from '@/lib/quick-wins-utils';

export default function InboundFoodPage() {
  const [donors, setDonors] = useState<{ id: string; name: string }[]>([]);
  const [donorId, setDonorId] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('porsi');
  const [expiryAt, setExpiryAt] = useState('');
  const [notes, setNotes] = useState('');

  // Physical Checklist States
  const [packagingIntact, setPackagingIntact] = useState(true);
  const [temperatureSafe, setTemperatureSafe] = useState(true);
  const [visualSmellOk, setVisualSmellOk] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/donors')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((res) => {
        setDonors(res.data || []);
        if (res.data?.length > 0) setDonorId(res.data[0].id);
      })
      .catch(() => setDonors([]));
  }, []);

  const isAccepted = packagingIntact && temperatureSafe && visualSmellOk;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/food/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId,
          name,
          quantity: parseFloat(quantity),
          unit,
          expiryAt: new Date(expiryAt).toISOString(),
          packagingIntact,
          temperatureSafe,
          visualSmellOk,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan penerimaan makanan');
      }

      setMessage({
        text: isAccepted
          ? 'Makanan berhasil diterima dan masuk ke stok FEFO!'
          : 'Makanan dicatat sebagai DITOLAK (Kondisi tidak layak fisik). Sisa stok diset ke 0.',
        type: isAccepted ? 'success' : 'error',
      });

      // Reset form
      setName('');
      setQuantity('');
      setExpiryAt('');
      setNotes('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ text: err.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Catat Penerimaan Makanan Masuk</h1>
        <p className="text-sm text-slate-500">
          Setiap makanan yang masuk wajib melalui 3 pos uji fisik keselamatan pangan (US-08).
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Donatur</label>
            <select
              value={donorId}
              onChange={(e) => setDonorId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            >
              {donors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Makanan</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Roti Manis, Nasi Kotak"
              required
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah</label>
            <input
              type="number"
              step="any"
              min="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="50"
              required
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Satuan</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            >
              <option value="porsi">Porsi</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="kotak">Kotak</option>
              <option value="buah">Buah</option>
              <option value="liter">Liter</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Batas Kedaluwarsa</label>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Shortcut Cepat
              </span>
            </div>
            <input
              type="datetime-local"
              value={expiryAt}
              onChange={(e) => setExpiryAt(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            />
            {/* Quick Expiry Shortcuts for Field Volunteers */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 mr-1">Pintas Jam:</span>
              {EXPIRY_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.id}
                  type="button"
                  onClick={() => setExpiryAt(calculateExpiryPreset(shortcut.hours))}
                  title={shortcut.description}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors active:scale-95 text-slate-700 shadow-sm"
                >
                  <span>{shortcut.label}</span>
                  {shortcut.sublabel && (
                    <span className="text-[10px] text-slate-400 hidden sm:inline">({shortcut.sublabel})</span>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              ⚡ Tombol pintas: <strong>+4 Jam</strong> (bersantan/cepat basi), <strong>+8 Jam</strong> (siang ke malam), <strong>Besok Pagi (+24 Jam)</strong>, <strong>+3 Hari</strong> (makanan awet).
            </p>
          </div>
        </div>

        {/* Physical Inspection Checklist */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            Checklist Uji Fisik Keselamatan Pangan
          </h3>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={packagingIntact}
                onChange={(e) => setPackagingIntact(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-sm text-slate-700">1. Kemasan Utuh (Tidak robek/bocor/kembung)</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={temperatureSafe}
                onChange={(e) => setTemperatureSafe(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-sm text-slate-700">2. Suhu Aman (Sesuai kategori pangan segar/hangat/dingin)</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={visualSmellOk}
                onChange={(e) => setVisualSmellOk(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-sm text-slate-700">3. Kondisi Visual & Aroma Segar (Tidak berjamur/asam/tengik)</span>
            </label>
          </div>

          <div className="mt-3 p-3 rounded-lg bg-slate-50 flex items-center justify-between text-sm">
            <span>Status Verifikasi Fisik:</span>
            {isAccepted ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <Check className="w-4 h-4" /> DITERIMA (Lolos Uji Fisik)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                <X className="w-4 h-4" /> DITOLAK (Tidak Layak Konsumsi)
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Catatan kondisi spesifik..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Penerimaan Makanan'}
        </button>
      </form>
    </div>
  );
}

