'use client';

import React, { useState } from 'react';
import { Eye, X, ArrowRight, MinusCircle, AlertCircle, FileText } from 'lucide-react';

export interface DiffItem {
  field: string;
  before: string;
  after: string;
}

export interface ParsedDiffResult {
  type: 'NESTED_DIFF' | 'DISPOSAL_DIFF' | 'CORRECTION_DIFF' | 'GENERIC';
  changes?: DiffItem[];
  disposedQty?: number;
  beforeQty?: number;
  afterQty?: number;
  reason?: string;
  summary: string;
  fallbackText?: string;
  entries?: Array<{ key: string; value: string }>;
}

export function parseAuditDiff(rawDetails: string | unknown, action?: string): ParsedDiffResult {
  if (!rawDetails) {
    return { type: 'GENERIC', summary: '-', fallbackText: '-' };
  }

  let obj: Record<string, any>;
  if (typeof rawDetails === 'string') {
    try {
      obj = JSON.parse(rawDetails);
    } catch {
      return {
        type: 'GENERIC',
        summary: rawDetails,
        fallbackText: rawDetails,
      };
    }
  } else if (typeof rawDetails === 'object') {
    obj = rawDetails as Record<string, any>;
  } else {
    return {
      type: 'GENERIC',
      summary: String(rawDetails),
      fallbackText: String(rawDetails),
    };
  }

  // Case 1: Nested { previous: {...}, updated: {...} }
  if (obj.previous && obj.updated && typeof obj.previous === 'object' && typeof obj.updated === 'object') {
    const changes: DiffItem[] = [];
    const allKeys = Array.from(new Set([...Object.keys(obj.previous), ...Object.keys(obj.updated)]));

    for (const key of allKeys) {
      const prevVal = obj.previous[key] !== undefined ? String(obj.previous[key]) : '(kosong)';
      const nextVal = obj.updated[key] !== undefined ? String(obj.updated[key]) : '(dihapus)';
      if (prevVal !== nextVal) {
        changes.push({
          field: key,
          before: prevVal,
          after: nextVal,
        });
      }
    }

    const summary = changes.map((c) => `${c.field}: ${c.before} → ${c.after}`).join('; ');
    return {
      type: 'NESTED_DIFF',
      changes,
      summary: summary || 'Perubahan metadata',
    };
  }

  // Case 2: Disposal { previousRemaining, disposedQuantity, newRemaining, reason }
  if (obj.disposedQuantity !== undefined || action === 'STOCK_DISPOSAL') {
    const disposedQty = Number(obj.disposedQuantity || 0);
    const beforeQty = Number(obj.previousRemaining || 0);
    const afterQty = Number(obj.newRemaining !== undefined ? obj.newRemaining : beforeQty - disposedQty);
    const reason = obj.reason ? String(obj.reason) : 'Tanpa alasan';

    return {
      type: 'DISPOSAL_DIFF',
      disposedQty,
      beforeQty,
      afterQty,
      reason,
      summary: `Buang ${disposedQty} porsi (Sisa: ${beforeQty} → ${afterQty}). Alasan: ${reason}`,
    };
  }

  // Case 3: Stock Correction { previousInitial, newInitial, ... }
  if (obj.previousInitial !== undefined && obj.newInitial !== undefined) {
    const changes: DiffItem[] = [
      {
        field: 'Stok Awal',
        before: String(obj.previousInitial),
        after: String(obj.newInitial),
      },
    ];
    if (obj.previousRemaining !== undefined && obj.newRemaining !== undefined) {
      changes.push({
        field: 'Sisa Stok',
        before: String(obj.previousRemaining),
        after: String(obj.newRemaining),
      });
    }

    return {
      type: 'CORRECTION_DIFF',
      changes,
      summary: `Koreksi awal ${obj.previousInitial} → ${obj.newInitial} (Sisa ${obj.previousRemaining} → ${obj.newRemaining})`,
    };
  }

  // Case 4: Generic object
  const entries = Object.entries(obj).map(([k, v]) => ({
    key: k,
    value: typeof v === 'object' ? JSON.stringify(v) : String(v),
  }));

  const summary = entries.map((e) => `${e.key}: ${e.value}`).join(', ');
  return {
    type: 'GENERIC',
    summary: summary.length > 80 ? summary.substring(0, 80) + '...' : summary,
    fallbackText: JSON.stringify(obj, null, 2),
    entries,
  };
}

