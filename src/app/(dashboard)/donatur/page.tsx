'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Edit2,
  Filter,
  Phone,
  MapPin,
  X,
  UtensilsCrossed,
} from 'lucide-react';

interface Donor {
  id: string;
  name: string;
  type: 'RESTORAN' | 'KATERING' | 'SUPERMARKET' | 'INDIVIDU';
  contact: string;
  address?: string;
  createdAt: string;
}

const CATEGORIES = [
  { label: 'Semua Kategori', value: '' },
  { label: 'Restoran', value: 'RESTORAN' },
  { label: 'Katering', value: 'KATERING' },
  { label: 'Supermarket', value: 'SUPERMARKET' },
  { label: 'Individu', value: 'INDIVIDU' },
];

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'RESTORAN' | 'KATERING' | 'SUPERMARKET' | 'INDIVIDU'>('RESTORAN');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (selectedType) query.append('type', selectedType);

    fetch(`/api/donors?${query.toString()}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((res) => setDonors(res.data || []))
      .catch(() => setDonors([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search, selectedType]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedDonorId(null);
    setName('');
    setType('RESTORAN');
    setContact('');
    setAddress('');
    setFormError('');
  };

  const openEditModal = (donor: Donor) => {
    setModalMode('edit');
    setSelectedDonorId(donor.id);
    setName(donor.name);
    setType(donor.type);
    setContact(donor.contact);
    setAddress(donor.address || '');
    setFormError('');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedDonorId(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/donors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, contact, address }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal menambah donatur');
        }
      } else if (modalMode === 'edit' && selectedDonorId) {
        const res = await fetch(`/api/donors/${selectedDonorId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, contact, address }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal memperbarui data donatur');
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

  const handleDelete = async (id: string, donorName: string) => {
    if (!confirm(`Hapus donatur "${donorName}"? Data akan disembunyikan dari daftar aktif.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/donors/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus donatur');
      }
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus donatur');
    }
  };

  const getTypeBadgeClass = (t: string) => {
    switch (t) {
      case 'RESTORAN':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'KATERING':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SUPERMARKET':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'INDIVIDU':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Direktori Donatur
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#2B6153] font-bold border border-emerald-200">
              {donors.length} Mitra Aktif
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola mitra penyedia pangan berlebih (Restoran, Katering, Supermarket, Individu).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2B6153] hover:bg-[#224D42] text-white rounded-2xl text-xs sm:text-sm font-semibold transition shadow-md shadow-[#2B6153]/20 w-fit active:scale-95"
        >
          <Plus className="w-4 h-4" /> Tambah Donatur
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama mitra, kontak, atau alamat..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs sm:text-sm focus:outline-none focus:border-[#2B6153] focus:ring-2 focus:ring-[#2B6153]/10 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 font-medium"
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                  active
                    ? 'bg-[#2B6153] text-white border-[#2B6153] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Mitra Donatur</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Kontak</th>
                <th className="px-6 py-4">Alamat Operasional</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Memuat data donatur...
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-semibold">Tidak ditemukan data donatur</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba ubah kata kunci pencarian atau filter kategori.
                    </p>
                  </td>
                </tr>
              ) : (
                donors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#2B6153] flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition">
                          <UtensilsCrossed className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{d.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            ID: {d.id.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeBadgeClass(
                          d.type
                        )}`}
                      >
                        {d.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.contact}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5 text-slate-500 max-w-xs truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{d.address || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(d)}
                          title="Ubah Data Donatur"
                          className="p-2 text-slate-400 hover:text-[#2B6153] hover:bg-emerald-50 rounded-xl transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.name)}
                          title="Hapus Donatur (Soft Delete)"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Ubah Donatur */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-emerald-100/60"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {modalMode === 'create' ? 'Tambah Donatur Baru' : 'Ubah Data Donatur'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-medium">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1 pl-1">
                Nama Mitra Donatur
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Restoran Sedap Rasa"
                required
                className="w-full border border-slate-200 rounded-2xl p-2.5 text-sm focus:outline-none focus:border-[#2B6153] focus:ring-2 focus:ring-[#2B6153]/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1 pl-1">
                Kategori Donatur
              </label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as 'RESTORAN' | 'KATERING' | 'SUPERMARKET' | 'INDIVIDU')
                }
                className="w-full border border-slate-200 rounded-2xl p-2.5 text-sm focus:outline-none focus:border-[#2B6153] bg-white"
              >
                <option value="RESTORAN">Restoran</option>
                <option value="KATERING">Katering</option>
                <option value="SUPERMARKET">Supermarket</option>
                <option value="INDIVIDU">Individu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1 pl-1">
                Kontak / No. Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="cth. 08123456789"
                required
                className="w-full border border-slate-200 rounded-2xl p-2.5 text-sm focus:outline-none focus:border-[#2B6153] focus:ring-2 focus:ring-[#2B6153]/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1 pl-1">
                Alamat Operasional (Opsional)
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="cth. Jl. Pahlawan No. 45, Jakarta Selatan"
                rows={2}
                className="w-full border border-slate-200 rounded-2xl p-2.5 text-sm focus:outline-none focus:border-[#2B6153] focus:ring-2 focus:ring-[#2B6153]/10"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#2B6153] text-white rounded-2xl text-xs font-semibold hover:bg-[#224D42] transition shadow-md shadow-[#2B6153]/20 disabled:opacity-50"
              >
                {submitting
                  ? 'Menyimpan...'
                  : modalMode === 'create'
                  ? 'Simpan Donatur'
                  : 'Perbarui Data'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
