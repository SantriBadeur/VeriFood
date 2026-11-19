'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/user-context';
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
  Building,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';

interface Beneficiary {
  id: string;
  name: string;
  type: 'PANTI_ASUHAN' | 'KOMUNITAS' | 'KELUARGA_PRASEJAHTERA';
  contact: string;
  address: string;
  capacity?: number | null;
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

  // User RBAC Role from context (or fallback fetch if standalone)
  const contextUser = useCurrentUser();
  const [userRole, setUserRole] = useState<'ADMIN' | 'RELAWAN' | null>(contextUser?.role || null);

  // Modal State (Admin only)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'PANTI_ASUHAN' | 'KOMUNITAS' | 'KELUARGA_PRASEJAHTERA'>(
    'PANTI_ASUHAN'
  );
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (contextUser?.role) {
      setUserRole(contextUser.role);
    } else if (!userRole) {
      fetch('/api/auth/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user?.role) {
            setUserRole(data.user.role);
          }
        })
        .catch(() => {});
    }
  }, [contextUser]);

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
    setCapacity('');
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
    setCapacity(b.capacity !== null && b.capacity !== undefined ? b.capacity.toString() : '');
    setFormError('');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedId(null);
    setCapacity('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const parsedCapacity = capacity ? parseInt(capacity, 10) : null;
      const payload = {
        name,
        type,
        contact,
        address,
        capacity: parsedCapacity,
      };

      if (modalMode === 'create') {
        const res = await fetch('/api/beneficiaries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Hanya Admin yang dapat mengelola data penerima');
        }
      } else if (modalMode === 'edit' && selectedId) {
        const res = await fetch(`/api/beneficiaries/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pageError, setPageError] = useState('');

  const handleDelete = (id: string, benName: string) => {
    if (userRole === 'RELAWAN') return;
    setDeleteConfirm({ isOpen: true, id, name: benName });
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/beneficiaries/${deleteConfirm.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Hanya Admin yang dapat menghapus penerima');
      }
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
      loadData();
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Gagal menghapus penerima');
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
    } finally {
      setDeleteLoading(false);
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
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
      case 'KOMUNITAS':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
      case 'KELUARGA_PRASEJAHTERA':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
      default:
        return 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Direktori Penerima Manfaat
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#2B6153] dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/40">
              {beneficiaries.length} Mitra Sasaran
            </span>
            {isRelawan && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800/40">
                <Lock className="w-3 h-3" /> Mode Baca
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftar yayasan, panti asuhan, dan keluarga sasaran penyaluran pangan berlebih.
          </p>
        </div>

        {!isRelawan && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2B6153] hover:bg-[#224D42] text-white rounded-2xl text-xs sm:text-sm font-semibold transition shadow-md shadow-[#2B6153]/20 w-fit active:scale-95"
          >
            <Plus className="w-4 h-4" /> Tambah Penerima
          </button>
        )}
      </div>

      {pageError && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center justify-between border border-red-200 dark:border-red-900/40 shadow-sm animate-in fade-in">
          <span>{pageError}</span>
          <button
            type="button"
            onClick={() => setPageError('')}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition"
            aria-label="Tutup pesan kesalahan"
          >
            ✕
          </button>
        </div>
      )}

      {/* Relawan Notice Banner */}
      {isRelawan && (
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl flex items-center gap-3 text-xs text-blue-800 dark:text-blue-200">
          <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            <strong>Akses Relawan:</strong> Anda dapat melihat data kontak dan alamat penyaluran untuk keperluan logistik lapangan. Penambahan dan perubahan data hanya dapat dilakukan oleh Administrator.
          </span>
        </div>
      )}

      {/* Search and Category Filter Chips */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari yayasan, panti, kontak, alamat..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#131b2a] border border-slate-200 dark:border-white/10 rounded-full text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2B6153] focus:ring-2 focus:ring-[#2B6153]/10 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
            >
              Reset
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
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
                    : 'bg-white dark:bg-[#131b2a] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Beneficiaries Card Stack (Mobile) & Table (Desktop) */}
      <div className="bg-white dark:bg-[#131b2a] rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Mobile Card Stack (< 768px) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-white/5">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              Memuat data penerima manfaat...
            </div>
          ) : beneficiaries.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm">Tidak ditemukan data penerima</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Coba ubah kata kunci pencarian atau filter kategori.
              </p>
            </div>
          ) : (
            beneficiaries.map((b) => (
              <div key={b.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#2B6153] dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">{b.name}</h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        ID: {b.id.substring(0, 8)} • Kuota: {b.capacity ? `${b.capacity} porsi` : 'Fleksibel'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTypeBadgeClass(
                      b.type
                    )}`}
                  >
                    {formatCategory(b.type)}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-[#0f1726] p-2.5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{b.contact}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                    <span className="text-slate-500 dark:text-slate-400 line-clamp-2">{b.address}</span>
                  </div>
                </div>

                {!isRelawan && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(b)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#182337] border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#2B6153] dark:text-emerald-400" /> Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id, b.name)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 active:scale-95 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/70 dark:bg-[#0f1726] text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Nama Penerima Manfaat</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Kontak Pengurus</th>
                <th className="px-6 py-4">Alamat Penyaluran</th>
                {!isRelawan && <th className="px-6 py-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td
                    colSpan={isRelawan ? 4 : 5}
                    className="px-6 py-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    Memuat data penerima manfaat...
                  </td>
                </tr>
              ) : beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={isRelawan ? 4 : 5} className="px-6 py-12 text-center">
                    <Users2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-300 font-semibold">Tidak ditemukan data penerima</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Coba ubah kata kunci pencarian atau filter kategori.
                    </p>
                  </td>
                </tr>
              ) : (
                beneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#2B6153] dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{b.name}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            ID: {b.id.substring(0, 8)} • Kuota: {b.capacity ? `${b.capacity} porsi` : 'Fleksibel'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeBadgeClass(
                          b.type
                        )}`}
                      >
                        {formatCategory(b.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{b.contact}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                        <span>{b.address}</span>
                      </div>
                    </td>
                    {!isRelawan && (
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(b)}
                            title="Ubah Data Penerima"
                            className="p-2 text-slate-400 hover:text-[#2B6153] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id, b.name)}
                            title="Hapus Penerima (Soft Delete)"
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#131b2a] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-slate-100 dark:border-white/10"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-white/10">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {modalMode === 'create' ? 'Tambah Penerima Manfaat' : 'Ubah Data Penerima'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-2xl text-xs font-medium">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 pl-1">
                Nama Yayasan / Komunitas / Keluarga
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Panti Asuhan Kasih Bunda"
                required
                className="w-full bg-white dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl p-2.5 text-sm focus:outline-none focus:border-[#2B6153] focus:ring-2 focus:ring-[#2B6153]/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 pl-1">
                Kategori Sasaran
              </label>
              <select
                value={type}
                onChange={(e) =>
                  setType(
                    e.target.value as 'PANTI_ASUHAN' | 'KOMUNITAS' | 'KELUARGA_PRASEJAHTERA'
                  )
                }
                className="w-full bg-white dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-2xl p-2.5 text-sm focus:outline-none focus:border-[#2B6153]"
              >
                <option value="PANTI_ASUHAN">Panti Asuhan</option>
                <option value="KOMUNITAS">Komunitas</option>
                <option value="KELUARGA_PRASEJAHTERA">Keluarga Prasejahtera</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 pl-1">
                Kontak Pengurus / Penanggung Jawab
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="cth. 081298765432"
                required
                className="w-full bg-white dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl p-2.5 text-sm focus:outline-none focus:border-[#2B6153] focus:ring-2 focus:ring-[#2B6153]/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 pl-1">
                Alamat Lengkap Penyaluran
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="cth. Jl. Merpati No. 12, Kel. Sukamaju"
                required
                rows={2}
                className="w-full bg-white dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl p-2.5 text-sm focus:outline-none focus:border-[#2B6153] focus:ring-2 focus:ring-[#2B6153]/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 pl-1">
                Kapasitas / Kuota Penerima (Porsi / Jiwa)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="cth. 30 (opsional - batas porsi alokasi)"
                className="w-full bg-white dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl p-2.5 text-sm focus:outline-none focus:border-[#2B6153] focus:ring-2 focus:ring-[#2B6153]/10"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 pl-1">
                Digunakan untuk memvalidasi alokasi distribusi agar tidak melebihi daya tampung penerima.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
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
                  ? 'Simpan Penerima'
                  : 'Perbarui Data'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        onConfirm={handleExecuteDelete}
        title="Hapus Penerima Manfaat"
        message={`Apakah Anda yakin ingin menghapus penerima manfaat "${deleteConfirm.name}"? Data akan disembunyikan.`}
        confirmText="Hapus Penerima"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