interface AuditDiffViewerProps {
  details: string;
  action: string;
  entity?: string;
}

export function AuditDiffViewer({ details, action, entity }: AuditDiffViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const parsed = parseAuditDiff(details, action);

  return (
    <div>
      {/* Inline Badge Summary */}
      <div className="flex items-center gap-2">
        {parsed.type === 'DISPOSAL_DIFF' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <MinusCircle className="w-3 h-3 text-red-500" />
            Buang: -{parsed.disposedQty}
            <span className="text-slate-400 font-normal">({parsed.beforeQty} → {parsed.afterQty})</span>
          </span>
        )}

        {parsed.type === 'CORRECTION_DIFF' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertCircle className="w-3 h-3 text-blue-500" />
            Koreksi: {parsed.changes?.[0]?.before} → {parsed.changes?.[0]?.after}
          </span>
        )}

        {parsed.type === 'NESTED_DIFF' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileText className="w-3 h-3 text-emerald-600" />
            Update {parsed.changes?.length} data
          </span>
        )}

        {parsed.type === 'GENERIC' && (
          <span className="text-xs text-slate-600 truncate max-w-[200px]" title={parsed.summary}>
            {parsed.summary}
          </span>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-emerald-700 hover:bg-slate-100 border border-slate-200 transition shrink-0"
          title="Buka tampilan visual Sebelum vs Sesudah"
        >
          <Eye className="w-3 h-3" /> Detail
        </button>
      </div>

      {/* Visual Diff Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-mono">
                    {action}
                  </span>
                  <span>Jejak Perubahan Data ({entity || 'Log'})</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Depending on Type */}
            {parsed.type === 'DISPOSAL_DIFF' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Sebelum Dibuang</span>
                    <span className="text-lg font-bold text-slate-700 mt-1 block">
                      {parsed.beforeQty} porsi
                    </span>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <span className="text-red-500 font-semibold uppercase text-[10px] block">Sisa Setelah Dibuang</span>
                    <span className="text-lg font-bold text-red-700 mt-1 block">
                      {parsed.afterQty} porsi
                      <span className="text-xs font-medium text-red-500 ml-1">(-{parsed.disposedQty})</span>
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700 block mb-0.5">Alasan Pembuangan:</span>
                  <p className="text-slate-600 italic">{parsed.reason}</p>
                </div>
              </div>
            )}

            {(parsed.type === 'NESTED_DIFF' || parsed.type === 'CORRECTION_DIFF') && (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="p-2.5">Field / Data</th>
                      <th className="p-2.5 bg-red-50/50 text-red-800">🔴 Nilai Sebelum</th>
                      <th className="p-2.5 bg-emerald-50/50 text-emerald-800">🟢 Nilai Sesudah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.changes?.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-800">{c.field}</td>
                        <td className="p-2.5 text-red-700 bg-red-50/20 font-mono text-[11px]">
                          {c.before}
                        </td>
                        <td className="p-2.5 text-emerald-700 bg-emerald-50/20 font-mono text-[11px] font-semibold">
                          {c.after}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {parsed.type === 'GENERIC' && (
              <div className="space-y-3">
                {parsed.entries && parsed.entries.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {parsed.entries.map((e, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">{e.key}</span>
                        <span className="font-semibold text-slate-800 break-words">{e.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-700 overflow-x-auto border border-slate-200">
                    {parsed.fallbackText}
                  </pre>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
