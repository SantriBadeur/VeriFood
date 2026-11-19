'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, FileBarChart2, ShieldCheck, History, Calendar, RotateCcw, Printer } from 'lucide-react';
import { AuditDiffViewer } from '@/components/audit/audit-diff-viewer';

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

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  user?: { name: string; role: string };
  details: string;
}

export default function ReportsAndAuditPage() {
  const [metrics, setMetrics] = useState<RescuedMetric[]>([]);
  const [donorReports, setDonorReports] = useState<DonorReportItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'rescued' | 'donor' | 'audit'>('rescued');

  // Date Range Filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const loadReports = (start?: string, end?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (start) params.append('startDate', start);
    if (end) params.append('endDate', end);
    const qs = params.toString() ? `?${params.toString()}` : '';

    Promise.all([
      fetch(`/api/reports/rescued${qs}`).then((res) => (res.ok ? res.json() : [])),
      fetch(`/api/reports/donors${qs}`).then((res) => (res.ok ? res.json() : [])),
      fetch(`/api/audit${qs}`).then((res) => (res.ok ? res.json() : { data: [] })),
    ])
      .then(([metricsData, donorsData, auditData]) => {
        setMetrics(metricsData || []);
        setDonorReports(donorsData || []);
        setAuditLogs(auditData?.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDownloadCSV = (type: 'rescued' | 'donor') => {
    const params = new URLSearchParams();
    params.append('type', type);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    window.open(`/api/reports/csv?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan & Jejak Audit</h1>
          <p className="text-sm text-slate-500">
            Transparansi metrik makanan terselamatkan dan log mutasi data (US-17, US-18, US-19, US-20).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/laporan/cetak${startDate || endDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" /> Cetak Dokumen Resmi (PDF)
          </Link>
          {activeTab === 'rescued' && (
            <button
              onClick={() => handleDownloadCSV('rescued')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Unduh CSV Makanan Terselamatkan
            </button>
          )}
          {activeTab === 'donor' && (
            <button
              onClick={() => handleDownloadCSV('donor')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Unduh CSV Laporan Donatur
            </button>
          )}
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs sm:text-sm">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Filter Periode Tanggal</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => loadReports(startDate, endDate)}
            disabled={loading}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Memuat...' : 'Terapkan'}
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                loadReports('', '');
              }}
              disabled={loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('rescued')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'rescued'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Makanan Terselamatkan (Segregated Unit)
        </button>
        <button
          onClick={() => setActiveTab('donor')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'donor'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Transparansi Donatur
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'audit'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Log Audit Mutasi
        </button>
      </div>

      {/* Tab 1: Segregated Unit Rescued Food */}
      {activeTab === 'rescued' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.length === 0 ? (
              <div className="col-span-3 bg-white p-8 rounded-xl border text-center text-slate-400">
                Belum ada data distribusi yang terselesaikan (status DITERIMA).
              </div>
            ) : (
              metrics.map((m) => (
                <div key={m.unit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Satuan: {m.unit}
                  </span>
                  <div className="mt-2 text-3xl font-bold text-emerald-600">
                    {m.totalQuantity.toLocaleString('id-ID')} <span className="text-base font-medium">{m.unit}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Dari {m.itemCount} item logistik yang berhasil disalurkan
                  </p>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-slate-400 italic">
            * Anti-Goal Garansi: Metrik dipisah secara mutlak per satuan pangan (tidak dijumlahkan silang antara porsi, kg, dsb).
          </p>
        </div>
      )}

      {/* Tab 2: Donor Transparency */}
      {activeTab === 'donor' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Nama Donatur</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5">Satuan</th>
                  <th className="px-6 py-3.5">Total Diterima</th>
                  <th className="px-6 py-3.5">Total Tersalurkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {donorReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Belum ada catatan aktivitas donatur.
                    </td>
                  </tr>
                ) : (
                  donorReports.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{r.donorName}</td>
                      <td className="px-6 py-4">{r.donorType}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{r.unit}</td>
                      <td className="px-6 py-4">{r.totalReceived} {r.unit}</td>
                      <td className="px-6 py-4 text-emerald-600 font-semibold">
                        {r.totalDistributed} {r.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Waktu</th>
                  <th className="px-6 py-3.5">Aksi</th>
                  <th className="px-6 py-3.5">Entitas</th>
                  <th className="px-6 py-3.5">Pengguna</th>
                  <th className="px-6 py-3.5">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Belum ada catatan audit.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{log.action}</td>
                      <td className="px-6 py-4">{log.entity}</td>
                      <td className="px-6 py-4">{log.user?.name || 'Sistem'}</td>
                      <td className="px-6 py-4">
                        <AuditDiffViewer details={log.details} action={log.action} entity={log.entity} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

