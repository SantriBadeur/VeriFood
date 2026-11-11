'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, HeartHandshake, Sparkles, CheckCircle2, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Nama lengkap minimal 2 karakter');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Pendaftaran gagal');
      }

      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat mendaftar');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EBF7F3] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative background ambient glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Island Card Container */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-emerald-900/10 border border-emerald-100/70 relative z-10">
        {/* Header with Geometric Reference-style Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-[#2B6153] flex items-center justify-center text-white shadow-lg shadow-[#2B6153]/25 relative">
              <span className="font-black text-2xl tracking-tighter">SB</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F4B942] rounded-full border-2 border-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pendaftaran Relawan</h1>
          <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#F4B942]" />
            <span>Bergabung bersama SisaBerkah berbagi berkah pangan</span>
          </p>

          {/* Role Pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-800 text-[11px] font-semibold">
            <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />
            <span>Peran: Relawan Lapangan (Akses Langsung)</span>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200 font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-[#2B6153] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Pendaftaran Berhasil!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Akun relawan Anda telah aktif. Silakan masuk menggunakan email dan kata sandi yang telah didaftarkan.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block w-full rounded-2xl bg-[#2B6153] py-3.5 px-4 font-semibold text-sm text-white shadow-lg shadow-[#2B6153]/30 hover:bg-[#224D42] transition"
            >
              Masuk Sekarang
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Ahmad Fauzi"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#2B6153] focus:outline-none focus:ring-4 focus:ring-[#2B6153]/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#2B6153] focus:outline-none focus:ring-4 focus:ring-[#2B6153]/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
                Kata Sandi (Min. 6 Karakter)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-11 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#2B6153] focus:outline-none focus:ring-4 focus:ring-[#2B6153]/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-11 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#2B6153] focus:outline-none focus:ring-4 focus:ring-[#2B6153]/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#2B6153] py-3.5 px-4 font-semibold text-sm text-white shadow-lg shadow-[#2B6153]/30 hover:bg-[#224D42] active:scale-[0.99] transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Mendaftarkan...' : 'Daftar Akun Relawan'}</span>
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Sudah memiliki akun?{' '}
            <Link
              href="/login"
              className="font-bold text-[#2B6153] hover:text-[#224D42] hover:underline"
            >
              Masuk ke Sistem
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
