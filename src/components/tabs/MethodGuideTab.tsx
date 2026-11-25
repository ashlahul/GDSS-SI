'use client';

import React from 'react';
import { useGDSS } from '@/context/GDSSContext';
import { TOPSIS_CRITERIA } from '@/lib/topsis';
import {
  BookOpen,
  CheckCircle2,
  Crown,
  Scale,
  Users,
  Award,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

export const MethodGuideTab: React.FC<{ onNavigate: (tab: string) => void }> = ({
  onNavigate,
}) => {
  const { decisionMakers, programKerjaList, isConsensusReady, consensusResult } =
    useGDSS();

  const totalProker = programKerjaList.length;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white p-6 space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Alur & Metode Hybrid TOPSIS + Borda
            </h1>
            <p className="text-[11px] text-neutral-500">
              Penilaian multi-kriteria individu menggunakan TOPSIS dan agregasi kelompok menggunakan Borda Count
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(decisionMakers.length ? 'voting' : 'overview')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <span>Ke Penilaian TOPSIS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5-Step GDSS Workflow */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
          5 Tahap Pengambilan Keputusan Kelompok (Hybrid TOPSIS + Borda)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              step: '01',
              title: 'Alternatif Proker',
              desc: 'Menentukan kandidat program kerja beserta divisi, anggaran, dan target peserta.',
              done: totalProker > 0,
            },
            {
              step: '02',
              title: 'Matriks TOPSIS DM',
              desc: 'Ketua, Wakil Ketua, Sekretaris, dan Bendahara menilai tiap proker pada 4 kriteria (C1–C4).',
              done: true,
            },
            {
              step: '03',
              title: 'Ranking Vᵢ & Borda',
              desc: 'Sistem menghitung nilai preferensi TOPSIS (Vᵢ) tiap DM dan mengonversinya menjadi poin Borda.',
              done: isConsensusReady,
            },
            {
              step: '04',
              title: 'Konsensus Ketua',
              desc: 'Akun jabatan tertinggi (Ketua Umum) menggabungkan poin Borda keempat DM dan mengesahkan.',
              done: Boolean(consensusResult),
            },
            {
              step: '05',
              title: 'Hasil & Berita Acara',
              desc: 'Seluruh pengurus melihat matriks transparansi TOPSIS + Borda dan mencetak Berita Acara PDF.',
              done: Boolean(consensusResult),
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-lg p-3.5 border border-neutral-200 bg-[#f9fafb]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  STEP {item.step}
                </span>
                {item.done && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </div>
              <h3 className="text-xs font-bold text-neutral-900 mb-1">
                {item.title}
              </h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Criteria & Weights Table */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-600" />
          <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Kriteria & Bobot Penilaian TOPSIS (Skala 1–5)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TOPSIS_CRITERIA.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-lg border border-neutral-200 bg-[#f9fafb] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-700">
                  {c.code} ({Math.round(c.weight * 100)}%)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    c.type === 'BENEFIT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {c.type}
                </span>
              </div>
              <h3 className="text-xs font-bold text-neutral-900">{c.name}</h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                {c.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2 Columns: Decision Makers & Hybrid Formula */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              {decisionMakers.length || 4} Akun Decision Maker & Otoritas
            </h2>
          </div>

          <div className="space-y-2.5">
            {decisionMakers.map((dm) => (
              <div
                key={dm.id}
                className="p-3 rounded-lg border border-neutral-200 bg-[#f9fafb] flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {dm.isHighestRole ? (
                    <Crown className="w-3.5 h-3.5" />
                  ) : (
                    dm.name.charAt(0)
                  )}
                </div>
                <div className="text-xs min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-neutral-900">{dm.name}</span>
                      {dm.nim && (
                        <span className="ml-2 text-[10px] font-mono text-neutral-400">
                          ({dm.nim})
                        </span>
                      )}
                    </div>
                    {dm.isHighestRole ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        Jabatan Tertinggi
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-600">
                        {dm.roleLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {dm.role === 'KETUA' &&
                      'Menilai visi strategis organisasi & berhak mengesahkan konsensus akhir.'}
                    {dm.role === 'WAKIL_KETUA' &&
                      'Menilai sinergi antar-divisi, efektivitas koordinasi, dan keberlanjutan program.'}
                    {dm.role === 'SEKRETARIS' &&
                      'Menilai kesiapan administrasi, kalender kerja, dan sumber daya kader.'}
                    {dm.role === 'BENDAHARA' &&
                      'Menilai efisiensi anggaran, kelayakan dana, dan beban kas.'}
                    {dm.role === 'ANGGOTA' &&
                      'Memberikan penilaian TOPSIS independen sesuai perspektif divisi/anggotanya.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Formulasi Hybrid TOPSIS + Borda
              </h2>
            </div>

            <div className="space-y-2 text-xs text-neutral-600">
              <div className="p-3 rounded-lg bg-[#f9fafb] border border-neutral-200">
                <strong className="text-neutral-900 block mb-0.5">
                  1. TOPSIS per Pengambil Keputusan
                </strong>
                <span>
                  Matriks skor 1–5 dinormalisasi dengan{' '}
                  <code className="px-1 py-0.5 rounded bg-white border border-neutral-200 font-mono text-purple-700">
                    rᵢⱼ = xᵢⱼ / √Σxᵢⱼ²
                  </code>
                  , dikalikan bobot kriteria{' '}
                  <code className="px-1 py-0.5 rounded bg-white border border-neutral-200 font-mono text-purple-700">
                    yᵢⱼ = wⱼ·rᵢⱼ
                  </code>
                  , lalu dicari nilai preferensi{' '}
                  <code className="px-1 py-0.5 rounded bg-white border border-neutral-200 font-mono text-purple-700">
                    Vᵢ = Dᵢ⁻ / (Dᵢ⁺ + Dᵢ⁻)
                  </code>
                  .
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#f9fafb] border border-neutral-200">
                <strong className="text-neutral-900 block mb-0.5">
                  2. Konversi Peringkat TOPSIS ke Poin Borda
                </strong>
                <span>
                  Peringkat TOPSIS ke-<em>k</em> bernilai{' '}
                  <code className="px-1 py-0.5 rounded bg-white border border-neutral-200 font-mono text-purple-700">
                    N - k + 1
                  </code>
                  . Dengan {totalProker} proker, Rank #1 = {totalProker} poin dan Rank #{totalProker} = 1 poin.
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#f9fafb] border border-neutral-200">
                <strong className="text-neutral-900 block mb-0.5">
                  3. Agregasi Kelompok & Tie-Breaker
                </strong>
                <span>
                  Total skor kelompok = jumlah poin Borda dari 4 DM. Jika seri, diputuskan oleh
                  poin Ketua Umum, lalu akumulasi skor TOPSIS (<em>Vᵢ</em>).
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 flex items-center gap-2 text-xs text-purple-800 font-mono">
            <Scale className="w-4 h-4 shrink-0" />
            <span>Skor_Akhir(j) = Σ Borda(Rank_TOPSIS(DM_i, j))</span>
          </div>
        </div>
      </div>
    </div>
  );
};
