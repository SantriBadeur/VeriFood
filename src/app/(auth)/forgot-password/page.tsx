'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Sparkles, ArrowLeft, KeyRound, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setDevResetUrl(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses permintaan');
      }

      setMessage(data.message || 'Instruksi telah dikirim.');
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat memproses permintaan');
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
              <KeyRound className="w-7 h-7 text-[#F4B942]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lupa Kata Sandi</h1>
          <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#F4B942]" />
            <span>Pemulihan akses akun SisaBerkah</span>
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200 font-medium">
            {error}
          </div>
        )}

        {message ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#2B6153]" />
                <span>Permintaan Terkirim</span>
              </div>
              <p>{message}</p>
            </div>

            {/* Development Mode Helper Link Box */}
            {devResetUrl && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <span>🧪 Mode Pengujian Lokal (Development)</span>
                </div>
                <p className="text-[11px] text-amber-800/80">
                  Karena server email eksternal belum diset di .env, Anda dapat langsung mengklik tombol di bawah ini untuk membuka halaman reset kata sandi:
                </p>
                <a
                  href={devResetUrl}
                  className="mt-1 flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-[#2B6153] text-white font-semibold text-xs hover:bg-[#224D42] transition shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Halaman Reset Kata Sandi</span>
                </a>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full rounded-2xl border border-slate-200 py-3 px-4 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Halaman Masuk</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
                Alamat Email Terdaftar
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sisaberkah.org"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#2B6153] focus:outline-none focus:ring-4 focus:ring-[#2B6153]/10 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#2B6153] py-3.5 px-4 font-semibold text-sm text-white shadow-lg shadow-[#2B6153]/30 hover:bg-[#224D42] active:scale-[0.99] transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>{loading ? 'Mengirim...' : 'Kirim Tautan Reset Kata Sandi'}</span>
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Halaman Masuk</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

