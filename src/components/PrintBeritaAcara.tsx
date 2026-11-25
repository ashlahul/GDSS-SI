'use client';

import React from 'react';
import { ConsensusRecord, DecisionMaker } from '@/types/gdss';

interface PrintBeritaAcaraProps {
  consensusResult: ConsensusRecord;
  decisionMakers: DecisionMaker[];
}

export const PrintBeritaAcara: React.FC<PrintBeritaAcaraProps> = ({
  consensusResult,
  decisionMakers,
}) => {
  const ketua = decisionMakers.find((d) => d.role === 'KETUA');
  const wakil = decisionMakers.find((d) => d.role === 'WAKIL_KETUA');
  const sekretaris = decisionMakers.find((d) => d.role === 'SEKRETARIS');
  const bendahara = decisionMakers.find((d) => d.role === 'BENDAHARA');

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
            Dokumen Konsensus Resmi Pengambilan Keputusan • Metode Voting Borda Count
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
        metode perhitungan peringkat preferensial <strong>Metode Borda (Borda Count)</strong>.
        Penilaian telah diberikan secara independen oleh seluruh pengambil keputusan (Decision Maker),
        yaitu Ketua Umum, Wakil Ketua Umum, Sekretaris Jenderal, dan Bendahara Umum, dan telah
        disahkan secara resmi melalui akun jabatan tertinggi oleh{' '}
        <strong>{consensusResult.authorizedBy} (Ketua Umum)</strong>.
      </p>

      {/* Tabel Hasil Konsensus */}
      <table className="w-full border-collapse border border-black mb-6 text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-center">Peringkat</th>
            <th className="border border-black p-2 text-left">Kode & Nama Program Kerja</th>
            <th className="border border-black p-2 text-right">Est. Anggaran</th>
            <th className="border border-black p-2 text-center">Ketua</th>
            <th className="border border-black p-2 text-center">Wakil Ketua</th>
            <th className="border border-black p-2 text-center">Sekretaris</th>
            <th className="border border-black p-2 text-center">Bendahara</th>
            <th className="border border-black p-2 text-center">Total Poin</th>
            <th className="border border-black p-2 text-left">Status Keputusan</th>
          </tr>
        </thead>
        <tbody>
          {consensusResult.details.map((row) => (
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
              <td className="border border-black p-2 text-center">
                Rank {row.ketuaRank} ({row.ketuaPoints})
              </td>
              <td className="border border-black p-2 text-center">
                Rank {row.wakilRank} ({row.wakilPoints})
              </td>
              <td className="border border-black p-2 text-center">
                Rank {row.sekretarisRank} ({row.sekretarisPoints})
              </td>
              <td className="border border-black p-2 text-center">
                Rank {row.bendaharaRank} ({row.bendaharaPoints})
              </td>
              <td className="border border-black p-2 text-center font-bold">
                {row.totalBordaPoints}
              </td>
              <td className="border border-black p-2 font-semibold">
                {row.statusRecommendation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Penutup */}
      <p className="mb-8 text-justify">
        Demikian berita acara hasil konsensus ini dibuat secara transparan dan dapat diakses oleh
        seluruh pengambil keputusan sebagai acuan pelaksanaan program kerja organisasi mahasiswa
        pada periode berjalan.
      </p>

      {/* Tanda Tangan */}
      <div className="grid grid-cols-4 gap-4 text-center text-xs mt-12">
        <div>
          <p className="mb-16">
            Pengambil Keputusan I (Tertinggi),
            <br />
            <strong>Ketua Umum</strong>
          </p>
          <p className="font-bold underline">{ketua?.name}</p>
          {ketua?.nim && <p className="text-[11px] font-mono mt-0.5">NIM. {ketua.nim}</p>}
        </div>
        <div>
          <p className="mb-16">
            Pengambil Keputusan II,
            <br />
            <strong>Wakil Ketua Umum</strong>
          </p>
          <p className="font-bold underline">{wakil?.name}</p>
          {wakil?.nim && <p className="text-[11px] font-mono mt-0.5">NIM. {wakil.nim}</p>}
        </div>
        <div>
          <p className="mb-16">
            Pengambil Keputusan III,
            <br />
            <strong>Sekretaris Jenderal</strong>
          </p>
          <p className="font-bold underline">{sekretaris?.name}</p>
          {sekretaris?.nim && <p className="text-[11px] font-mono mt-0.5">NIM. {sekretaris.nim}</p>}
        </div>
        <div>
          <p className="mb-16">
            Pengambil Keputusan IV,
            <br />
            <strong>Bendahara Umum</strong>
          </p>
          <p className="font-bold underline">{bendahara?.name}</p>
          {bendahara?.nim && <p className="text-[11px] font-mono mt-0.5">NIM. {bendahara.nim}</p>}
        </div>
      </div>
    </div>
  );
};
