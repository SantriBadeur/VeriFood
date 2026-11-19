'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, ShieldAlert, Clock, Plus, Trash2, Layers, FileText } from 'lucide-react';
import { EXPIRY_SHORTCUTS, calculateExpiryPreset } from '@/lib/quick-wins-utils';

interface BatchRow {
  name: string;
  quantity: string;
  unit: string;
  expiryAt: string;
  packagingIntact: boolean;
  temperatureSafe: boolean;
  visualSmellOk: boolean;
  notes: string;
}

export default function InboundFoodPage() {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [donors, setDonors] = useState<{ id: string; name: string }[]>([]);
  const [donorId, setDonorId] = useState('');

  // Single Item States
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('porsi');
  const [expiryAt, setExpiryAt] = useState('');
  const [notes, setNotes] = useState('');
  const [packagingIntact, setPackagingIntact] = useState(true);
  const [temperatureSafe, setTemperatureSafe] = useState(true);
  const [visualSmellOk, setVisualSmellOk] = useState(true);

  // Batch Inbound States
  const [batchItems, setBatchItems] = useState<BatchRow[]>([
    {
      name: '',
      quantity: '',
      unit: 'porsi',
      expiryAt: '',
      packagingIntact: true,
      temperatureSafe: true,
      visualSmellOk: true,
      notes: '',
    },
  ]);

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

  // Single Item Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
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

  // Batch Items Methods
  const addBatchRow = () => {
    setBatchItems([
      ...batchItems,
      {
        name: '',
        quantity: '',
        unit: 'porsi',
        expiryAt: '',
        packagingIntact: true,
        temperatureSafe: true,
        visualSmellOk: true,
        notes: '',
      },
    ]);
  };

  const removeBatchRow = (index: number) => {
    if (batchItems.length <= 1) return;
    setBatchItems(batchItems.filter((_, i) => i !== index));
  };

  const updateBatchRow = <K extends keyof BatchRow>(index: number, field: K, value: BatchRow[K]) => {
    const next = [...batchItems];
    next[index][field] = value;
    setBatchItems(next);
  };

  const applyPresetToRow = (index: number, hours: number) => {
    updateBatchRow(index, 'expiryAt', calculateExpiryPreset(hours));
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      if (!item.name.trim()) {
        setMessage({ text: `Baris ke-${i + 1}: Nama makanan wajib diisi.`, type: 'error' });
        setLoading(false);
        return;
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        setMessage({ text: `Baris ke-${i + 1}: Jumlah untuk "${item.name}" harus lebih dari 0.`, type: 'error' });
        setLoading(false);
        return;
      }
      if (!item.expiryAt) {
        setMessage({ text: `Baris ke-${i + 1}: Batas kedaluwarsa untuk "${item.name}" wajib diisi.`, type: 'error' });
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/food/inbound/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId,
          items: batchItems.map((b) => ({
            name: b.name.trim(),
            quantity: parseFloat(b.quantity),
            unit: b.unit,
            expiryAt: new Date(b.expiryAt).toISOString(),
            packagingIntact: b.packagingIntact,
            temperatureSafe: b.temperatureSafe,
            visualSmellOk: b.visualSmellOk,
            notes: b.notes,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan batch makanan masuk');

      setMessage({
        text: `Berhasil mencatat ${data.count || batchItems.length} menu makanan masuk sekaligus ke sistem!`,
        type: 'success',
      });

      // Reset batch items
      setBatchItems([
        {
          name: '',
          quantity: '',
          unit: 'porsi',
          expiryAt: '',
          packagingIntact: true,
          temperatureSafe: true,
          visualSmellOk: true,
          notes: '',
        },
      ]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ text: err.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catat Penerimaan Makanan Masuk</h1>
          <p className="text-sm text-slate-500">
            Setiap makanan yang masuk wajib melalui 3 pos uji fisik keselamatan pangan (US-08).
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'single'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Satu Jenis</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'batch'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch Sekaligus (Katering)</span>
          </button>
        </div>
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

      {mode === 'single' ? (
        /* SINGLE ITEM INTAKE FORM */
        <form onSubmit={handleSingleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
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
      ) : (
        /* MULTI-ITEM BATCH INBOUND FORM */
        <form onSubmit={handleBatchSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
            <Layers className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-900">Mode Batch Inbound Donatur</h3>
              <p className="text-xs text-emerald-700">
                Input 3–5 menu makanan berbeda dari 1 katering/restoran sekaligus dalam satu kali simpan.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Donatur Katering/Resto</label>
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

          {/* Dynamic Item Rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-slate-800">Daftar Menu Makanan ({batchItems.length} Jenis)</h3>
              <button
                type="button"
                onClick={addBatchRow}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Baris Menu
              </button>
            </div>

            {batchItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                    Menu #{idx + 1}
                  </span>
                  {batchItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBatchRow(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Hapus baris menu ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nama Makanan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rendang Daging, Sayur Sop"
                      value={item.name}
                      onChange={(e) => updateBatchRow(idx, 'name', e.target.value)}
                      className="w-full p-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      placeholder="25"
                      value={item.quantity}
                      onChange={(e) => updateBatchRow(idx, 'quantity', e.target.value)}
                      className="w-full p-2 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Satuan</label>
                    <select
                      value={item.unit}
                      onChange={(e) => updateBatchRow(idx, 'unit', e.target.value)}
                      className="w-full p-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="porsi">Porsi</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="kotak">Kotak</option>
                      <option value="buah">Buah</option>
                      <option value="liter">Liter</option>
                    </select>
                  </div>
                </div>

                {/* Expiry with quick preset shortcuts */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <label className="block text-xs font-medium text-slate-700">Batas Kedaluwarsa</label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-medium">Preset Cepat:</span>
                      <button
                        type="button"
                        onClick={() => applyPresetToRow(idx, 4)}
                        className="px-2 py-0.5 text-[10px] font-medium rounded bg-white border hover:bg-emerald-50 hover:text-emerald-700"
                        title="+4 Jam (cepat basi / santan)"
                      >
                        +4 Jam
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetToRow(idx, 8)}
                        className="px-2 py-0.5 text-[10px] font-medium rounded bg-white border hover:bg-emerald-50 hover:text-emerald-700"
                        title="+8 Jam (siang ke malam)"
                      >
                        +8 Jam
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetToRow(idx, 12)}
                        className="px-2 py-0.5 text-[10px] font-medium rounded bg-white border hover:bg-emerald-50 hover:text-emerald-700"
                        title="+12 Jam (malam ke pagi)"
                      >
                        +12 Jam
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetToRow(idx, 24)}
                        className="px-2 py-0.5 text-[10px] font-medium rounded bg-white border hover:bg-emerald-50 hover:text-emerald-700"
                        title="Besok Pagi (+24 Jam)"
                      >
                        Besok (+24 Jam)
                      </button>
                    </div>
                  </div>
                  <input
                    type="datetime-local"
                    required
                    value={item.expiryAt}
                    onChange={(e) => updateBatchRow(idx, 'expiryAt', e.target.value)}
                    className="w-full p-2 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                {/* Physical checklist mini toggles */}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-600">Uji Fisik:</span>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.packagingIntact}
                      onChange={(e) => updateBatchRow(idx, 'packagingIntact', e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>Kemasan Utuh</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.temperatureSafe}
                      onChange={(e) => updateBatchRow(idx, 'temperatureSafe', e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>Suhu Aman</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.visualSmellOk}
                      onChange={(e) => updateBatchRow(idx, 'visualSmellOk', e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>Aroma Segar</span>
                  </label>
                  <span
                    className={`ml-auto font-medium text-[11px] px-2 py-0.5 rounded ${
                      item.packagingIntact && item.temperatureSafe && item.visualSmellOk
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.packagingIntact && item.temperatureSafe && item.visualSmellOk
                      ? 'Lolos Uji'
                      : 'Ditolak (Fisik Tidak Layak)'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={addBatchRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg"
            >
              <Plus className="w-4 h-4" /> Tambah Baris Makanan Lain
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Menyimpan Batch...' : `Simpan Semua Makanan Masuk (${batchItems.length} Item)`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
