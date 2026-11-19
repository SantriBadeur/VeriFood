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
 * Normalisasi nomor HP Indonesia ke format internasional (628xxx) untuk tautan WhatsApp.
 * Menghilangkan spasi, tanda hubung, tanda kurung, dan tanda plus.
 */
export function formatIndonesianPhoneNumber(phone: string): string {
  if (!phone || !phone.trim()) return '';
  // Clean all non-digit characters
  let clean = phone.replace(/\D/g, '');
  if (!clean) return '';

  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Menghasilkan tautan langsung WhatsApp (wa.me) dengan pesan opsional
 */
export function getWhatsAppUrl(phone: string, message?: string): string {
  const formatted = formatIndonesianPhoneNumber(phone);
  if (!formatted) return '';
  const textQuery = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${formatted}${textQuery}`;
}

/**
 * Menghasilkan tautan panggilan telepon langsung (tel:)
 */
export function getCallUrl(phone: string): string {
  if (!phone || !phone.trim()) return '';
  const clean = phone.replace(/[^\d+]/g, '');
  return clean ? `tel:${clean}` : '';
}

/**
 * Menghasilkan link Google Maps rute navigasi langsung (turn-by-turn directions)
 */
export function getGoogleNavigationUrl(address: string): string {
  if (!address || !address.trim()) return '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}`;
}

/**
 * Menghasilkan link Google Maps pencarian alamat penerima
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
