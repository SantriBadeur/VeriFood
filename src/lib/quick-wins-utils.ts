/**
 * Quick Wins Field UX Utilities (Prioritas 2)
 * Membantu relawan di lapangan & dapur dengan tombol pintas praktis
 */

export interface ExpiryShortcut {
  id: string;
  hours: number;
  label: string;
  sublabel: string;
  description: string;
}

export const EXPIRY_SHORTCUTS: ExpiryShortcut[] = [
  {
    id: 'perishable-4h',
    hours: 4,
    label: '+4 Jam',
    sublabel: 'cepat basi',
    description: 'untuk makanan bersantan/cepat basi',
  },
  {
    id: 'shift-8h',
    hours: 8,
    label: '+8 Jam',
    sublabel: 'siang ke malam',
    description: 'siang ke malam',
  },
  {
    id: 'next-day-24h',
    hours: 24,
    label: 'Besok Pagi (+24 Jam)',
    sublabel: '+24 Jam',
    description: 'besok pagi (+24 jam)',
  },
  {
    id: 'dry-food-72h',
    hours: 72,
    label: '+3 Hari',
    sublabel: 'tahan lama',
    description: '+3 hari / makanan kering',
  },
];

/**
 * Menghasilkan link Google Maps langsung dari alamat penerima
 */
export function getGoogleMapsUrl(address: string): string {
  if (!address || !address.trim()) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

/**
 * Menghitung nilai string format `YYYY-MM-DDTHH:mm` untuk input `type="datetime-local"`
 * berdasarkan penambahan jam dari waktu acuan.
 */
export function calculateExpiryPreset(hoursToAdd: number, baseDate: Date = new Date()): string {
  const target = new Date(baseDate.getTime() + hoursToAdd * 60 * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = target.getFullYear();
  const month = pad(target.getMonth() + 1);
  const day = pad(target.getDate());
  const hours = pad(target.getHours());
  const minutes = pad(target.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
