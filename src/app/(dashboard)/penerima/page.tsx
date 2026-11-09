'use client';

import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Search,
  Trash2,
  Edit2,
  Filter,
  Phone,
  MapPin,
  X,
  Lock,
  ShieldAlert,
} from 'lucide-react';

interface Beneficiary {
  id: string;
  name: string;
  type: 'PANTI_ASUHAN' | 'KOMUNITAS' | 'KELUARGA_PRASEJAHTERA';
  contact: string;
  address: string;
  createdAt: string;
}

const CATEGORIES = [
  { label: 'Semua Kategori', value: '' },
  { label: 'Panti Asuhan', value: 'PANTI_ASUHAN' },
  { label: 'Komunitas', value: 'KOMUNITAS' },
  { label: 'Keluarga Prasejahtera', value: 'KELUARGA_PRASEJAHTERA' },
];

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);

  // User RBAC Role
  const [userRole, setUserRole] = useState<'ADMIN' | 'RELAWAN' | null>(null);

  // Modal State (Admin only)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'PANTI_ASUHAN' | 'KOMUNITAS' | 'KELUARGA_PRASEJAHTERA'>(
    'PANTI_ASUHAN'
  );
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch current user session to determine RBAC
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role) {
          setUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  const loadData = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (selectedType) query.append('type', selectedType);

    fetch(`/api/beneficiaries?${query.toString()}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((res) => setBeneficiaries(res.data || []))
      .catch(() => setBeneficiaries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search, selectedType]);

  const openCreateModal = () => {
    if (userRole === 'RELAWAN') return;
    setModalMode('create');
    setSelectedId(null);
    setName('');
    setType('PANTI_ASUHAN');
    setContact('');
    setAddress('');
    setFormError('');
  };

  const openEditModal = (b: Beneficiary) => {
    if (userRole === 'RELAWAN') return;
    setModalMode('edit');
    setSelectedId(b.id);
    setName(b.name);
    setType(b.type);
    setContact(b.contact);
    setAddress(b.address);
    setFormError('');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedId(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/beneficiaries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, contact, address }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Hanya Admin yang dapat mengelola data penerima');
        }
      } else if (modalMode === 'edit' && selectedId) {
        const res = await fetch(`/api/beneficiaries/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, contact, address }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Hanya Admin yang dapat mengelola data penerima');
        }
      }

      closeModal();
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, benName: string) => {
    if (userRole === 'RELAWAN') return;
    if (!confirm(`Hapus penerima manfaat "${benName}"? Data akan disembunyikan.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/beneficiaries/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Hanya Admin yang dapat menghapus penerima');
      }
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus penerima');
    }
  };

  const isRelawan = userRole === 'RELAWAN';

  const formatCategory = (t: string) => {
    switch (t) {
      case 'PANTI_ASUHAN':
        return 'Panti Asuhan';
      case 'KOMUNITAS':
        return 'Komunitas';
      case 'KELUARGA_PRASEJAHTERA':
        return 'Keluarga Prasejahtera';
      default:
        return t;
    }
  };

  const getTypeBadgeClass = (t: string) => {
    switch (t) {
      case 'PANTI_ASUHAN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'KOMUNITAS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'KELUARGA_PRASEJAHTERA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Direktori Penerima Manfaat</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {beneficiaries.length} Penerima
            </span>
            {isRelawan && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                <Lock className="w-3 h-3" /> Mode Baca (Relawan)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Daftar yayasan, panti asuhan, dan keluarga prasejahtera sasaran distribusi makanan.
          </p>
        </div>

        {/* Action Button: Hidden for Relawan (US-06) */}
        {!isRelawan && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm w-fit"
          >
            <Plus className="w-4 h-4" /> Tambah Penerima
          </button>
        )}
      </div>

      {/* Relawan Read-Only Banner */}
      {isRelawan && (
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-800">
          <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Perhatian Relawan:</strong> Anda memiliki akses baca (read-only) untuk melihat
            data kontak dan alamat tujuan penyaluran. Pengubahan data master hanya dapat dilakukan oleh
            Administrator.
          </span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari yayasan, panti, kontak, alamat..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Reset
            </button>
          )}
        </div>

        {/* Quick Filter Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {CATEGORIES.map((cat) => {
            const active = selectedType === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedType(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Beneficiaries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Penerima Manfaat</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Kontak Penanggung Jawab</th>
                <th className="px-6 py-4">Alamat Penyaluran</th>
                {!isRelawan && <th className="px-6 py-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={isRelawan ? 4 : 5}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Memuat data penerima manfaat...
                  </td>
                </tr>
              ) : beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={isRelawan ? 4 : 5} className="px-6 py-12 text-center">
                    <Users2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">Tidak ada penerima manfaat yang sesuai</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba ubah kata kunci pencarian atau filter kategori.
                    </p>
                  </td>
                </tr>
              ) : (
                beneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{b.name}</div>
                      <div className="text-[11px] text-slate-400">ID: {b.id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getTypeBadgeClass(
                          b.type
                        )}`}
                      >
                        {formatCategory(b.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.contact}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5 text-slate-500 max-w-xs truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{b.address}</span>
                      </div>
                    </td>
                    {!isRelawan && (
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(b)}
                            title="Ubah Data Penerima"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id, b.name)}
                            title="Hapus Penerima (Soft Delete)"
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Ubah Penerima (Admin Only) */}
      {!isRelawan && modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {modalMode === 'create' ? 'Tambah Penerima Manfaat' : 'Ubah Data Penerima'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Nama Yayasan / Komunitas / Keluarga
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Panti Asuhan Kasih Bunda"
                required
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Kategori Sasaran
              </label>
              <select
                value={type}
                onChange={(e) =>
                  setType(
                    e.target.value as 'PANTI_ASUHAN' | 'KOMUNITAS' | 'KELUARGA_PRASEJAHTERA'
                  )
                }
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-emerald-500 bg-white"
              >
                <option value="PANTI_ASUHAN">Panti Asuhan</option>
                <option value="KOMUNITAS">Komunitas</option>
                <option value="KELUARGA_PRASEJAHTERA">Keluarga Prasejahtera</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Kontak Pengurus / Penanggung Jawab
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="cth. 081298765432"
                required
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Alamat Lengkap Penyaluran
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="cth. Jl. Merpati No. 12, Kel. Sukamaju"
                required
                rows={2}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
              >
                {submitting
                  ? 'Menyimpan...'
                  : modalMode === 'create'
                  ? 'Simpan Penerima'
                  : 'Perbarui Data'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
