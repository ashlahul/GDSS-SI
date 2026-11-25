'use client';

import React, { useState } from 'react';
import { useGDSS } from '@/context/GDSSContext';
import {
  Crown,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  RotateCcw,
  Scale,
} from 'lucide-react';

export const ConsensusTab: React.FC<{ onNavigateToResults: () => void }> = ({
  onNavigateToResults,
}) => {
  const {
    currentUser,
    decisionMakers,
    votes,
    programKerjaList,
    isConsensusReady,
    consensusResult,
    executeConsensus,
    resetConsensus,
    refreshData,
    isLoadingData,
  } = useGDSS();

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const totalProker = programKerjaList.length;
  const totalDMs = decisionMakers.length || 4;

  const handleExecute = async () => {
    setIsExecuting(true);
    const res = await executeConsensus();
    setIsExecuting(false);
    if (res.success) {
      setNotification({ type: 'success', text: res.message });
      setTimeout(() => {
        onNavigateToResults();
      }, 1000);
    } else {
      setNotification({ type: 'error', text: res.message });
    }
  };

  const completedCount = decisionMakers.filter((dm) => {
    const v = votes[dm.id];
    return v && v.submittedAt && v.rankings.length === totalProker && totalProker > 0;
  }).length;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white p-6 space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-600" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Konsensus Borda (Agregasi TOPSIS)
            </h1>
            <p className="text-[11px] text-neutral-500">
              Menggabungkan peringkat TOPSIS dari {totalDMs} Decision Maker menjadi keputusan kelompok
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refreshData()}
            disabled={isLoadingData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
            <span>Sinkronkan ({completedCount}/{totalDMs})</span>
          </button>

          {consensusResult && (
            <button
              type="button"
              onClick={onNavigateToResults}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <span>Lihat Hasil</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-lg border flex items-center gap-2 text-xs font-semibold animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Decision Makers Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {decisionMakers.map((dm) => {
          const userVote = votes[dm.id];
          const isDone = Boolean(
            userVote &&
              userVote.submittedAt &&
              userVote.rankings.length === totalProker &&
              totalProker > 0
          );

          return (
            <div
              key={dm.id}
              className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {dm.isHighestRole ? <Crown className="w-3.5 h-3.5" /> : dm.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                      <span className="truncate">{dm.name}</span>
                      {dm.id === currentUser.id && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold shrink-0">
                          Anda
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">{dm.roleLabel}</div>
                    {dm.nim && (
                      <div className="text-[10px] font-mono text-neutral-400">{dm.nim}</div>
                    )}
                  </div>
                </div>

                {isDone ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    SELESAI
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    MENUNGGU
                  </span>
                )}
              </div>

              {isDone && (() => {
                const topPick = userVote.rankings.find((r) => r.rank === 1);
                const topProker = programKerjaList.find((p) => p.id === topPick?.prokerId);
                return topPick && topProker ? (
                  <div className="px-2.5 py-1.5 rounded bg-purple-50/70 border border-purple-100 flex items-center justify-between text-[10px]">
                    <span className="text-purple-800 font-medium truncate pr-2">
                      Top #1 TOPSIS: <strong>{topProker.code}</strong>
                    </span>
                    <span className="font-mono font-bold text-purple-700 shrink-0">
                      V={topPick.topsisScore.toFixed(3)}
                    </span>
                  </div>
                ) : null;
              })()}

              <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                <span>Progres Penilaian</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {userVote?.rankings?.length || 0} / {totalProker} Proker
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Authority Action Box */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">
            Pengesahan Konsensus Pengambilan Keputusan (Hybrid TOPSIS + Borda)
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Eksekusi konsensus hanya terbuka setelah {totalDMs}/{totalDMs} pengambil keputusan selesai mengisi matriks TOPSIS dan hanya dapat disahkan melalui akun Ketua Umum (jabatan tertinggi).
          </p>
        </div>

        {!currentUser.isHighestRole ? (
          <div className="p-4 rounded-lg bg-[#f9fafb] border border-neutral-200 flex items-start gap-3">
            <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-neutral-900">
                Otoritas Pengesahan Dikhususkan untuk Ketua Umum
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Anda saat ini login sebagai <strong>{currentUser.roleLabel}</strong>. Sesuai
                ketentuan sistem, pengesahan konsensus TOPSIS + Borda hanya dapat dijalankan melalui akun
                Ketua Umum.
              </p>
              <p className="text-neutral-500 pt-1">
                Status:{' '}
                <strong className="text-neutral-800">
                  {consensusResult
                    ? 'Konsensus sudah disahkan oleh Ketua. Lihat hasil pada menu Hasil & Berita Acara.'
                    : isConsensusReady
                    ? `Penilaian ${totalDMs}/${totalDMs} sudah lengkap. Menunggu Ketua melakukan pengesahan.`
                    : `Menunggu kelengkapan penilaian (${completedCount}/${totalDMs} selesai).`}
                </strong>
              </p>
            </div>
          </div>
        ) : !isConsensusReady ? (
          <div className="p-8 rounded-lg border border-dashed border-neutral-300 bg-[#f9fafb] text-center space-y-2">
            <Clock className="w-6 h-6 text-amber-500 mx-auto" />
            <h4 className="font-bold text-neutral-900 text-sm">
              Menunggu Seluruh Pengambil Keputusan Menyelesaikan Penilaian TOPSIS
            </h4>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Tombol pengesahan di akun Ketua akan aktif otomatis setelah seluruh {totalDMs} pengurus
              mengirimkan penilaiannya ({completedCount}/{totalDMs} selesai).
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-lg border border-purple-200 bg-purple-50/40 text-center space-y-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
            <div>
              <h4 className="font-bold text-neutral-900 text-sm">
                Seluruh Matriks TOPSIS Lengkap ({totalDMs}/{totalDMs} Selesai)
              </h4>
              <p className="text-xs text-neutral-600 mt-1">
                Klik tombol di bawah ini untuk menggabungkan peringkat TOPSIS menggunakan Metode Borda dan mengesahkan prioritas atas nama <strong>{currentUser.name}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleExecute}
                disabled={isExecuting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-200" />
                <span>
                  {isExecuting
                    ? 'Menghitung & Menyimpan...'
                    : 'Hitung & Sahkan Konsensus (TOPSIS + Borda)'}
                </span>
              </button>

              {consensusResult && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Buka kembali sesi konsensus untuk menghitung ulang?')) {
                      await resetConsensus();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-xs transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Pengesahan</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
