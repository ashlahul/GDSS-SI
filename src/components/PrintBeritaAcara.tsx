'use client';

import React from 'react';
import { ConsensusRecord, DecisionMaker } from '@/types/gdss';
import { getRowMemberScores } from '@/lib/consensus-helpers';

interface PrintBeritaAcaraProps {
  consensusResult: ConsensusRecord;
  decisionMakers: DecisionMaker[];
}

export const PrintBeritaAcara: React.FC<PrintBeritaAcaraProps> = ({
  consensusResult,
  decisionMakers,
}) => {
  const details = consensusResult.details;
  const memberCols =
    details.length > 0 ? getRowMemberScores(details[0], decisionMakers) : [];

  const formattedDate = new Date(consensusResult.calculatedAt).toLocaleDateString(
    'id-ID',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const memberRolesSummary = memberCols
    .map((m) => `${m.dmName} (${m.roleLabel.replace(' (Jabatan Tertinggi)', '')})`)
    .join(', ');

  return (
    <div id="print-berita-acara" className="hidden print:block bg-white text-black p-8 max-w-4xl mx-auto text-sm leading-relaxed">
      {/* Kop Surat */}
      <div className="border-b-4 border-black pb-4 mb-6 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Logo GDSS Ormawa"
          className="w-16 h-16 object-contain shrink-0"
        />
        <div className="flex-1 text-center pr-16">
          <h1 className="text-lg font-bold uppercase tracking-wide">
            PENGURUS HARIAN ORGANISASI MAHASISWA (ORMAWA)
          </h1>
          <h2 className="text-base font-bold uppercase">
            SISTEM PENDUKUNG KEPUTUSAN KELOMPOK (GDSS) PENENTUAN PRIORITAS PROGRAM KERJA
          </h2>
          <p className="text-xs mt-1">
            Dokumen Konsensus Resmi Pengambilan Keputusan • Hybrid TOPSIS & Metode Borda Count
          </p>
        </div>
      </div>

      {/* Judul Dokumen */}
      <div className="text-center mb-6">
        <h3 className="text-base font-bold underline uppercase">
          BERITA ACARA KONSENSUS PRIORITAS PROGRAM KERJA
        </h3>
        <p className="text-xs font-mono mt-1">
          Nomor: BA/01/GDSS-ORMAWA/{new Date(consensusResult.calculatedAt).getFullYear()}
        </p>
      </div>

      {/* Paragraf Pembuka */}
      <p className="mb-4 text-justify">
        Pada hari ini, <strong>{formattedDate}</strong>, telah dilaksanakan pengambilan keputusan
        secara kolektif menggunakan Sistem Pendukung Keputusan Kelompok (GDSS) berbasis website dengan
        metode gabungan <strong>Hybrid TOPSIS & Borda Count</strong> (evaluasi multi-kriteria
        individu menggunakan <em>TOPSIS</em> dan agregasi konsensus kelompok menggunakan{' '}
        <em>Metode Borda</em>). Penilaian telah diberikan secara independen oleh seluruh{' '}
        {memberCols.length} pengambil keputusan (Decision Maker), yaitu {memberRolesSummary}, dan
        telah disahkan secara resmi melalui akun jabatan tertinggi oleh{' '}
        <strong>{consensusResult.authorizedBy} (Ketua Umum)</strong>.
      </p>

      {/* Tabel Hasil Konsensus */}
      <table className="w-full border-collapse border border-black mb-6 text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-center">Peringkat</th>
            <th className="border border-black p-2 text-left">Kode & Nama Program Kerja</th>
            <th className="border border-black p-2 text-right">Est. Anggaran</th>
            {memberCols.map((m) => (
              <th key={m.dmId} className="border border-black p-2 text-center">
                {m.dmName.split(' ')[0]}
              </th>
            ))}
            <th className="border border-black p-2 text-center">Total Poin</th>
            <th className="border border-black p-2 text-left">Status Keputusan</th>
          </tr>
        </thead>
        <tbody>
          {details.map((row) => {
            const rowMembers = getRowMemberScores(row, decisionMakers);
            return (
              <tr key={row.proker.id}>
                <td className="border border-black p-2 text-center font-bold">
                  #{row.finalRank}
                </td>
                <td className="border border-black p-2">
                  <strong>{row.proker.code}</strong> - {row.proker.name}
                  <br />
                  <span className="text-[10px] text-gray-600">{row.proker.divisi}</span>
                </td>
                <td className="border border-black p-2 text-right whitespace-nowrap">
                  {formatRupiah(row.proker.anggaran)}
                </td>
                {rowMembers.map((m) => (
                  <td key={m.dmId} className="border border-black p-2 text-center">
                    <div>
                      Rank {m.rank} ({m.bordaPoints})
                    </div>
                    <div className="text-[10px] font-mono text-gray-600">
                      V={m.topsisScore.toFixed(3)}
                    </div>
                  </td>
                ))}
                <td className="border border-black p-2 text-center font-bold">
                  {row.totalBordaPoints}
                </td>
                <td className="border border-black p-2 font-semibold">
                  {row.statusRecommendation}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Penutup */}
      <p className="mb-8 text-justify">
        Demikian berita acara hasil konsensus ini dibuat secara transparan dan dapat diakses oleh
        seluruh pengambil keputusan sebagai acuan pelaksanaan program kerja organisasi mahasiswa
        pada periode berjalan.
      </p>

      {/* Tanda Tangan */}
      <div
        className={`grid gap-4 text-center text-xs mt-12 ${
          memberCols.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'
        }`}
      >
        {memberCols.map((m, idx) => (
          <div key={m.dmId} className="break-inside-avoid">
            <p className="mb-16">
              Pengambil Keputusan {idx + 1}
              {m.role === 'KETUA' ? ' (Tertinggi)' : ''},
              <br />
              <strong>{m.roleLabel.replace(' (Jabatan Tertinggi)', '')}</strong>
            </p>
            <p className="font-bold underline">{m.dmName}</p>
            {m.dmNim && <p className="text-[11px] font-mono mt-0.5">NIM. {m.dmNim}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
