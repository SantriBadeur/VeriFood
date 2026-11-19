'use client';

import React, { useState, useEffect } from 'react';
import { UserCog, Plus, ShieldCheck, UserX, UserCheck } from 'lucide-react';

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
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, isActive: !currentActive }),
      });

      if (!res.ok) throw new Error('Gagal memperbarui status pengguna');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola Akun Pengguna</h1>
          <p className="text-sm text-slate-500">
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Mobile Card Stack (< 768px) */}
        <div className="block md:hidden divide-y divide-slate-200">
          {loading ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              Memuat data pengguna...
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              Belum ada data pengguna.
            </div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug">{u.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <UserCheck className="w-4 h-4" /> Akun Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                        <UserX className="w-4 h-4" /> Dinonaktifkan
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(u.id, u.isActive)}
                    className={`text-xs px-3.5 py-1.5 rounded-lg border font-medium active:scale-95 transition ${
                      u.isActive
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
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
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Nama</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Peran</th>
                <th className="px-6 py-3.5">Status Akun</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <UserCheck className="w-4 h-4" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                          <UserX className="w-4 h-4" /> Dinonaktifkan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggle(u.id, u.isActive)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
                          u.isActive
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Daftarkan Pengguna Baru</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kata Sandi Awal</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Peran Akses (RBAC)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'RELAWAN')}
                className="w-full border rounded-lg p-2 text-sm"
              >
                <option value="RELAWAN">Relawan Lapangan</option>
                <option value="ADMIN">Administrator</option>
              </select>
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
                Daftarkan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

