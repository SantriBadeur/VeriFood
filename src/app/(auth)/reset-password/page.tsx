'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setTokenValid(false);
      setTokenError('Tautan pengaturan ulang kata sandi tidak lengkap atau token tidak ditemukan.');
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Tautan tidak valid');
        }
        setTokenValid(true);
        setUserEmail(data.email || '');
      })
      .catch((err: unknown) => {
        setTokenValid(false);
        setTokenError(
          err instanceof Error
            ? err.message
            : 'Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa.'
        );
      })
      .finally(() => {
        setChecking(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 6) {
      setFormError('Kata sandi minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengatur ulang kata sandi');
      }

      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Terjadi kesalahan saat mengatur ulang kata sandi');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-emerald-900/10 border border-emerald-100/70 relative z-10">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-[#2B6153] flex items-center justify-center text-white shadow-lg shadow-[#2B6153]/25 relative">
            <KeyRound className="w-7 h-7 text-[#F4B942]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Atur Ulang Kata Sandi</h1>
        <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#F4B942]" />
          <span>Buat kata sandi baru untuk akun SisaBerkah Anda</span>
        </p>
      </div>

      {checking ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#2B6153] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Memverifikasi tautan pengaturan ulang...</p>
        </div>
      ) : !tokenValid ? (
        <div className="py-4 space-y-4 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Tautan Tidak Valid atau Kedaluwarsa</h3>
            <p className="text-xs text-slate-500 mt-1 px-2">{tokenError}</p>
          </div>
          <Link
            href="/forgot-password"
            className="inline-block w-full rounded-2xl bg-[#2B6153] py-3 px-4 font-semibold text-xs text-white hover:bg-[#224D42] transition shadow"
          >
            Minta Tautan Baru
          </Link>
        </div>
      ) : success ? (
        <div className="py-4 space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-[#2B6153] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Kata Sandi Berhasil Diperbarui!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Kata sandi Anda telah berhasil diubah. Silakan masuk menggunakan kata sandi baru Anda.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-[#2B6153] py-3.5 px-4 font-semibold text-sm text-white shadow-lg shadow-[#2B6153]/30 hover:bg-[#224D42] transition"
          >
            <span>Masuk ke Akun Anda</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {userEmail && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Email:</span> {userEmail}
            </div>
          )}

          {formError && (
            <div className="rounded-2xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200 font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
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
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
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
            className="w-full rounded-2xl bg-[#2B6153] py-3.5 px-4 font-semibold text-sm text-white shadow-lg shadow-[#2B6153]/30 hover:bg-[#224D42] active:scale-[0.99] transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#EBF7F3] flex items-center justify-center p-4 relative overflow-hidden font-serif">
      {/* Decorative background ambient glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center text-slate-500 text-xs">
            Memuat...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

