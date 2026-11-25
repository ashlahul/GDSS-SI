import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFullGDSSState } from '@/lib/gdss-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body as { userId: string };

    const executor = await prisma.decisionMaker.findUnique({
      where: { id: userId },
    });

    if (!executor || !executor.isHighestRole) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Akses Ditolak: Hanya pengambil keputusan dengan jabatan tertinggi (Ketua) yang berhak mengesahkan konsensus Borda.',
        },
        { status: 403 }
      );
    }

    const [dms, prokers, votes] = await Promise.all([
      prisma.decisionMaker.findMany(),
      prisma.programKerja.findMany({ orderBy: { code: 'asc' } }),
      prisma.vote.findMany(),
    ]);

    if (prokers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tidak ada alternatif program kerja untuk dinilai.',
        },
        { status: 400 }
      );
    }

    const allReady = dms.every((dm) => {
      const dmVotes = votes.filter((v) => v.decisionMakerId === dm.id);
      return dmVotes.length === prokers.length;
    });

    if (!allReady) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Konsensus belum dapat dijalankan karena belum semua pengambil keputusan menyelesaikan penilaian.',
        },
        { status: 400 }
      );
    }

    const n = prokers.length;
    const ketuaVotes = votes.filter((v) => v.decisionMakerId === 'dm-ketua');
    const wakilVotes = votes.filter((v) => v.decisionMakerId === 'dm-wakil');
    const sekVotes = votes.filter((v) => v.decisionMakerId === 'dm-sekretaris');
    const bendVotes = votes.filter((v) => v.decisionMakerId === 'dm-bendahara');

    const calculatedRows = prokers.map((proker) => {
      const kVote = ketuaVotes.find((v) => v.prokerId === proker.id);
      const kRank = kVote?.rank ?? n;
      const kPoints = n - kRank + 1;
      const kTopsis = kVote?.topsisScore ?? 0;

      const wVote = wakilVotes.find((v) => v.prokerId === proker.id);
      const wRank = wVote?.rank ?? n;
      const wPoints = n - wRank + 1;
      const wTopsis = wVote?.topsisScore ?? 0;

      const sVote = sekVotes.find((v) => v.prokerId === proker.id);
      const sRank = sVote?.rank ?? n;
      const sPoints = n - sRank + 1;
      const sTopsis = sVote?.topsisScore ?? 0;

      const bVote = bendVotes.find((v) => v.prokerId === proker.id);
      const bRank = bVote?.rank ?? n;
      const bPoints = n - bRank + 1;
      const bTopsis = bVote?.topsisScore ?? 0;

      return {
        prokerId: proker.id,
        ketuaRank: kRank,
        ketuaPoints: kPoints,
        ketuaTopsis: kTopsis,
        wakilRank: wRank,
        wakilPoints: wPoints,
        wakilTopsis: wTopsis,
        sekretarisRank: sRank,
        sekretarisPoints: sPoints,
        sekretarisTopsis: sTopsis,
        bendaharaRank: bRank,
        bendaharaPoints: bPoints,
        bendaharaTopsis: bTopsis,
        totalBordaPoints: kPoints + wPoints + sPoints + bPoints,
        finalRank: 0,
        statusRecommendation: 'Prioritas Kedua',
      };
    });

    // Sort descending by totalBordaPoints, tie-breaker by Ketua's preference, then total TOPSIS V_i
    calculatedRows.sort((a, b) => {
      if (b.totalBordaPoints !== a.totalBordaPoints) {
        return b.totalBordaPoints - a.totalBordaPoints;
      }
      if (b.ketuaPoints !== a.ketuaPoints) {
        return b.ketuaPoints - a.ketuaPoints;
      }
      const aTopsisSum =
        a.ketuaTopsis + a.wakilTopsis + a.sekretarisTopsis + a.bendaharaTopsis;
      const bTopsisSum =
        b.ketuaTopsis + b.wakilTopsis + b.sekretarisTopsis + b.bendaharaTopsis;
      return bTopsisSum - aTopsisSum;
    });

    calculatedRows.forEach((row, index) => {
      row.finalRank = index + 1;
      if (index === 0 || index === 1) {
        row.statusRecommendation = 'Prioritas Utama';
      } else if (index < Math.ceil(calculatedRows.length * 0.6)) {
        row.statusRecommendation = 'Prioritas Kedua';
      } else {
        row.statusRecommendation = 'Dipertimbangkan / Cadangan';
      }
    });

    await prisma.$transaction([
      prisma.consensusRecord.deleteMany({}),
      prisma.consensusRecord.create({
        data: {
          authorizedById: executor.id,
          authorizedByName: executor.name,
          details: {
            create: calculatedRows,
          },
        },
      }),
    ]);

    const state = await getFullGDSSState();
    return NextResponse.json({
      success: true,
      message:
        'Konsensus pengambilan keputusan dengan Metode Borda berhasil disahkan oleh Ketua.',
      state,
    });
  } catch (error) {
    console.error('POST /api/consensus error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat menyimpan konsensus ke PostgreSQL.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await prisma.consensusRecord.deleteMany({});
    const state = await getFullGDSSState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('DELETE /api/consensus error:', error);
    return NextResponse.json(
      { error: 'Gagal mereset konsensus.' },
      { status: 500 }
    );
  }
}
