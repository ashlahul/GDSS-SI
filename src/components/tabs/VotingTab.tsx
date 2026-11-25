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

const BENEFIT_OPTIONS = [
  { value: 5, label: '5 - Sangat Tinggi' },
  { value: 4, label: '4 - Tinggi' },
  { value: 3, label: '3 - Cukup' },
  { value: 2, label: '2 - Kurang' },
  { value: 1, label: '1 - Rendah' },
];

const COST_OPTIONS = [
  { value: 1, label: '1 - Sangat Hemat' },
  { value: 2, label: '2 - Hemat' },
  { value: 3, label: '3 - Sedang' },
  { value: 4, label: '4 - Mahal' },
  { value: 5, label: '5 - Sangat Mahal' },
];

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

  const computedByProkerId = useMemo(
    () => new Map(liveTopsis.rows.map((r) => [r.prokerId, r])),
    [liveTopsis]
  );

  const hasScoreVariation = useMemo(
    () => liveTopsis.rows.some((r) => r.preferenceScore > 0),
    [liveTopsis]
  );

  const sortedPreviewRows = useMemo(
    () => [...liveTopsis.rows].sort((a, b) => a.rank - b.rank),
    [liveTopsis]
  );

  const prokerById = useMemo(
    () => new Map(programKerjaList.map((p) => [p.id, p])),
    [programKerjaList]
  );

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

  const formatRupiahShort = (val: number) =>
    val >= 1_000_000
      ? `Rp ${(val / 1_000_000).toFixed(1).replace('.', ',')} Jt`
      : new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0,
        }).format(val);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white p-6 space-y-4 select-none">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-purple-600" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Penilaian Individu
            </h1>
            <p className="text-xs text-neutral-500">
              Pilih skor tiap kriteria untuk <strong>{currentUser.roleLabel}</strong> — peringkat dihitung otomatis dengan TOPSIS.
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border self-start sm:self-auto ${
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

      {justSaved && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Penilaian tersimpan!</strong> Skor TOPSIS & poin Borda Anda sudah masuk ke database.
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToConsensus}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            <span>Lihat Konsensus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Single Compact Criteria Weight Bar */}
      <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#f9fafb] border border-neutral-200 text-[11px]">
        <span className="font-semibold text-neutral-500 mr-1">Bobot TOPSIS:</span>
        {TOPSIS_CRITERIA.map((c) => (
          <span
            key={c.id}
            title={c.description}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700"
          >
            <strong className="font-mono text-neutral-900">{c.code}</strong>
            <span>{c.shortName}</span>
            <span className="text-neutral-400 font-mono">
              {Math.round(c.weight * 100)}%
            </span>
            {c.type === 'COST' && (
              <span className="px-1 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                COST
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Clean Scoring Table */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f9fafb] border-b border-neutral-200 text-[11px] font-semibold text-neutral-500">
            <tr>
              <th className="py-2.5 px-3.5">Program Kerja</th>
              {TOPSIS_CRITERIA.map((c) => (
                <th key={c.id} className="py-2.5 px-2.5 whitespace-nowrap">
                  <span>{c.code}: {c.shortName}</span>
                  <span className="ml-1 font-normal text-neutral-400">
                    ({Math.round(c.weight * 100)}%)
                  </span>
                </th>
              ))}
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Hasil TOPSIS</th>
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
                    hasScoreVariation && rank === 1
                      ? 'bg-purple-50/30 hover:bg-purple-50/50'
                      : 'hover:bg-neutral-50/80'
                  }`}
                >
                  <td className="py-3 px-3.5 min-w-[230px]">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono shrink-0">
                        {proker.code}
                      </span>
                      <span className="font-semibold text-neutral-900 leading-snug">
                        {proker.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {proker.divisi} • {formatRupiahShort(proker.anggaran)}
                    </div>
                  </td>

                  {TOPSIS_CRITERIA.map((c) => {
                    const options = c.type === 'COST' ? COST_OPTIONS : BENEFIT_OPTIONS;
                    return (
                      <td key={c.id} className="py-3 px-2.5 whitespace-nowrap">
                        <select
                          aria-label={`${c.code} ${c.name} untuk ${proker.name}`}
                          value={rowScores[c.id]}
                          onChange={(e) =>
                            handleScoreChange(proker.id, c.id, Number(e.target.value))
                          }
                          className="h-8 px-2 rounded border border-neutral-200 bg-white hover:border-neutral-300 focus:outline-none focus:border-purple-500 text-xs font-medium text-neutral-800 cursor-pointer"
                        >
                          {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}

                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    {hasScoreVariation ? (
                      <div className="inline-flex items-center gap-2 justify-end">
                        <div className="text-right">
                          <div className="text-[11px] font-mono font-bold text-purple-700">
                            +{bordaPts} pts
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400">
                            V = {vScore.toFixed(3)}
                          </div>
                        </div>
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
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400 font-mono">
                        V = 0.000
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Actions + Optional TOPSIS Breakdown Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => setShowSteps((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-purple-700 transition-colors cursor-pointer"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{showSteps ? 'Sembunyikan' : 'Lihat'} detail hitungan TOPSIS</span>
          {showSteps ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          type="button"
          disabled={isSaving || programKerjaList.length === 0}
          onClick={handleSubmit}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Penilaian'}</span>
        </button>
      </div>

      {showSteps && (
        <div className="rounded-lg border border-neutral-200 bg-[#f9fafb] p-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-2.5 rounded bg-white border border-emerald-200">
              <span className="font-bold text-emerald-800 mr-2">Ideal Positif (A⁺):</span>
              <span className="font-mono text-emerald-700">
                {liveTopsis.idealPositive.c1.toFixed(3)} • {liveTopsis.idealPositive.c2.toFixed(3)} •{' '}
                {liveTopsis.idealPositive.c3.toFixed(3)} • {liveTopsis.idealPositive.c4.toFixed(3)}
              </span>
            </div>
            <div className="p-2.5 rounded bg-white border border-rose-200">
              <span className="font-bold text-rose-800 mr-2">Ideal Negatif (A⁻):</span>
              <span className="font-mono text-rose-700">
                {liveTopsis.idealNegative.c1.toFixed(3)} • {liveTopsis.idealNegative.c2.toFixed(3)} •{' '}
                {liveTopsis.idealNegative.c3.toFixed(3)} • {liveTopsis.idealNegative.c4.toFixed(3)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
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
                  <th className="py-2 px-2.5 text-center">Vᵢ</th>
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
