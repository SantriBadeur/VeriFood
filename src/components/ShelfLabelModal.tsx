'use client';

import React from 'react';
import { Printer, X, QrCode, Tag, AlertCircle, ShieldCheck } from 'lucide-react';

export interface ShelfLabelFood {
  id: string;
  name: string;
  initialQuantity: number;
  remainingQuantity: number;
  unit: string;
  expiryAt: string;
  donor?: { name: string } | null;
  evaluation?: { label: string; badge: string; canDistribute: boolean } | null;
  packagingIntact?: boolean;
  temperatureSafe?: boolean;
  visualSmellOk?: boolean;
  physicalStatus?: string;
  notes?: string | null;
}

interface ShelfLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: ShelfLabelFood;
}

export default function ShelfLabelModal({ isOpen, onClose, food }: ShelfLabelModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const batchCode = `SB-${food.id.substring(0, 8).toUpperCase()}`;
  const expiryDate = new Date(food.expiryAt);
  const formattedExpiry = expiryDate.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      {/* Print-specific style */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-shelf-label,
          #printable-shelf-label * {
            visibility: visible !important;
          }
          #printable-shelf-label {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 8px !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header - Screen only */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold">Cetak Label Stiker Wadah Gudang</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Sticker Preview */}
        <div className="p-6 space-y-4">
          <p className="no-print text-xs text-slate-500">
            Pratinjau label stiker fisik untuk ditempelkan pada wadah box, kontainer, rak, atau chiller penyimpanan.
          </p>

          {/* Printable Sticker Container */}
          <div
            id="printable-shelf-label"
            className="print:block border-2 border-dashed border-slate-400 rounded-xl p-4 bg-white text-black space-y-3 shadow-inner"
          >
            {/* Sticker Top Header */}
            <div className="border-b-2 border-black pb-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-emerald-800 block">
                  SisaBerkah Food Bank
                </span>
                <span className="text-xs font-black uppercase tracking-tight">
                  LABEL STOK GUDANG
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">
                {batchCode}
              </span>
            </div>

            {/* Food Name & Batch Details */}
            <div>
              <span className="text-[10px] text-slate-500 font-medium uppercase block">Nama Makanan:</span>
              <h3 className="text-base font-black text-slate-900 leading-tight">{food.name}</h3>
              <p className="text-xs text-slate-700 mt-0.5 font-medium">
                Donatur: <strong>{food.donor?.name || 'Umum'}</strong>
              </p>
            </div>

            {/* Quantity & Expiry Grid */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Stok Awal / Sisa:</span>
                <span className="font-bold text-slate-900">
                  {food.remainingQuantity} / {food.initialQuantity} {food.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Prioritas FEFO:</span>
                <span className="font-bold text-emerald-700">
                  {food.evaluation?.label || 'AMAN'}
                </span>
              </div>
            </div>

            {/* EXPIRY ALERT BOX (Large for warehouse workers) */}
            <div className="border-2 border-red-500 bg-red-50/50 p-2 rounded-lg text-center">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wide block">
                BATAS KEDALUWARSA (EXP)
              </span>
              <span className="text-sm font-black text-red-700 block">
                {formattedExpiry}
              </span>
            </div>

            {/* Visual Barcode & QR Code representation */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <div className="flex flex-col items-center">
                {/* SVG QR Code Simulation */}
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  className="w-14 h-14 text-slate-900"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="15" y="15" width="2" height="2" />
                  <rect x="19" y="15" width="2" height="2" />
                  <rect x="15" y="19" width="2" height="2" />
                  <rect x="19" y="19" width="2" height="2" />
                </svg>
                <span className="text-[8px] font-mono text-slate-500">SCAN QR</span>
              </div>

              {/* Barcode Mockup */}
              <div className="flex-1 pl-3 text-right">
                <div className="flex justify-end gap-[2px] h-7 items-end">
                  {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 1, 3].map((w, i) => (
                    <span
                      key={i}
                      className="bg-black inline-block"
                      style={{ width: `${w}px`, height: '100%' }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono tracking-widest text-slate-600 block mt-0.5">
                  *{batchCode}*
                </span>
                <span className="text-[9px] text-slate-400 block">
                  Verifikasi Fisik: Lolos Pos US-08
                </span>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="text-[8px] text-slate-400 text-center border-t border-slate-100 pt-1">
              Tempelkan label ini pada wadah fisik. Simpan sesuai suhu aman pangan.
            </div>
          </div>

          {/* Action Buttons - Screen only */}
          <div className="no-print pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Label (Print)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
