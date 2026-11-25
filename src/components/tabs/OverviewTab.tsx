'use client';

import React, { useMemo } from 'react';
import { useGDSS } from '@/context/GDSSContext';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Clock,
  CheckCircle2,
  Crown,
  ListOrdered,
  Scale,
  ArrowRight,
  RotateCw,
} from 'lucide-react';

export const OverviewTab: React.FC<{ onNavigate: (tab: string) => void }> = ({
  onNavigate,
}) => {
  const {
    currentUser,
    decisionMakers,
    programKerjaList,
    votes,
    consensusResult,
    isConsensusReady,
    refreshData,
    isLoadingData,
  } = useGDSS();

  const totalProker = programKerjaList.length;

  const completedCount = useMemo(
    () =>
      decisionMakers.filter((dm) => {
        const v = votes[dm.id];
        return (
          v &&
          v.submittedAt &&
          v.rankings.length === totalProker &&
          totalProker > 0
        );
      }).length,
    [decisionMakers, votes, totalProker]
  );

  const userVote = votes[currentUser.id];
  const hasUserVoted = Boolean(
    userVote &&
      userVote.submittedAt &&
      userVote.rankings.length === totalProker &&
      totalProker > 0
  );

  const totalBudget = useMemo(
    () => programKerjaList.reduce((sum, p) => sum + p.anggaran, 0),
    [programKerjaList]
  );

  const totalDMs = decisionMakers.length || 4;

  const liveScores = useMemo(() => {
    const n = programKerjaList.length;
    const kVotes = votes['dm-ketua']?.rankings || [];
    const wVotes = votes['dm-wakil']?.rankings || [];
    const sVotes = votes['dm-sekretaris']?.rankings || [];
    const bVotes = votes['dm-bendahara']?.rankings || [];

    return programKerjaList.map((proker) => {
      const kPts = kVotes.find((r) => r.prokerId === proker.id)?.bordaPoints || 0;
      const wPts = wVotes.find((r) => r.prokerId === proker.id)?.bordaPoints || 0;
      const sPts = sVotes.find((r) => r.prokerId === proker.id)?.bordaPoints || 0;
      const bPts = bVotes.find((r) => r.prokerId === proker.id)?.bordaPoints || 0;
      const total = kPts + wPts + sPts + bPts;
      const maxPts = Math.max(1, n * totalDMs);
      return {
        proker,
        kPts,
        wPts,
        sPts,
        bPts,
        total,
        pct: Math.round((total / maxPts) * 100),
      };
    });
  }, [programKerjaList, votes, totalDMs]);

  const sortedLiveScores = useMemo(
    () => [...liveScores].sort((a, b) => b.total - a.total),
    [liveScores]
  );

  const maxLiveScore = useMemo(
    () => Math.max(1, ...liveScores.map((s) => s.total)),
    [liveScores]
  );

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#fbfbfc] p-6 space-y-6 select-none">
      {/* Top Header Row (1:1 KafaBot Dashboard) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Dashboard GDSS & Ringkasan
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Masuk sebagai <strong className="text-neutral-800">{currentUser.name}</strong> ({currentUser.roleLabel}) • Pantau penilaian TOPSIS & konsensus Borda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refreshData()}
            disabled={isLoadingData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-purple-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate(consensusResult ? 'results' : 'voting')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            {consensusResult ? (
              <>
                <Scale className="w-3.5 h-3.5" />
                <span>Lihat Hasil Konsensus</span>
              </>
            ) : (
              <>
                <ListOrdered className="w-3.5 h-3.5" />
                <span>{hasUserVoted ? 'Edit Penilaian Saya' : '+ Mulai Penilaian'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section 1: 4 KPI Cards (KafaBot Card Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Total Estimasi Anggaran
          </span>
          <div className="text-2xl font-bold text-neutral-900 tabular-nums">
            {formatRupiah(totalBudget)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <span>●</span>
            <span>{totalProker} program kerja kandidat</span>
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Partisipasi Penilai
          </span>
          <div className="text-2xl font-bold text-purple-700 tabular-nums">
            {completedCount} / {totalDMs} DM
          </div>
          <p className="text-[11px] text-neutral-500">
            Ketua, Wakil, Sekretaris & Bendahara
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Penilaian Anda
          </span>
          <div className="text-2xl font-bold text-neutral-900">
            {hasUserVoted ? 'Tersimpan' : 'Belum Diisi'}
          </div>
          <p
            className={`text-[11px] font-medium ${
              hasUserVoted ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {hasUserVoted
              ? 'Skor TOPSIS siap diagregasi Borda'
              : 'Segera isi matriks kriteria TOPSIS Anda'}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Status Konsensus
          </span>
          <div className="text-2xl font-bold text-neutral-900">
            {consensusResult
              ? 'Disahkan'
              : isConsensusReady
              ? 'Siap Sah'
              : 'Menunggu'}
          </div>
          <p className="text-[11px] text-neutral-500">
            {consensusResult
              ? `Oleh ${consensusResult.authorizedBy}`
              : 'Otoritas pengesahan di akun Ketua'}
          </p>
        </div>
      </div>

      {/* Section 2: Grafik Akumulasi Skor Borda (KafaBot Purple Chart Style) */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-800">
              Distribusi Skor Borda (Hasil TOPSIS) per Program Kerja
            </h3>
            <p className="text-xs text-neutral-500">
              Akumulasi poin Borda dari peringkat TOPSIS Ketua, Wakil Ketua, Sekretaris, dan Bendahara secara real-time
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            TOPSIS + Borda
          </span>
        </div>

        {liveScores.every((s) => s.total === 0) ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            Belum ada penilaian yang masuk. Grafik skor Borda akan muncul setelah pengambil keputusan mengisi penilaian.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {sortedLiveScores.map((item, idx) => {
              const widthPct = Math.round((item.total / maxLiveScore) * 100);
              return (
                <div key={item.proker.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-800 flex items-center gap-2 truncate pr-4">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-purple-600 font-semibold">
                        {item.proker.code}
                      </span>
                      <span className="truncate">{item.proker.name}</span>
                    </span>
                    <span className="font-mono font-bold text-neutral-900 shrink-0">
                      {item.total} poin
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: Bottom Two Tables (1:1 KafaBot Dashboard Bottom Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-4">
        {/* Table 1: Alternatif Program Kerja */}
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-neutral-200 bg-[#f9fafb] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Alternatif Program Kerja
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('proker')}
              className="text-[11px] font-semibold text-purple-600 hover:underline cursor-pointer"
            >
              Kelola Proker →
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50/50 text-[11px] text-neutral-500 font-medium">
              <tr>
                <th className="py-2.5 px-4">Program Kerja</th>
                <th className="py-2.5 px-3 text-center">Skor</th>
                <th className="py-2.5 px-4 text-right">Estimasi Anggaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {sortedLiveScores.map((item, idx) => (
                <tr key={item.proker.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-3 px-4 font-medium text-neutral-900 flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[200px]">{item.proker.name}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold font-mono text-[11px]">
                      {item.total} pts
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-neutral-900 whitespace-nowrap">
                    {formatRupiah(item.proker.anggaran)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table 2: Status Decision Makers */}
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-neutral-200 bg-[#f9fafb] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Status {totalDMs} Decision Maker
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('consensus')}
              className="text-[11px] font-semibold text-purple-600 hover:underline cursor-pointer"
            >
              Panel Konsensus →
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50/50 text-[11px] text-neutral-500 font-medium">
              <tr>
                <th className="py-2.5 px-4">Pengurus</th>
                <th className="py-2.5 px-3">Jabatan</th>
                <th className="py-2.5 px-4 text-right">Status Penilaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {decisionMakers.map((dm) => {
                const v = votes[dm.id];
                const done = Boolean(
                  v && v.submittedAt && v.rankings.length === totalProker && totalProker > 0
                );
                return (
                  <tr key={dm.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900">{dm.name}</span>
                        {dm.isHighestRole && (
                          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        {dm.nim} • {dm.email}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-neutral-600">{dm.roleLabel}</td>
                    <td className="py-3 px-4 text-right">
                      {done ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> SELESAI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> MENUNGGU
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="p-4 bg-[#f9fafb] border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              {isConsensusReady
                ? `Semua ${totalDMs} DM telah selesai menilai.`
                : `Menunggu ${totalDMs - completedCount} pengambil keputusan lagi.`}
            </span>
            <button
              type="button"
              onClick={() => onNavigate('voting')}
              className="inline-flex items-center gap-1 text-purple-600 font-semibold hover:underline cursor-pointer"
            >
              <span>Nilai Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
