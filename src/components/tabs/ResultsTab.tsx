'use client';

import React, { useState } from 'react';
import { useGDSS } from '@/context/GDSSContext';
import {
  Trophy,
  Printer,
  Clock,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import { PrintBeritaAcara } from '@/components/PrintBeritaAcara';

export const ResultsTab: React.FC<{ onNavigateToConsensus: () => void }> = ({
  onNavigateToConsensus,
}) => {
  const { consensusResult, decisionMakers, currentUser, refreshData, isLoadingData } =
    useGDSS();
  const [subTab, setSubTab] = useState<'matrix' | 'chart'>('matrix');

  if (!consensusResult) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400">
          <Clock className="w-6 h-6" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-base font-bold text-neutral-900">
            Hasil Konsensus Belum Tersedia
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Seluruh pengambil keputusan harus menyelesaikan penilaian TOPSIS individu terlebih dahulu, lalu{' '}
            <strong>Ketua Umum (Jabatan Tertinggi)</strong> mengesahkan konsensus Borda pada menu{' '}
            <strong>Konsensus Borda</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToConsensus}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition cursor-pointer"
        >
          <span>Ke Konsensus Borda</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const details = consensusResult.details;
  const maxPossiblePoints = details.length * (decisionMakers.length || 4);
  const topWinner = details[0];

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 bg-white p-6 space-y-5 select-none print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                Hasil & Berita Acara Konsensus
              </h1>
              <p className="text-[11px] text-neutral-500">
                Disahkan oleh <strong>{consensusResult.authorizedBy}</strong> ({new Date(consensusResult.calculatedAt).toLocaleString('id-ID')}) • Diakses oleh <strong>{currentUser.roleLabel}</strong>
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
              <RotateCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>Sinkronkan</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Berita Acara PDF</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-6 border-b border-neutral-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => setSubTab('matrix')}
            className={`pb-2.5 transition-colors cursor-pointer ${
              subTab === 'matrix'
                ? 'text-purple-600 border-b-2 border-purple-600 font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent'
            }`}
          >
            Matriks Transparansi
          </button>
          <button
            type="button"
            onClick={() => setSubTab('chart')}
            className={`pb-2.5 transition-colors cursor-pointer ${
              subTab === 'chart'
                ? 'text-purple-600 border-b-2 border-purple-600 font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent'
            }`}
          >
            Grafik & Podium
          </button>
        </div>

        {/* KPI Cards Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs">
            <span className="text-[11px] text-neutral-500 font-medium">Prioritas #1</span>
            <div className="text-base font-bold text-purple-700 mt-1 truncate">
              {topWinner?.proker.code} ({topWinner?.totalBordaPoints} pts)
            </div>
          </div>

          <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs">
            <span className="text-[11px] text-neutral-500 font-medium">Total Alternatif</span>
            <div className="text-xl font-bold text-neutral-900 mt-1 tabular-nums">
              {details.length} Proker
            </div>
          </div>

          <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs">
            <span className="text-[11px] text-neutral-500 font-medium">Skor Maksimal</span>
            <div className="text-xl font-bold text-neutral-900 mt-1 tabular-nums">
              {maxPossiblePoints} Poin
            </div>
          </div>

          <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs">
            <span className="text-[11px] text-neutral-500 font-medium">Status Pengesahan</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">Sah</div>
          </div>
        </div>

        {subTab === 'matrix' ? (
          /* Matriks Transparansi Table (KafaBot Table Style) */
          <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9fafb] border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 select-none">
                <tr>
                  <th className="py-2.5 px-3.5 text-center">Rank</th>
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Program Kerja</th>
                  <th className="py-2.5 px-3 text-right">Est. Anggaran</th>
                  <th className="py-2.5 px-3 text-center">Ketua</th>
                  <th className="py-2.5 px-3 text-center">Wakil Ketua</th>
                  <th className="py-2.5 px-3 text-center">Sekretaris</th>
                  <th className="py-2.5 px-3 text-center">Bendahara</th>
                  <th className="py-2.5 px-3 text-center">Total Poin</th>
                  <th className="py-2.5 px-3.5">Status Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700 tabular-nums">
                {details.map((row) => (
                  <tr key={row.proker.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 text-center font-mono font-bold text-neutral-900">
                      #{row.finalRank}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                        {row.proker.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-blue-600">{row.proker.name}</span>
                      <span className="block text-[10px] text-neutral-400">
                        {row.proker.divisi}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-neutral-700 whitespace-nowrap">
                      {formatRupiah(row.proker.anggaran)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <div>
                        #{row.ketuaRank}{' '}
                        <span className="text-purple-600 font-semibold">({row.ketuaPoints})</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        V={row.ketuaTopsis.toFixed(3)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <div>
                        #{row.wakilRank}{' '}
                        <span className="text-indigo-600 font-semibold">({row.wakilPoints})</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        V={row.wakilTopsis.toFixed(3)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <div>
                        #{row.sekretarisRank}{' '}
                        <span className="text-emerald-600 font-semibold">({row.sekretarisPoints})</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        V={row.sekretarisTopsis.toFixed(3)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <div>
                        #{row.bendaharaRank}{' '}
                        <span className="text-blue-600 font-semibold">({row.bendaharaPoints})</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        V={row.bendaharaTopsis.toFixed(3)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-purple-700">
                      {row.totalBordaPoints}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
                          row.statusRecommendation === 'Prioritas Utama'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : row.statusRecommendation === 'Prioritas Kedua'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {row.statusRecommendation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Chart & Podium Tab */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {details.slice(0, 3).map((item, idx) => (
                <div
                  key={item.proker.id}
                  className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          idx === 0
                            ? 'bg-purple-600 text-white'
                            : idx === 1
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-800 text-white'
                        }`}
                      >
                        Prioritas #{item.finalRank}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-neutral-400">
                        {item.proker.code}
                      </span>
                    </div>
                    <h4 className="font-bold text-neutral-900 text-xs leading-snug">
                      {item.proker.name}
                    </h4>
                  </div>
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-purple-700">
                      {item.totalBordaPoints} / {maxPossiblePoints} poin
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {item.statusRecommendation}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3 shadow-2xs">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Grafik Perbandingan Skor Borda
              </h3>
              <div className="space-y-3">
                {details.map((row) => {
                  const pct = Math.round((row.totalBordaPoints / maxPossiblePoints) * 100);
                  return (
                    <div key={row.proker.id} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-neutral-800">
                          <span className="font-mono text-purple-600 mr-1.5">
                            #{row.finalRank} {row.proker.code}
                          </span>
                          {row.proker.name}
                        </span>
                        <span className="font-mono font-bold text-neutral-900">
                          {row.totalBordaPoints} poin ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-purple-600 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print-only Berita Acara */}
      <PrintBeritaAcara
        consensusResult={consensusResult}
        decisionMakers={decisionMakers}
      />
    </>
  );
};
