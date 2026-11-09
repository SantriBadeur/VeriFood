export type PhysicalStatus = 'DITERIMA' | 'DITOLAK';
export type ExpiryStatus = 'AMAN' | 'MENDEKATI_KEDALUWARSA' | 'KEDALUWARSA' | 'DITOLAK';

export interface ExpiryEvaluation {
  status: ExpiryStatus;
  label: string;
  badge: 'green' | 'yellow' | 'red';
  canDistribute: boolean;
  hoursRemaining?: number;
}

export function computeExpiryStatus(expiryAt: Date, physicalStatus: PhysicalStatus): ExpiryEvaluation {
  if (physicalStatus === 'DITOLAK') {
    return {
      status: 'DITOLAK',
      label: 'Ditolak (Kondisi Tidak Layak)',
      badge: 'red',
      canDistribute: false,
    };
  }

  const now = new Date();
  const diffHours = (new Date(expiryAt).getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 0) {
    return {
      status: 'KEDALUWARSA',
      label: 'Kedaluwarsa',
      badge: 'red',
      canDistribute: false,
      hoursRemaining: 0,
    };
  } else if (diffHours <= 24) {
    return {
      status: 'MENDEKATI_KEDALUWARSA',
      label: 'Mendekati Kedaluwarsa (<24 jam)',
      badge: 'yellow',
      canDistribute: true,
      hoursRemaining: Math.round(diffHours * 10) / 10,
    };
  } else {
    return {
      status: 'AMAN',
      label: 'Aman',
      badge: 'green',
      canDistribute: true,
      hoursRemaining: Math.round(diffHours * 10) / 10,
    };
  }
}

