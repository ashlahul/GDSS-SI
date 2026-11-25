'use client';

import React, { useState, useMemo } from 'react';
import { useGDSS } from '@/context/GDSSContext';
import {
  ListOrdered,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  CheckCircle2,
  AlertCircle,
  Info,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { ProgramKerja, DecisionMaker, DecisionMakerVote } from '@/types/gdss';

interface VotingListFormProps {
  currentUser: DecisionMaker;
  programKerjaList: ProgramKerja[];
  currentVote: DecisionMakerVote | undefined;
  submitVote: (userId: string, rankedProkerIds: string[]) => Promise<void>;
  onNavigateToConsensus: () => void;
}

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

  const initialList = useMemo(() => {
    if (programKerjaList.length === 0) return [];
    if (currentVote && currentVote.rankings.length === programKerjaList.length) {
      return [...programKerjaList].sort((a, b) => {
        const rankA =
          currentVote.rankings.find((r) => r.prokerId === a.id)?.rank || 999;
        const rankB =
          currentVote.rankings.find((r) => r.prokerId === b.id)?.rank || 999;
        return rankA - rankB;
      });
    }
    return [...programKerjaList];
  }, [programKerjaList, currentVote]);

  const [orderedList, setOrderedList] = useState<ProgramKerja[]>(initialList);
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const moveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= orderedList.length || fromIdx === toIdx) return;
    const next = [...orderedList];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setOrderedList(next);
    setIsDirty(true);
    setJustSaved(false);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const ids = orderedList.map((p) => p.id);
    await submitVote(currentUser.id, ids);
    setIsSaving(false);
    setIsDirty(false);
    setJustSaved(true);
  };

  const n = orderedList.length;

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white p-6 space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-purple-600" />
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Penilaian Individu
          </h1>
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
              <strong>Penilaian tersimpan!</strong> Urutan prioritas Anda telah masuk ke PostgreSQL.
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

      {/* Borda Formula Info */}
      <div className="p-3.5 rounded-lg bg-[#f9fafb] border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <span>
          <strong>Aturan Metode Borda:</strong> Susun peringkat dari prioritas <strong>#1</strong> hingga{' '}
          <strong>#{n}</strong> untuk {currentUser.roleLabel}. Posisi #1 mendapat{' '}
          <strong className="text-purple-600 font-mono">+{n} poin</strong>, #2 mendapat{' '}
          <strong className="font-mono">+{Math.max(1, n - 1)} poin</strong>, hingga posisi terakhir{' '}
          <strong className="font-mono">+1 poin</strong>.
        </span>
      </div>

      {/* Ranking Table (KafaBot Table Style) */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f9fafb] border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 select-none">
            <tr>
              <th className="py-2.5 px-3.5 text-center w-20">Peringkat</th>
              <th className="py-2.5 px-3">Kode</th>
              <th className="py-2.5 px-3">Nama Program Kerja</th>
              <th className="py-2.5 px-3">Divisi Pengusul</th>
              <th className="py-2.5 px-3 text-right">Estimasi Anggaran</th>
              <th className="py-2.5 px-3 text-center">Bobot Borda</th>
              <th className="py-2.5 px-3.5 text-right">Urutkan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {orderedList.map((proker, index) => {
              const rank = index + 1;
              const bordaPoints = n - index;

              return (
                <tr
                  key={proker.id}
                  className={`transition-colors ${
                    rank === 1 ? 'bg-purple-50/30 hover:bg-purple-50/50' : 'hover:bg-neutral-50/80'
                  }`}
                >
                  <td className="py-3 px-3.5 text-center">
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
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                      {proker.code}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-neutral-900">
                    {proker.name}
                    <span className="block text-[10px] text-neutral-400">
                      Target: {proker.targetPeserta}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-neutral-600">{proker.divisi}</td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-neutral-700 whitespace-nowrap">
                    {formatRupiah(proker.anggaran)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-purple-600">
                    +{bordaPoints} pts
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveItem(index, 0)}
                        className="p-1.5 rounded border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="Jadikan #1"
                      >
                        <ChevronsUp className="w-3.5 h-3.5 text-neutral-600" />
                      </button>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveItem(index, index - 1)}
                        className="p-1.5 rounded border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="Naikkan"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-neutral-600" />
                      </button>
                      <button
                        type="button"
                        disabled={index === orderedList.length - 1}
                        onClick={() => moveItem(index, index + 1)}
                        className="p-1.5 rounded border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title="Turunkan"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-neutral-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <p className="text-xs text-neutral-500">
          Penilai aktif: <strong className="text-neutral-800">{currentUser.name}</strong> ({currentUser.roleLabel}).
        </p>

        <button
          type="button"
          disabled={isSaving || orderedList.length === 0}
          onClick={handleSubmit}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan & Kirim Penilaian Saya'}</span>
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
