'use client';

import React, { useState } from 'react';
import { useGDSS, MemberInputPayload } from '@/context/GDSSContext';
import { DecisionMaker, RoleType } from '@/types/gdss';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Crown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  RotateCw,
  AlertCircle,
} from 'lucide-react';

const ROLE_OPTIONS: { value: RoleType; label: string; defaultTitle: string }[] = [
  { value: 'KETUA', label: 'Ketua Umum (Tertinggi)', defaultTitle: 'Ketua Umum (Jabatan Tertinggi)' },
  { value: 'WAKIL_KETUA', label: 'Wakil Ketua Umum', defaultTitle: 'Wakil Ketua Umum' },
  { value: 'SEKRETARIS', label: 'Sekretaris Jenderal', defaultTitle: 'Sekretaris Jenderal' },
  { value: 'BENDAHARA', label: 'Bendahara Umum', defaultTitle: 'Bendahara Umum' },
  { value: 'ANGGOTA', label: 'Anggota / Koordinator Divisi', defaultTitle: 'Anggota Pengurus' },
];

export const MembersTab: React.FC = () => {
  const {
    accounts,
    decisionMakers,
    currentUser,
    programKerjaList,
    votes,
    consensusResult,
    addMember,
    updateMember,
    deleteMember,
    refreshData,
    isLoadingData,
  } = useGDSS();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DecisionMaker | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState<MemberInputPayload>({
    name: '',
    nim: '',
    email: '',
    password: '',
    role: 'ANGGOTA',
    roleLabel: 'Anggota Pengurus',
  });

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-10 text-center space-y-3">
        <ShieldCheck className="w-10 h-10 text-neutral-300" />
        <h2 className="text-base font-bold text-neutral-900">
          Halaman Khusus Administrator
        </h2>
        <p className="text-xs text-neutral-500 max-w-md">
          Pengelolaan anggota Decision Maker hanya dapat diakses melalui akun Administrator Sistem.
        </p>
      </div>
    );
  }

  const totalProker = programKerjaList.length;
  const completedCount = decisionMakers.filter((dm) => {
    const v = votes[dm.id];
    return v && v.submittedAt && v.rankings.length === totalProker && totalProker > 0;
  }).length;
  const ketua = decisionMakers.find((d) => d.role === 'KETUA');
  const adminAccount = accounts.find((a) => a.role === 'ADMIN');

  const filteredMembers = decisionMakers.filter(
    (dm) =>
      dm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dm.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dm.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dm.roleLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingMember(null);
    setModalError(null);
    setFormData({
      name: '',
      nim: '',
      email: '',
      password: '',
      role: 'ANGGOTA',
      roleLabel: 'Anggota Pengurus',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member: DecisionMaker) => {
    setEditingMember(member);
    setModalError(null);
    setFormData({
      name: member.name,
      nim: member.nim,
      email: member.email,
      password: '',
      role: member.role,
      roleLabel: member.roleLabel,
    });
    setIsModalOpen(true);
  };

  const handleRoleChange = (nextRole: RoleType) => {
    const matched = ROLE_OPTIONS.find((r) => r.value === nextRole);
    setFormData((prev) => ({
      ...prev,
      role: nextRole,
      roleLabel: matched ? matched.defaultTitle : prev.roleLabel,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSaving(true);

    if (editingMember) {
      const res = await updateMember(editingMember.id, formData);
      setIsSaving(false);
      if (!res.success) {
        setModalError(res.message || 'Gagal memperbarui data anggota.');
        return;
      }
      setIsModalOpen(false);
      setFeedback({
        type: 'success',
        text: `Data anggota "${formData.name}" berhasil diperbarui.`,
      });
    } else {
      const res = await addMember(formData);
      setIsSaving(false);
      if (!res.success) {
        setModalError(res.message || 'Gagal menambahkan anggota baru.');
        return;
      }
      setIsModalOpen(false);
      setFeedback({
        type: 'success',
        text: `Anggota baru "${formData.name}" berhasil ditambahkan ke sistem.`,
      });
    }
  };

  const handleDelete = async (member: DecisionMaker) => {
    if (
      !confirm(
        `Hapus anggota "${member.name}" (${member.roleLabel})? Penilaian TOPSIS yang sudah dikirim anggota ini akan ikut dihapus.`
      )
    ) {
      return;
    }
    const res = await deleteMember(member.id);
    if (!res.success) {
      setFeedback({
        type: 'error',
        text: res.message || 'Gagal menghapus anggota.',
      });
    } else {
      setFeedback({
        type: 'success',
        text: `Anggota "${member.name}" berhasil dihapus.`,
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white p-6 space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Kelola Anggota
            </h1>
            <p className="text-xs text-neutral-500">
              Tambah, edit profil/password, atau hapus anggota pengambil keputusan (Decision Maker).
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
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Anggota</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium">Total Penilai</span>
          <div className="text-xl font-bold text-neutral-900 mt-1 tabular-nums">
            {decisionMakers.length} Anggota
          </div>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium">Ketua Umum</span>
          <div className="text-sm font-bold text-purple-700 mt-1.5 truncate">
            {ketua?.name || 'Belum ditetapkan'}
          </div>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium">Suara Masuk</span>
          <div className="text-xl font-bold text-neutral-900 mt-1 tabular-nums">
            {completedCount}/{decisionMakers.length}
          </div>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-2xs">
          <span className="text-[11px] text-neutral-500 font-medium">Status Konsensus</span>
          <div className="text-xl font-bold text-neutral-900 mt-1">
            {consensusResult ? 'Sah' : 'Proses'}
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg border flex items-center justify-between gap-2 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-0.5 hover:opacity-70 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama, NIM, email, atau jabatan anggota..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-purple-400 bg-white shadow-2xs"
        />
      </div>

      {/* Members Table */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f9fafb] border-b border-neutral-200 text-[11px] font-semibold text-neutral-500">
            <tr>
              <th className="py-2.5 px-4">Anggota & Email</th>
              <th className="py-2.5 px-3">NIM</th>
              <th className="py-2.5 px-3">Jabatan</th>
              <th className="py-2.5 px-3">Otoritas</th>
              <th className="py-2.5 px-3 text-center">Status Penilaian</th>
              <th className="py-2.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {filteredMembers.map((dm) => {
              const v = votes[dm.id];
              const done = Boolean(
                v && v.submittedAt && v.rankings.length === totalProker && totalProker > 0
              );

              return (
                <tr key={dm.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {dm.isHighestRole ? (
                          <Crown className="w-3.5 h-3.5" />
                        ) : (
                          dm.name.charAt(0).toUpperCase()
                        )}
                      </span>
                      <div>
                        <div className="font-semibold text-neutral-900">{dm.name}</div>
                        <div className="text-[11px] text-neutral-400">{dm.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-neutral-700">
                    {dm.nim || '-'}
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-medium text-neutral-800">{dm.roleLabel}</span>
                    <span className="block text-[10px] font-mono text-neutral-400">
                      {dm.role}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {dm.isHighestRole ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                        Pengesah Konsensus
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 whitespace-nowrap">
                        Penilai / Voter
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
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

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(dm)}
                        className="p-1.5 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-purple-700 transition cursor-pointer"
                        title="Edit Anggota"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={dm.isHighestRole || dm.role === 'KETUA'}
                        onClick={() => handleDelete(dm)}
                        className="p-1.5 rounded border border-neutral-200 bg-white hover:bg-rose-50 text-neutral-600 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                        title={
                          dm.isHighestRole
                            ? 'Akun Ketua Umum tidak dapat dihapus'
                            : 'Hapus Anggota'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Admin Self Profile Card */}
      {adminAccount && (
        <div className="rounded-lg border border-neutral-200 bg-[#f9fafb] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-neutral-900">
                {adminAccount.name} <span className="text-[10px] font-mono text-neutral-400 ml-1">(ADMIN)</span>
              </div>
              <div className="text-[11px] text-neutral-500">
                {adminAccount.email} • Akun ini khusus mengelola daftar anggota & tidak ikut voting.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openEditModal(adminAccount)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition cursor-pointer self-start sm:self-auto"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Ubah Profil / Password Admin</span>
          </button>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white border border-neutral-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingMember
                  ? `Edit Akun: ${editingMember.name}`
                  : 'Tambah Anggota Pengambil Keputusan'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded hover:bg-neutral-100 text-neutral-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              {modalError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 h-9 rounded-lg border border-neutral-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    NIM
                  </label>
                  <input
                    type="text"
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    placeholder="2406051100xx"
                    className="w-full px-3 h-9 rounded-lg border border-neutral-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Email Login
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@gmail.com"
                    className="w-full px-3 h-9 rounded-lg border border-neutral-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {editingMember?.role !== 'ADMIN' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Peran / Role
                    </label>
                    <select
                      value={formData.role}
                      disabled={editingMember?.role === 'KETUA'}
                      onChange={(e) => handleRoleChange(e.target.value as RoleType)}
                      className="w-full px-2.5 h-9 rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-purple-500 disabled:bg-neutral-100"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Label Jabatan
                    </label>
                    <input
                      type="text"
                      value={formData.roleLabel}
                      onChange={(e) =>
                        setFormData({ ...formData, roleLabel: e.target.value })
                      }
                      placeholder="Contoh: Koordinator Divisi"
                      className="w-full px-3 h-9 rounded-lg border border-neutral-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Password {editingMember ? '(Kosongkan jika tidak ingin mengganti)' : '(Minimal 6 karakter)'}
                </label>
                <input
                  type="password"
                  required={!editingMember}
                  minLength={editingMember ? undefined : 6}
                  value={formData.password || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={editingMember ? '••••••••' : 'Minimal 6 karakter'}
                  className="w-full px-3 h-9 rounded-lg border border-neutral-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 font-semibold hover:bg-neutral-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : editingMember ? 'Simpan Perubahan' : 'Tambah Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
