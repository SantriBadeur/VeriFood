'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Check, PenTool, RotateCcw, X, Image as ImageIcon } from 'lucide-react';

export interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  distribution: {
    id: string;
    beneficiary: { name: string; address?: string };
    recipientName?: string | null;
    proofPhoto?: string | null;
    signatureData?: string | null;
    deliveredAt?: string | null;
    deliveredByUser?: { name: string } | null;
    status: string;
  };
  onSubmit?: (data: { recipientName: string; proofPhoto: string; signatureData: string }) => Promise<void>;
  readOnly?: boolean;
}

export default function ProofOfDeliveryModal({
  isOpen,
  onClose,
  distribution,
  onSubmit,
  readOnly = false,
}: ProofModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [proofPhoto, setProofPhoto] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      if (readOnly) {
        setRecipientName(distribution.recipientName || '');
        setProofPhoto(distribution.proofPhoto || '');
      } else {
        setRecipientName('');
        setProofPhoto('');
        setHasSignature(false);
        setError('');
        clearCanvas();
      }
    }
  }, [isOpen, readOnly, distribution]);

  // Setup canvas resolution and styling
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Soft background line for signing
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 30);
    ctx.lineTo(canvas.width - 20, canvas.height - 30);
    ctx.stroke();
    setHasSignature(false);
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCanvasCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Handle image upload / photo capture
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, dsb)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofPhoto(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      setError('Nama perwakilan penerima wajib diisi.');
      return;
    }

    let signatureBase64 = '';
    if (canvasRef.current && hasSignature) {
      signatureBase64 = canvasRef.current.toDataURL('image/png');
    }

    setSubmitting(true);
    setError('');

    try {
      if (onSubmit) {
        await onSubmit({
          recipientName: recipientName.trim(),
          proofPhoto,
          signatureData: signatureBase64,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan bukti serah terima');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {readOnly ? 'Bukti Serah Terima (BAST)' : 'Konfirmasi Serah Terima Paket'}
            </h2>
            <p className="text-xs text-emerald-100">
              {distribution.beneficiary.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {readOnly ? (
            /* READ-ONLY VIEW */
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <p className="text-xs text-slate-500">Nama Penerima Manfaat:</p>
                <p className="font-semibold text-slate-800">{distribution.beneficiary.name}</p>
                {distribution.recipientName && (
                  <p className="text-xs text-slate-600">
                    Diserahkan kepada: <strong>{distribution.recipientName}</strong>
                  </p>
                )}
                {distribution.deliveredAt && (
                  <p className="text-xs text-slate-400">
                    Waktu: {new Date(distribution.deliveredAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
                {distribution.deliveredByUser && (
                  <p className="text-xs text-slate-400">
                    Relawan Pengantar: {distribution.deliveredByUser.name}
                  </p>
                )}
              </div>

              {distribution.proofPhoto ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Foto Dokumentasi Serah Terima:
                  </label>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={distribution.proofPhoto}
                    alt="Bukti Serah Terima"
                    className="w-full max-h-60 object-cover rounded-xl border border-slate-200"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Tidak ada foto bukti serah terima.</p>
              )}

              {distribution.signatureData ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanda Tangan Penerima:
                  </label>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={distribution.signatureData}
                    alt="Tanda Tangan Digital"
                    className="w-full max-h-32 object-contain bg-slate-50 rounded-xl border border-slate-200 p-2"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Tidak ada tanda tangan digital.</p>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            /* INTERACTIVE SUBMISSION FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Recipient Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Penerima (Pihak Panti / Komunitas) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Contoh: Ibu Siti (Ketua Yayasan)"
                  className="w-full p-2.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Photo Upload / Capture */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Foto Bukti Serah Terima (Opsional / Dianjurkan)
                </label>
                {proofPhoto ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofPhoto}
                      alt="Preview Foto"
                      className="w-full max-h-44 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setProofPhoto('')}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl cursor-pointer bg-slate-50 hover:bg-emerald-50/50 transition">
                    <Camera className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-600">Ambil Foto / Pilih Gambar</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Mendukung kamera HP langsung</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Digital Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tanda Tangan Digital Penerima (Layar HP)
                  </label>
                  {hasSignature && (
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600"
                    >
                      <RotateCcw className="w-3 h-3" /> Bersihkan
                    </button>
                  )}
                </div>
                <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-slate-50 touch-none">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={140}
                    className="w-full h-32 block cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400 gap-1.5">
                      <PenTool className="w-3.5 h-3.5" /> Sentuh & tanda tangani di sini
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Menyimpan...' : 'Konfirmasi & Selesaikan'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
