'use client';

import React, { useState, useEffect } from 'react';
import { UserCog, Plus, ShieldCheck, UserX, UserCheck, AlertCircle } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RELAWAN';
  isActive: boolean;
  createdAt: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'RELAWAN'>('RELAWAN');
  const [modalError, setModalError] = useState('');
  const [pageError, setPageError] = useState('');

  // Confirmation modal state for toggle
  const [toggleConfirm, setToggleConfirm] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    targetActive: boolean;
  }>({ isOpen: false, userId: '', userName: '', targetActive: false });
  const [toggleLoading, setToggleLoading] = useState(false);

  const loadData = () => {
    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat pengguna');

      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      loadData();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Gagal membuat pengguna');
    }
  };

  const handleToggle = (id: string, currentActive: boolean, userName?: string) => {
    const target = !currentActive;
    setToggleConfirm({
      isOpen: true,
      userId: id,
      userName: userName || 'Pengguna',
      targetActive: target,
    });
  };

  const handleExecuteToggle = async () => {
    if (!toggleConfirm.userId) return;
    setToggleLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: toggleConfirm.userId, isActive: toggleConfirm.targetActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal memperbarui status pengguna');
      }
      setToggleConfirm({ isOpen: false, userId: '', userName: '', targetActive: false });
      loadData();
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Gagal memperbarui status pengguna');
      setToggleConfirm({ isOpen: false, userId: '', userName: '', targetActive: false });
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kelola Akun Pengguna</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Khusus Administrator: Daftarkan relawan baru dan atur status akses akun (US-02).
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" /> Daftarkan Pengguna
        </button>
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

      <div className="bg-white dark:bg-[#131b2a] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Mobile Card Stack (< 768px) */}
        <div className="block md:hidden divide-y divide-slate-200 dark:divide-white/5">
          {loading ? (
            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Memuat data pengguna...
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Belum ada data pengguna.
            </div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">{u.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{u.email}</p>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300'
                        : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <UserCheck className="w-4 h-4" /> Akun Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500 dark:text-red-400 font-medium">
                        <UserX className="w-4 h-4" /> Dinonaktifkan
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(u.id, u.isActive, u.name)}
                    className={`text-xs px-3.5 py-1.5 rounded-lg border font-medium active:scale-95 transition ${
                      u.isActive
                        ? 'border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                        : 'border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-[#0f1726] text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-3.5">Nama</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Peran</th>
                <th className="px-6 py-3.5">Status Akun</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{u.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <UserCheck className="w-4 h-4" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500 dark:text-red-400 font-medium">
                          <UserX className="w-4 h-4" /> Dinonaktifkan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggle(u.id, u.isActive, u.name)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                          u.isActive
                            ? 'border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                            : 'border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreate} className="bg-white dark:bg-[#131b2a] rounded-xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-white/10 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Daftarkan Pengguna Baru</h3>
            {modalError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-lg border border-red-200 dark:border-red-900/40">
                {modalError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kata Sandi Awal</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Peran Akses (RBAC)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'RELAWAN')}
                className="w-full bg-white dark:bg-[#0f1726] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="RELAWAN">Relawan Lapangan</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setModalError('');
                }}
                className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Daftarkan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toggle Status Confirmation Modal */}
      <ConfirmModal
        isOpen={toggleConfirm.isOpen}
        onClose={() => setToggleConfirm({ isOpen: false, userId: '', userName: '', targetActive: false })}
        onConfirm={handleExecuteToggle}
        title={toggleConfirm.targetActive ? 'Aktifkan Akun Pengguna' : 'Nonaktifkan Akun Pengguna'}
        message={
          toggleConfirm.targetActive
            ? `Apakah Anda yakin ingin mengaktifkan kembali akun "${toggleConfirm.userName}"? Pengguna akan dapat masuk kembali ke sistem.`
            : `Apakah Anda yakin ingin menonaktifkan akun "${toggleConfirm.userName}"? Pengguna tidak akan dapat mengakses sistem.`
        }
        confirmText={toggleConfirm.targetActive ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
        variant={toggleConfirm.targetActive ? 'info' : 'danger'}
        loading={toggleLoading}
      />
    </div>
  );
}

