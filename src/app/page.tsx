import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-800">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center space-y-4 border border-slate-200">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 font-bold text-2xl">
          SB
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">SisaBerkah Platform</h1>
        <p className="text-sm text-slate-600">
          Sistem Penyelamatan Pangan Berlebih & Distribusi Logistik Aman Berbasis FEFO.
        </p>
        <div className="pt-4">
          <Link
            href="/login"
            className="inline-block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition"
          >
            Masuk ke Sistem
          </Link>
        </div>
      </div>
    </main>
  );
}

