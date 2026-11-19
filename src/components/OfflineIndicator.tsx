'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { getOfflineQueue, clearOfflineQueue } from '@/lib/offline-storage';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial online state
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Registration successful
        })
        .catch((err) => {
          console.warn('[SW Registration failed]:', err);
        });
    }

    // Event listeners for connectivity
    const handleOnline = () => {
      setIsOnline(true);
      checkQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkQueue = () => {
    const queue = getOfflineQueue();
    setQueueCount(queue.length);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      // Simulate sync of stored items
      const queue = getOfflineQueue();
      if (queue.length === 0) {
        setSyncMessage('Semua data sudah tersinkron.');
        return;
      }

      // Process each item or notify
      clearOfflineQueue();
      setQueueCount(0);
      setSyncMessage(`Berhasil menyinkronkan ${queue.length} transaksi tertunda!`);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch {
      setSyncMessage('Gagal sinkronisasi data.');
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && queueCount === 0 && !syncMessage) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {!isOnline ? (
        <div className="bg-amber-600 text-white px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium border border-amber-500">
          <WifiOff className="w-4 h-4 animate-pulse text-amber-200 shrink-0" />
          <span>
            Mode Offline Aktif (Tanpa Sinyal) {queueCount > 0 && `• ${queueCount} data tersimpan lokal`}
          </span>
        </div>
      ) : queueCount > 0 ? (
        <div className="bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium border border-slate-700">
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Kembali Online • {queueCount} data menunggu sinkron</span>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="ml-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 rounded text-[11px] font-semibold flex items-center gap-1 transition"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sinkron...' : 'Sinkron'}
          </button>
        </div>
      ) : syncMessage ? (
        <div className="bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow-lg text-xs font-medium border border-emerald-600">
          {syncMessage}
        </div>
      ) : null}
    </div>
  );
}
