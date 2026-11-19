'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface RescuedMetric {
  unit: string;
  totalQuantity: number;
  itemCount: number;
}

interface DonorReportItem {
  donorId: string;
  donorName: string;
  donorType: string;
  unit: string;
  totalReceived: number;
  totalDistributed: number;
}

function PrintReportContent() {
  const searchParams = useSearchParams();
  const startDate = searchParams?.get('startDate') || '';
  const endDate = searchParams?.get('endDate') || '';

  const [metrics, setMetrics] = useState<RescuedMetric[]>([]);
  const [donorReports, setDonorReports] = useState<DonorReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';

    Promise.all([
      fetch(`/api/reports/rescued${qs}`).then((res) => (res.ok ? res.json() : [])),
      fetch(`/api/reports/donors${qs}`).then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([metricsData, donorsData]) => {
        setMetrics(metricsData || []);
        setDonorReports(donorsData || []);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const formattedPeriod =
    startDate && endDate
      ? `${new Date(startDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })} s/d ${new Date(endDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`
      : startDate
      ? `Mulai ${new Date(startDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`
      : endDate
      ? `Hingga ${new Date(endDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`
      : 'Keseluruhan Periode Operasional';

  const todayDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-slate-800 p-4 sm:p-8">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/laporan"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Laporan
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
        >
          <Printer className="w-4 h-4" /> Cetak / Unduh Dokumen Resmi (PDF)
        </button>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none print:p-0 print:m-0 border border-slate-200 print:border-none">
        {/* Kop Surat Resmi */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#245246] to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md print:border print:border-slate-800">
                SB
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                  SISABERKAH FOOD BANK INDONESIA
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Platform Logistik Penyelamatan Pangan Surplus Berbasis First-Expired, First-Out (FEFO)
                </p>
                <p className="text-[11px] text-slate-400">
                  Email: info@sisaberkah.org • Website: sisaberkah.org • Jakarta, Indonesia
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono hidden sm:block">
              <div>No: SB/CSR/{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, '0')}</div>
              <div>Hal: Laporan Akuntabilitas CSR</div>
              <div>Tgl: {todayDate}</div>
            </div>
          </div>
        </div>

        {/* Title of Document */}
        <div className="text-center my-6">
          <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase underline underline-offset-4">
            BERITA ACARA & LAPORAN PENYELAMATAN PANGAN
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Periode Penyaluran: <span className="font-semibold text-slate-900">{formattedPeriod}</span>
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Menyiapkan laporan resmi...</div>
        ) : (
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            <p>
              Pada hari ini, <strong className="text-slate-900">{todayDate}</strong>, sistem SisaBerkah Food Bank menerbitkan
              rekapitulasi resmi atas pangan surplus layak konsumsi yang telah berhasil diselamatkan dari potensi limbah
              makanan (food waste) dan didistribusikan secara terverifikasi kepada penerima manfaat:
            </p>

            {/* Bagian 1: Metrik Pangan Terselamatkan */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                1. Rekapitulasi Pangan Terselamatkan (Segregated Unit)
              </h3>
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">Satuan Logistik</th>
                      <th className="p-2.5 text-right">Total Kuantitas Tersalurkan</th>
                      <th className="p-2.5 text-right">Frekuensi Transaksi Penyaluran</th>
                      <th className="p-2.5 text-center">Status Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {metrics.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          Tidak ada transaksi penyaluran terselesaikan pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      metrics.map((m) => (
                        <tr key={m.unit}>
                          <td className="p-2.5 font-bold text-slate-900 uppercase">{m.unit}</td>
                          <td className="p-2.5 text-right font-extrabold text-emerald-700 text-sm">
                            {m.totalQuantity.toLocaleString('id-ID')} {m.unit}
                          </td>
                          <td className="p-2.5 text-right">{m.itemCount} kali distribusi</td>
                          <td className="p-2.5 text-center text-emerald-700 font-semibold">Tersalurkan 100%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * Catatan: Penghitungan mengikuti prinsip pemisahan mutlak satuan pangan sesuai standar audit ketahanan pangan (tidak dijumlah silang).
              </p>
            </div>

            {/* Bagian 2: Partisipasi Donatur & Mitra CSR */}
            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                2. Partisipasi & Kontribusi Donatur / Program CSR
              </h3>
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">Mitra Donatur</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5">Satuan</th>
                      <th className="p-2.5 text-right">Diterima di Gudang</th>
                      <th className="p-2.5 text-right">Berhasil Tersalurkan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {donorReports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          Belum ada catatan aktivitas donatur pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      donorReports.map((r, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-semibold text-slate-900">{r.donorName}</td>
                          <td className="p-2.5 text-slate-500">{r.donorType}</td>
                          <td className="p-2.5 font-medium">{r.unit}</td>
                          <td className="p-2.5 text-right">{r.totalReceived} {r.unit}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-700">
                            {r.totalDistributed} {r.unit}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bagian 3: Deklarasi Legal & Akuntabilitas */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
              <strong className="text-slate-800">Deklarasi Integritas Sistem:</strong>
              <p>
                Dokumen ini merupakan laporan akuntabilitas resmi yang diterbitkan berdasarkan jejak audit tak-terhapuskan
                (immutable audit logs) pada platform SisaBerkah. Seluruh alokasi makanan telah melalui protokol uji fisik
                3 lapis (kemasan, suhu, aroma/visual) dan dialokasikan kepada penerima manfaat berizin.
              </p>
            </div>

            {/* Bagian 4: Lembar Tanda Tangan Ganda Resmi */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-[11px] text-slate-500">Pihak Pertama,</p>
                <p className="font-bold text-slate-800 mt-0.5">Koordinator Food Bank SisaBerkah</p>
                <div className="h-20 flex items-center justify-center">
                  <span className="text-[10px] text-slate-300 border border-dashed border-slate-300 px-3 py-1 rounded">
                    [Tanda Tangan & Cap Digital]
                  </span>
                </div>
                <p className="font-bold text-slate-900 underline">Koordinator Operasional</p>
                <p className="text-[10px] text-slate-400 font-mono">ID: SB-COORD-OPS-01</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-500">Pihak Kedua,</p>
                <p className="font-bold text-slate-800 mt-0.5">Perwakilan Mitra Sponsor / CSR</p>
                <div className="h-20 flex items-center justify-center">
                  <span className="text-[10px] text-slate-300 border border-dashed border-slate-300 px-3 py-1 rounded">
                    [Tanda Tangan & Cap Lembaga]
                  </span>
                </div>
                <p className="font-bold text-slate-900 underline">( .................................................. )</p>
                <p className="text-[10px] text-slate-400 font-mono">Nama & Jabatan Terang</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OfficialPrintReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat template dokumen resmi...</div>}>
      <PrintReportContent />
    </Suspense>
  );
}
