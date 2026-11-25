'use client';

import React, { useState, useMemo } from 'react';
import { useGDSS } from '@/context/GDSSContext';
import {
  TOPSIS_CRITERIA,
  TopsisScoreInput,
  computeTopsis,
} from '@/lib/topsis';
import {
  ListOrdered,
  CheckCircle2,
  AlertCircle,
  Info,
  Crown,
  ArrowRight,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ProgramKerja, DecisionMaker, DecisionMakerVote } from '@/types/gdss';

interface VotingListFormProps {
  currentUser: DecisionMaker;
  programKerjaList: ProgramKerja[];
  currentVote: DecisionMakerVote | undefined;
  submitVote: (userId: string, criteriaInputs: TopsisScoreInput[]) => Promise<void>;
  onNavigateToConsensus: () => void;
}

const SCORE_LEVELS = [1, 2, 3, 4, 5] as const;

const VotingListForm: React.FC<VotingListFormProps> = ({
  currentUser,
  programKerjaList,
  currentVote,
  submitVote,
  onNavigateToConsensus,
}) => {
  const hasSubmitted = Boolean(
    currentVote &&
      currentVote.submittedAt &&
      currentVote.rankings.length === programKerjaList.length &&
      programKerjaList.length > 0
  );

  const initialScores = useMemo(() => {
    const map: Record<string, { c1: number; c2: number; c3: number; c4: number }> = {};
    for (const p of programKerjaList) {
      const existing = currentVote?.rankings.find((r) => r.prokerId === p.id);
      map[p.id] = {
        c1: existing?.c1Score ?? 3,
        c2: existing?.c2Score ?? 3,
        c3: existing?.c3Score ?? 3,
        c4: existing?.c4Score ?? 3,
      };
    }
    return map;
  }, [programKerjaList, currentVote]);

  const [scoresMap, setScoresMap] =
    useState<Record<string, { c1: number; c2: number; c3: number; c4: number }>>(
      initialScores
    );
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const inputs: TopsisScoreInput[] = useMemo(
    () =>
      programKerjaList.map((p) => ({
        prokerId: p.id,
        c1: scoresMap[p.id]?.c1 ?? 3,
        c2: scoresMap[p.id]?.c2 ?? 3,
        c3: scoresMap[p.id]?.c3 ?? 3,
        c4: scoresMap[p.id]?.c4 ?? 3,
      })),
    [programKerjaList, scoresMap]
  );

  const liveTopsis = useMemo(() => computeTopsis(inputs), [inputs]);

  const computedByProkerId = useMemo(() => {
    return new Map(liveTopsis.rows.map((r) => [r.prokerId, r]));
  }, [liveTopsis]);

  const sortedPreviewRows = useMemo(() => {
    return [...liveTopsis.rows].sort((a, b) => a.rank - b.rank);
  }, [liveTopsis]);

  const handleScoreChange = (
    prokerId: string,
    criterionId: 'c1' | 'c2' | 'c3' | 'c4',
    value: number
  ) => {
    setScoresMap((prev) => ({
      ...prev,
      [prokerId]: {
        ...(prev[prokerId] ?? { c1: 3, c2: 3, c3: 3, c4: 3 }),
        [criterionId]: value,
      },
    }));
    setIsDirty(true);
    setJustSaved(false);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    await submitVote(currentUser.id, inputs);
    setIsSaving(false);
    setIsDirty(false);
    setJustSaved(true);
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const prokerById = useMemo(
    () => new Map(programKerjaList.map((p) => [p.id, p])),
    [programKerjaList]
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white p-6 space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-purple-600" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Penilaian Individu (TOPSIS)
            </h1>
            <p className="text-[11px] text-neutral-500">
              Nilai tiap proker pada 4 kriteria; sistem menghitung preferensi TOPSIS (<em>V<sub>i</sub></em>) & mengonversinya menjadi poin Borda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.isHighestRole && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <Crown className="w-3.5 h-3.5" /> Ketua Umum
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border ${
              isDirty
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : hasSubmitted
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isDirty ? (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>BELUM DISIMPAN</span>
              </>
            ) : hasSubmitted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>TERSIMPAN</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>BELUM MENILAI</span>
              </>
            )}
          </span>
        </div>
      </div>

      {justSaved && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Perhitungan TOPSIS tersimpan!</strong> Skor <em>V<sub>i</sub></em> dan poin Borda Anda telah masuk ke PostgreSQL.
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToConsensus}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            <span>Lihat Status Konsensus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 TOPSIS Criteria Legend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TOPSIS_CRITERIA.map((c) => (
          <div
            key={c.id}
            className="p-3 rounded-lg border border-neutral-200 bg-[#f9fafb] space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-neutral-900 font-mono">
                {c.code} • {Math.round(c.weight * 100)}%
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  c.type === 'BENEFIT'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {c.type}
              </span>
            </div>
            <p className="text-xs font-semibold text-neutral-800 leading-snug">
              {c.name}
            </p>
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              {c.description}
            </p>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="p-3 rounded-lg bg-[#f9fafb] border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <span>
          <strong>Aturan Hybrid TOPSIS + Borda:</strong> Beri skor <strong>1–5</strong> pada tiap kriteria untuk {currentUser.roleLabel}. Pada kriteria <strong>C4 (Cost)</strong>, nilai <strong>1</strong> berarti paling hemat/ideal dan <strong>5</strong> berarti biaya/risiko paling tinggi. Peringkat dari nilai preferensi TOPSIS (<em>V<sub>i</sub></em>) otomatis dikonversi ke poin Borda.
        </span>
      </div>

      {/* TOPSIS Input Matrix Table */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f9fafb] border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 select-none">
            <tr>
              <th className="py-2.5 px-3.5">Program Kerja</th>
              {TOPSIS_CRITERIA.map((c) => (
                <th key={c.id} className="py-2.5 px-2.5 text-center whitespace-nowrap">
                  <div>
                    {c.code}: {c.shortName}
                  </div>
                  <div className="text-[10px] font-normal text-neutral-400">
                    {Math.round(c.weight * 100)}% • {c.type === 'COST' ? 'Cost' : 'Benefit'}
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-3 text-center whitespace-nowrap">
                Skor TOPSIS (<em>V<sub>i</sub></em>)
              </th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Rank</th>
              <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Poin Borda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {programKerjaList.map((proker) => {
              const rowScores = scoresMap[proker.id] ?? { c1: 3, c2: 3, c3: 3, c4: 3 };
              const computed = computedByProkerId.get(proker.id);
              const rank = computed?.rank ?? programKerjaList.length;
              const bordaPts = computed?.bordaPoints ?? 1;
              const vScore = computed?.preferenceScore ?? 0;

              return (
                <tr
                  key={proker.id}
                  className={`transition-colors ${
                    rank === 1 ? 'bg-purple-50/30 hover:bg-purple-50/50' : 'hover:bg-neutral-50/80'
                  }`}
                >
                  <td className="py-3 px-3.5 min-w-[220px]">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                        {proker.code}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {formatRupiah(proker.anggaran)}
                      </span>
                    </div>
                    <div className="font-semibold text-neutral-900 leading-snug">
                      {proker.name}
                    </div>
                    <div className="text-[10px] text-neutral-400">{proker.divisi}</div>
                  </td>

                  {TOPSIS_CRITERIA.map((c) => {
                    const currentVal = rowScores[c.id];
                    const isCost = c.type === 'COST';
                    return (
                      <td key={c.id} className="py-3 px-2.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center rounded border border-neutral-200 bg-neutral-50 p-0.5 gap-0.5">
                          {SCORE_LEVELS.map((lvl) => {
                            const active = currentVal === lvl;
                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => handleScoreChange(proker.id, c.id, lvl)}
                                className={`w-6 h-6 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                                  active
                                    ? isCost
                                      ? 'bg-amber-600 text-white shadow-2xs'
                                      : 'bg-purple-600 text-white shadow-2xs'
                                    : 'text-neutral-500 hover:bg-white hover:text-neutral-900'
                                }`}
                                title={`${c.code} (${c.name}): ${lvl}`}
                              >
                                {lvl}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}

                  <td className="py-3 px-3 text-center font-mono font-bold text-neutral-900 tabular-nums">
                    {vScore.toFixed(4)}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded font-mono font-bold text-xs ${
                        rank === 1
                          ? 'bg-purple-600 text-white'
                          : rank === 2
                          ? 'bg-emerald-600 text-white'
                          : rank === 3
                          ? 'bg-neutral-800 text-white'
                          : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                      }`}
                    >
                      #{rank}
                    </span>
                  </td>

                  <td className="py-3 px-3.5 text-center font-mono font-bold text-purple-600 whitespace-nowrap">
                    +{bordaPts} pts
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Collapsible Step-by-Step TOPSIS Math Inspection */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowSteps((prev) => !prev)}
          className="w-full px-4 py-3 bg-[#f9fafb] hover:bg-neutral-100/70 flex items-center justify-between text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-600" />
            <span>
              Detail Perhitungan TOPSIS (Normalisasi Terbobot <em>Y</em>, Jarak{' '}
              <em>D<sup>+</sup> / D<sup>-</sup></em>, & Peringkat Individu)
            </span>
          </span>
          {showSteps ? (
            <ChevronUp className="w-4 h-4 text-neutral-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          )}
        </button>

        {showSteps && (
          <div className="p-4 space-y-4 border-t border-neutral-200 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <div className="font-bold text-emerald-900 mb-1">
                  Solusi Ideal Positif (A⁺)
                </div>
                <div className="font-mono text-emerald-800 flex flex-wrap gap-3">
                  <span>C1: {liveTopsis.idealPositive.c1.toFixed(4)}</span>
                  <span>C2: {liveTopsis.idealPositive.c2.toFixed(4)}</span>
                  <span>C3: {liveTopsis.idealPositive.c3.toFixed(4)}</span>
                  <span>C4: {liveTopsis.idealPositive.c4.toFixed(4)}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200">
                <div className="font-bold text-rose-900 mb-1">
                  Solusi Ideal Negatif (A⁻)
                </div>
                <div className="font-mono text-rose-800 flex flex-wrap gap-3">
                  <span>C1: {liveTopsis.idealNegative.c1.toFixed(4)}</span>
                  <span>C2: {liveTopsis.idealNegative.c2.toFixed(4)}</span>
                  <span>C3: {liveTopsis.idealNegative.c3.toFixed(4)}</span>
                  <span>C4: {liveTopsis.idealNegative.c4.toFixed(4)}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded border border-neutral-200">
              <table className="w-full text-left text-[11px] tabular-nums">
                <thead className="bg-[#f9fafb] border-b border-neutral-200 text-neutral-500 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">Proker</th>
                    <th className="py-2 px-2.5 text-center">Y₁</th>
                    <th className="py-2 px-2.5 text-center">Y₂</th>
                    <th className="py-2 px-2.5 text-center">Y₃</th>
                    <th className="py-2 px-2.5 text-center">Y₄</th>
                    <th className="py-2 px-2.5 text-center">D⁺</th>
                    <th className="py-2 px-2.5 text-center">D⁻</th>
                    <th className="py-2 px-2.5 text-center">Vᵢ = D⁻/(D⁺+D⁻)</th>
                    <th className="py-2 px-3 text-center">Borda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono">
                  {sortedPreviewRows.map((row) => {
                    const p = prokerById.get(row.prokerId);
                    return (
                      <tr key={row.prokerId} className="hover:bg-neutral-50">
                        <td className="py-2 px-3 font-bold text-purple-700">#{row.rank}</td>
                        <td className="py-2 px-3 font-sans font-semibold text-neutral-900">
                          {p?.code} — {p?.name}
                        </td>
                        <td className="py-2 px-2.5 text-center">{row.weighted.c1.toFixed(3)}</td>
                        <td className="py-2 px-2.5 text-center">{row.weighted.c2.toFixed(3)}</td>
                        <td className="py-2 px-2.5 text-center">{row.weighted.c3.toFixed(3)}</td>
                        <td className="py-2 px-2.5 text-center">{row.weighted.c4.toFixed(3)}</td>
                        <td className="py-2 px-2.5 text-center text-rose-700">
                          {row.dPlus.toFixed(4)}
                        </td>
                        <td className="py-2 px-2.5 text-center text-emerald-700">
                          {row.dMinus.toFixed(4)}
                        </td>
                        <td className="py-2 px-2.5 text-center font-bold text-neutral-900">
                          {row.preferenceScore.toFixed(4)}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-purple-700">
                          +{row.bordaPoints}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Save Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <p className="text-xs text-neutral-500">
          Penilai aktif: <strong className="text-neutral-800">{currentUser.name}</strong> ({currentUser.roleLabel}).
        </p>

        <button
          type="button"
          disabled={isSaving || programKerjaList.length === 0}
          onClick={handleSubmit}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            {isSaving ? 'Menghitung & Menyimpan...' : 'Hitung TOPSIS & Simpan Penilaian'}
          </span>
        </button>
      </div>
    </div>
  );
};

export const VotingTab: React.FC<{ onNavigateToConsensus: () => void }> = ({
  onNavigateToConsensus,
}) => {
  const { currentUser, programKerjaList, votes, submitVote } = useGDSS();
  const currentVote = votes[currentUser.id];

  const formKey = `${currentUser.id}-${programKerjaList.map((p) => p.id).join(',')}-${
    currentVote?.submittedAt || 'draft'
  }`;

  return (
    <VotingListForm
      key={formKey}
      currentUser={currentUser}
      programKerjaList={programKerjaList}
      currentVote={currentVote}
      submitVote={submitVote}
      onNavigateToConsensus={onNavigateToConsensus}
    />
  );
};
