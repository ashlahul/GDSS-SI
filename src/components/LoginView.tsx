'use client';

import React, { useState } from 'react';
import { useGDSS } from '@/context/GDSSContext';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithCredentials, dbError } = useGDSS();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const res = await loginWithCredentials(email, password);
    setIsSubmitting(false);
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#101114] p-4 select-none">
      <div className="w-full max-w-md rounded-2xl shadow-2xl bg-[#1a1b20] border border-[#272832] text-white overflow-hidden">
        {/* Card Header */}
        <div className="p-6 pb-4 text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg shadow-black/25 border border-white/10 mb-2 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Logo GDSS Ormawa"
              className="w-full h-full object-contain select-none"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Login Dashboard GDSS
          </h1>
          <p className="text-xs text-neutral-400">
            Masuk dengan akun terdaftar (Admin, Ketua, Wakil Ketua, Sekretaris, Bendahara, atau Anggota)
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-4 space-y-4">
            {dbError && (
              <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 p-2.5 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{dbError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-neutral-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nama@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 rounded-lg bg-[#131418] border border-[#2e303d] text-white text-xs h-9 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-neutral-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-9 rounded-lg bg-[#131418] border border-[#2e303d] text-white text-xs h-9 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-lg text-center font-medium">
                {error}
              </div>
            )}
          </div>

          <div className="px-6 pt-2 pb-6">
            <button
              className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-semibold h-9 shadow-sm transition-colors cursor-pointer"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sedang masuk...' : 'Masuk ke Dashboard'}
            </button>
            <p className="text-[10px] text-neutral-500 text-center mt-4">
              Sistem Pendukung Keputusan Kelompok (Hybrid TOPSIS + Borda) • Neon PostgreSQL
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
