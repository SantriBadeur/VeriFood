'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  PackagePlus,
  Boxes,
  Truck,
  HeartHandshake,
  Users,
  FileBarChart2,
  UserCheck,
  PlusCircle,
  CalendarCheck,
  Printer,
  History,
  X,
  CornerDownLeft,
  ArrowRight,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'Halaman & Menu' | 'Aksi Cepat';
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  keywords?: string[];
}

const ALL_COMMAND_ITEMS: CommandItem[] = [
  // Halaman & Menu
  {
    id: 'nav-dashboard',
    title: 'Ringkasan Dashboard',
    description: 'Statistik utama, metrik FEFO, dan grafik penyaluran',
    category: 'Halaman & Menu',
    href: '/dashboard',
    icon: LayoutDashboard,
    keywords: ['beranda', 'home', 'ringkasan', 'metrik', 'bento', 'chart'],
  },
  {
    id: 'nav-inbound',
    title: 'Pangan Masuk',
    description: 'Input penerimaan donasi pangan single atau batch',
    category: 'Halaman & Menu',
    href: '/makanan/masuk',
    icon: PackagePlus,
    keywords: ['terima', 'donasi', 'masuk', 'input', 'inbound', 'fefo'],
  },
  {
    id: 'nav-warehouse',
    title: 'Kelola Stok Gudang',
    description: 'Koreksi kuantitas, disposal, dan cetak label rak',
    category: 'Halaman & Menu',
    href: '/makanan/kelola',
    icon: Boxes,
    adminOnly: true,
    keywords: ['stok', 'gudang', 'inventory', 'disposal', 'koreksi', 'label', 'rak'],
  },
  {
    id: 'nav-distribution',
    title: 'Distribusi Pangan',
    description: 'Daftar pengiriman, filter tugas saya, dan verifikasi terima',
    category: 'Halaman & Menu',
    href: '/distribusi',
    icon: Truck,
    keywords: ['kirim', 'penyaluran', 'jadwal', 'sopir', 'kurir', 'antar'],
  },
  {
    id: 'nav-donors',
    title: 'Data Master Donatur',
    description: 'Kelola direktori donatur restoran, katering, dan individu',
    category: 'Halaman & Menu',
    href: '/donatur',
    icon: HeartHandshake,
    keywords: ['donatur', 'mitra', 'penyumbang', 'restoran', 'katering', 'kontak'],
  },
  {
    id: 'nav-beneficiaries',
    title: 'Data Penerima Manfaat',
    description: 'Kelola panti asuhan, komunitas, dan keluarga penerima',
    category: 'Halaman & Menu',
    href: '/penerima',
    icon: Users,
    keywords: ['penerima', 'panti', 'komunitas', 'kapasitas', 'lokasi', 'manfaat'],
  },
  {
    id: 'nav-reports',
    title: 'Laporan & Rekapitulasi',
    description: 'Ekspor CSV data donasi, distribusi, dan cetak laporan resmi',
    category: 'Halaman & Menu',
    href: '/laporan',
    icon: FileBarChart2,
    adminOnly: true,
    keywords: ['laporan', 'rekap', 'cetak', 'export', 'csv', 'audit', 'analitik'],
  },
  {
    id: 'nav-users',
    title: 'Kelola Akun Pengguna',
    description: 'Manajemen hak akses Admin dan aktivasi akun relawan',
    category: 'Halaman & Menu',
    href: '/pengguna',
    icon: UserCheck,
    adminOnly: true,
    keywords: ['pengguna', 'user', 'admin', 'relawan', 'akses', 'password', 'role'],
  },

  // Aksi Cepat
  {
    id: 'act-inbound-quick',
    title: 'Catat Donasi Pangan Baru',
    description: 'Buka formulir pencatatan pangan masuk FEFO',
    category: 'Aksi Cepat',
    href: '/makanan/masuk',
    icon: PlusCircle,
    keywords: ['tambah pangan', 'input donasi', 'makanan baru'],
  },
  {
    id: 'act-create-distribution',
    title: 'Buat Jadwal Distribusi Baru',
    description: 'Alokasikan stok batch makanan ke penerima manfaat',
    category: 'Aksi Cepat',
    href: '/distribusi/buat',
    icon: CalendarCheck,
    keywords: ['jadwalkan', 'distribusi baru', 'alokasi', 'salurkan'],
  },
  {
    id: 'act-print-report',
    title: 'Cetak Laporan Resmi Donasi',
    description: 'Format cetak resmi berstempel untuk donatur dan arsip',
    category: 'Aksi Cepat',
    href: '/laporan/cetak',
    icon: Printer,
    adminOnly: true,
    keywords: ['print', 'unduh pdf', 'cetak resmi', 'berita acara'],
  },
  {
    id: 'act-history',
    title: 'Riwayat Distribusi',
    description: 'Lihat seluruh jejak penyaluran yang telah selesai',
    category: 'Aksi Cepat',
    href: '/distribusi',
    icon: History,
    keywords: ['riwayat', 'selesai', 'history', 'jejak', 'bukti'],
  },
];

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name: string;
    role: string;
    email?: string;
  } | null;
}

export function CommandPaletteModal({ isOpen, onClose, currentUser }: CommandPaletteModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter items by role and search query
  const availableItems = useMemo(() => {
    const role = currentUser?.role;
    return ALL_COMMAND_ITEMS.filter((item) => {
      if (item.adminOnly && role !== 'ADMIN') return false;
      return true;
    });
  }, [currentUser?.role]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableItems;

    return availableItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchKeywords;
    });
  }, [availableItems, search]);

  // Focus input and reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation & global shortcut handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          onClose();
          router.push(selected.href);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, router]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pencarian Cepat & Navigasi Global"
        className="relative w-full max-w-xl bg-white dark:bg-[#131b2a] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-white/10 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-white/10 gap-3">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari fitur, menu, atau aksi cepat... (contoh: Distribusi, Donasi, Laporan)"
            className="w-full bg-transparent text-sm sm:text-base font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Bersihkan pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[60vh] sm:max-h-96 overflow-y-auto overscroll-contain p-2 space-y-1"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                Tidak ada hasil ditemukan
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Coba gunakan kata kunci lain seperti &quot;distribusi&quot;, &quot;donatur&quot;, atau &quot;stok&quot;.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  data-active={isSelected}
                  onClick={() => {
                    onClose();
                    router.push(item.href);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition select-none ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-sm'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm truncate">{item.title}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            item.category === 'Aksi Cepat'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isSelected ? (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        Buka <CornerDownLeft className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#0e1522] border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                ↓
              </kbd>{' '}
              Navigasi
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                ↵
              </kbd>{' '}
              Pilih
            </span>
          </div>
          <span className="hidden sm:inline text-[10px]">
            Sisa Berkah • Navigasi Pintar
          </span>
        </div>
      </div>
    </div>
  );
}
