import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionTokenEdge } from '@/lib/auth-edge';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('sb_session')?.value;
  const session = token ? await verifySessionTokenEdge(token) : null;

  // 1. Rute publik yang dapat diakses tanpa login
  const isPublicAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  const isPublicRoute = pathname === '/' || isPublicAuthRoute;

  // 2. Rute khusus ADMIN (Relawan dilarang mengakses)
  const isAdminOnlyRoute =
    pathname.startsWith('/pengguna') ||
    pathname.startsWith('/makanan/kelola') ||
    pathname.startsWith('/laporan');

  // Kondisi A: Belum login / sesi tidak valid
  if (!session) {
    if (!isPublicRoute) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Kondisi B: Sudah login tetapi mengakses halaman autentikasi publik (/login, /register, dll)
  if (isPublicAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Kondisi C: Relawan mencoba mengakses rute khusus Admin (/pengguna, /makanan/kelola, /laporan)
  if (isAdminOnlyRoute && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API routes (/api/*)
     * - Static asset files (png, jpg, svg, webp, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
