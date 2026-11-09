'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal. Silakan periksa kredensial Anda.');
      }

      window.location.href = '/dashboard';
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat masuk');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EBF7F3] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background ambient glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Island Card Container */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-emerald-900/10 border border-emerald-100/70 relative z-10">
        {/* Header with Geometric Reference-style Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-[#2B6153] flex items-center justify-center text-white shadow-lg shadow-[#2B6153]/25 relative">
              <span className="font-black text-2xl tracking-tighter">SB</span>
              {/* Subtle gold accent dot matching reference */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F4B942] rounded-full border-2 border-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">SisaBerkah</h1>
          <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#F4B942]" />
            <span>Platform Penyelamatan Pangan & Distribusi FEFO</span>
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
              Alamat Email
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
              Kata Sandi
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#2B6153] py-3.5 px-4 font-semibold text-sm text-white shadow-lg shadow-[#2B6153]/30 hover:bg-[#224D42] active:scale-[0.99] transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
          </button>
        </form>

        {/* Demo Fast Fill Section */}
        <div className="mt-8 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
            Akses Demo Cepat
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillDemo('admin@sisaberkah.org', 'admin123')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-100/70 text-[#2B6153] text-xs font-semibold transition active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4 text-[#2B6153] shrink-0" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('relawan@sisaberkah.org', 'relawan123')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border border-blue-200/80 bg-blue-50/60 hover:bg-blue-100/70 text-blue-800 text-xs font-semibold transition active:scale-[0.98]"
            >
              <HeartHandshake className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Relawan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
