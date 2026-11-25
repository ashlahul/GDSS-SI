'use client';

import React, { useState, useMemo } from 'react';
import { useGDSS } from '@/context/GDSSContext';
import {
  FolderKanban,
  Plus,
  Trash2,
  Edit2,
  Search,
  RotateCw,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';
import { ProgramKerja } from '@/types/gdss';

export const ProkerTab: React.FC = () => {
  const {
    programKerjaList,
    decisionMakers,
    votes,
    addProker,
    updateProker,
    deleteProker,
    consensusResult,
    refreshData,
    isLoadingData,
  } = useGDSS();

  const [searchQuery, setSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<'list' | 'summary'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    divisi: '',
    description: '',
    anggaran: 5000000,
    targetPeserta: '',
  });

  const filteredProkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return programKerjaList;
    return programKerjaList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.divisi.toLowerCase().includes(q)
    );
  }, [programKerjaList, searchQuery]);

  const totalBudget = useMemo(
    () => programKerjaList.reduce((acc, p) => acc + p.anggaran, 0),
    [programKerjaList]
  );

  const avgBudget =
    programKerjaList.length > 0
      ? Math.round(totalBudget / programKerjaList.length)
      : 0;

  const completedCount = useMemo(
    () =>
      decisionMakers.filter((dm) => {
        const v = votes[dm.id];
        return (
          v &&
          v.submittedAt &&
          v.rankings.length === programKerjaList.length &&
          programKerjaList.length > 0
        );
      }).length,
    [decisionMakers, votes, programKerjaList.length]
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      divisi: 'Divisi Pengembangan Organisasi',
      description: '',
      anggaran: 5000000,
      targetPeserta: '100 Mahasiswa',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proker: ProgramKerja) => {
    setEditingId(proker.id);
    setFormData({
      name: proker.name,
      divisi: proker.divisi,
      description: proker.description,
      anggaran: proker.anggaran,
      targetPeserta: proker.targetPeserta,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSaving(true);
    if (editingId) {
      await updateProker(editingId, formData);
    } else {
      await addProker(formData);
    }
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const formatRupiahShort = (val: number) => {
    if (val >= 1_000_000) {
      return `Rp ${(val / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
    }
    return formatRupiah(val);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white p-6 space-y-5 select-none">
      {/* Header (1:1 KafaBot Lead Campaigns header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-purple-600" />
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Alternatif Program Kerja
          </h1>
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
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Proker</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs (List | Summary) */}
      <div className="flex items-center gap-6 border-b border-neutral-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setSubTab('list')}
          className={`pb-2.5 transition-colors cursor-pointer ${
            subTab === 'list'
              ? 'text-purple-600 border-b-2 border-purple-600 font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent'
          }`}
        >
          Daftar Proker
        </button>
        <button
          type="button"
          onClick={() => setSubTab('summary')}
          className={`pb-2.5 transition-colors cursor-pointer ${
            subTab === 'summary'
              ? 'text-purple-600 border-b-2 border-purple-600 font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent'
          }`}
        >
          Ringkasan Anggaran
        </button>
      </div>

      {/* 6 Metric KPI Cards Row (1:1 KafaBot campaigns KPI cards) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs flex flex-col justify-center">
          <span className="text-[11px] text-neutral-500 font-medium">Total Proker</span>
          <span className="text-xl font-bold text-neutral-900 mt-1 tabular-nums">
            {programKerjaList.length}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs flex flex-col justify-center">
          <span className="text-[11px] text-neutral-500 font-medium">Total Anggaran</span>
          <span className="text-xl font-bold text-neutral-900 mt-1 tabular-nums">
            {formatRupiahShort(totalBudget)}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs flex flex-col justify-center">
          <span className="text-[11px] text-neutral-500 font-medium">Rata-rata Dana</span>
          <span className="text-xl font-bold text-neutral-900 mt-1 tabular-nums">
            {formatRupiahShort(avgBudget)}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs flex flex-col justify-center">
          <span className="text-[11px] text-neutral-500 font-medium">Penilai Selesai</span>
          <span className="text-xl font-bold text-neutral-900 mt-1 tabular-nums">
            {completedCount}/{decisionMakers.length || 4}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs flex flex-col justify-center">
          <span className="text-[11px] text-neutral-500 font-medium">Konsensus</span>
          <span className="text-xl font-bold text-neutral-900 mt-1">
            {consensusResult ? 'Sah' : 'Proses'}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs flex flex-col justify-center">
          <span className="text-[11px] text-neutral-500 font-medium">Metode</span>
          <span className="text-base font-bold text-purple-600 mt-1">TOPSIS + Borda</span>
        </div>
      </div>

      {consensusResult && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Perhatian:</strong> Menambah atau menghapus alternatif program kerja akan
            mereset matriks penilaian TOPSIS dan konsensus Borda karena jumlah alternatif (<em>N</em>) berubah.
          </span>
        </div>
      )}

      {subTab === 'list' ? (
        <>
          {/* Search Input Bar */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari program kerja, kode, atau divisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded border border-neutral-200 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 bg-neutral-50/50"
              />
            </div>

            <button
              type="button"
              onClick={() => refreshData()}
              title="Muat Ulang"
              className="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* KafaBot Table */}
          <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9fafb] border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 select-none">
                <tr>
                  <th className="py-2.5 px-3.5">Nama Program Kerja</th>
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Divisi Pengusul</th>
                  <th className="py-2.5 px-3">Target Peserta</th>
                  <th className="py-2.5 px-3 text-right">Estimasi Anggaran</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filteredProkers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400 text-xs">
                      Tidak ada program kerja yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredProkers.map((proker) => (
                    <tr
                      key={proker.id}
                      className="hover:bg-neutral-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-3.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(proker)}
                          className="font-medium text-blue-600 hover:underline cursor-pointer text-left"
                        >
                          {proker.name}
                        </button>
                        <p className="text-[11px] text-neutral-400 truncate max-w-md mt-0.5">
                          {proker.description}
                        </p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          {proker.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600">{proker.divisi}</td>
                      <td className="py-2.5 px-3 text-neutral-600">
                        {proker.targetPeserta}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-purple-600 whitespace-nowrap">
                        {formatRupiah(proker.anggaran)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 font-medium">
                        Aktif
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 text-neutral-400">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(proker)}
                            title="Edit Program Kerja"
                            className="p-1 hover:text-neutral-800 rounded cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus proker "${proker.name}"?`)) {
                                deleteProker(proker.id);
                              }
                            }}
                            title="Hapus Program Kerja"
                            className="p-1 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Summary Tab */
        <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-800">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Ringkasan Proporsi Anggaran per Program Kerja</span>
          </div>
          <div className="space-y-3">
            {programKerjaList.map((p) => {
              const pct = totalBudget > 0 ? Math.round((p.anggaran / totalBudget) * 100) : 0;
              return (
                <div key={p.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-800">
                      <span className="font-mono text-purple-600 mr-1.5">{p.code}</span>
                      {p.name}
                    </span>
                    <span className="font-mono font-semibold text-neutral-700">
                      {formatRupiah(p.anggaran)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
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
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <h3 className="font-bold text-neutral-900 text-base">
                {editingId ? 'Edit Program Kerja' : 'Tambah Alternatif Program Kerja'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Nama Program Kerja *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Workshop Kepemimpinan & Manajemen Organisasi"
                  className="w-full px-3 py-2 border border-neutral-200 rounded bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-purple-500 text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Divisi Pengusul
                </label>
                <input
                  type="text"
                  value={formData.divisi}
                  onChange={(e) => setFormData({ ...formData, divisi: e.target.value })}
                  placeholder="Contoh: Departemen Kaderisasi"
                  className="w-full px-3 py-2 border border-neutral-200 rounded bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-purple-500 text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Estimasi Anggaran (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100000}
                    value={formData.anggaran}
                    onChange={(e) =>
                      setFormData({ ...formData, anggaran: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-neutral-200 rounded bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-purple-500 text-neutral-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Target Peserta
                  </label>
                  <input
                    type="text"
                    value={formData.targetPeserta}
                    onChange={(e) =>
                      setFormData({ ...formData, targetPeserta: e.target.value })
                    }
                    placeholder="Contoh: 150 Mahasiswa"
                    className="w-full px-3 py-2 border border-neutral-200 rounded bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-purple-500 text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Deskripsi & Tujuan
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat mengenai sasaran dan urgensi proker..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-purple-500 text-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Program Kerja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
