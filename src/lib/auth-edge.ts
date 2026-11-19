export interface SessionPayloadEdge {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'RELAWAN';
  exp?: number;
  iat?: number;
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function verifySessionTokenEdge(token: string): Promise<SessionPayloadEdge | null> {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlDecode(signatureB64);

    const secret = process.env.JWT_SECRET || 'sisaberkah-super-secret-jwt-key-2026';
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature as unknown as BufferSource,
      data as unknown as BufferSource
    );
    if (!isValid) return null;

    const payloadBytes = base64UrlDecode(payloadB64);
    const payloadJson = new TextDecoder().decode(payloadBytes as unknown as BufferSource);
    const payload = JSON.parse(payloadJson) as SessionPayloadEdge;

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
