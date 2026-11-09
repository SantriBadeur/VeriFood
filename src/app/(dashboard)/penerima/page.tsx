'use client';

import React, { useState, useEffect } from 'react';
import { Users2, Plus, Search, Trash2 } from 'lucide-react';

interface Beneficiary {
  id: string;
  name: string;
  type: string;
  contact: string;
  address: string;
}

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal (Admin only)
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('PANTI_ASUHAN');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');

  const loadData = () => {
    fetch(`/api/beneficiaries?search=${encodeURIComponent(search)}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((res) => setBeneficiaries(res.data || []))
      .catch(() => setBeneficiaries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, contact, address }),
      });

      if (!res.ok) throw new Error('Hanya Admin yang dapat mengelola data penerima');

      setShowModal(false);
      setName('');
      setContact('');
      setAddress('');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus penerima ini?')) return;
    try {
      const res = await fetch(`/api/beneficiaries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Hanya Admin yang dapat mengelola data penerima');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Direktori Penerima Manfaat</h1>
          <p className="text-sm text-slate-500">
            Daftar yayasan, panti asuhan, dan kelompok prasejahtera penerima bantuan makanan.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" /> Tambah Penerima
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari penerima, kontak, alamat..."
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Nama Penerima</th>
                <th className="px-6 py-3.5">Kategori</th>
                <th className="px-6 py-3.5">Kontak</th>
                <th className="px-6 py-3.5">Alamat</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Memuat penerima...
                  </td>
                </tr>
              ) : beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Tidak ditemukan data penerima manfaat.
                  </td>
                </tr>
              ) : (
                beneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{b.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {b.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">{b.contact}</td>
                    <td className="px-6 py-4 text-slate-500">{b.address}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Penerima Manfaat</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Yayasan/Komunitas</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm"
              >
                <option value="PANTI_ASUHAN">Panti Asuhan</option>
                <option value="KOMUNITAS">Komunitas</option>
                <option value="KELUARGA_PRASEJAHTERA">Keluarga Prasejahtera</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kontak Pengurus</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={2}
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Simpan Penerima
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

