import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFullGDSSState, ROLE_ORDER } from '@/lib/gdss-server';
import { ConsensusMemberScore, RoleType } from '@/types/gdss';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body as { userId: string };

    const executor = userId
      ? await prisma.decisionMaker.findUnique({
          where: { id: userId },
        })
      : null;

    if (!executor || !executor.isHighestRole || executor.role === 'ADMIN' || !executor.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Akses Ditolak: Hanya pengambil keputusan aktif dengan jabatan tertinggi (Ketua) yang berhak mengesahkan konsensus.',
        },
        { status: 403 }
      );
    }

    const [dms, prokers, votes] = await Promise.all([
      prisma.decisionMaker.findMany(),
      prisma.programKerja.findMany({ orderBy: { code: 'asc' } }),
      prisma.vote.findMany(),
    ]);

    const voters = dms
      .filter((d) => d.role !== 'ADMIN' && d.isActive)
      .sort((a, b) => {
        const diff =
          (ROLE_ORDER[a.role as RoleType] ?? 50) -
          (ROLE_ORDER[b.role as RoleType] ?? 50);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      });

    if (prokers.length === 0 || voters.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tidak ada alternatif program kerja atau penilai untuk disahkan.',
        },
        { status: 400 }
      );
    }

    const allReady = voters.every((dm) => {
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

    const calculatedRows = prokers.map((proker) => {
      const memberScores: ConsensusMemberScore[] = voters.map((dm) => {
        const v = votes.find(
          (item) => item.decisionMakerId === dm.id && item.prokerId === proker.id
        );
        const rank = v?.rank ?? n;
        const bordaPoints = n - rank + 1;
        const topsisScore = v?.topsisScore ?? 0;

        return {
          dmId: dm.id,
          dmName: dm.name,
          dmNim: dm.nim,
          role: dm.role as RoleType,
          roleLabel: dm.roleLabel,
          rank,
          bordaPoints,
          topsisScore,
        };
      });

      const findByRole = (r: RoleType) => memberScores.find((m) => m.role === r);
      const ketua = findByRole('KETUA');
      const wakil = findByRole('WAKIL_KETUA');
      const sek = findByRole('SEKRETARIS');
      const bend = findByRole('BENDAHARA');

      const totalBordaPoints = memberScores.reduce(
        (acc, m) => acc + m.bordaPoints,
        0
      );
      const totalTopsisSum = memberScores.reduce(
        (acc, m) => acc + m.topsisScore,
        0
      );

      return {
        prokerId: proker.id,
        ketuaRank: ketua?.rank ?? 0,
        ketuaPoints: ketua?.bordaPoints ?? 0,
        ketuaTopsis: ketua?.topsisScore ?? 0,
        wakilRank: wakil?.rank ?? 0,
        wakilPoints: wakil?.bordaPoints ?? 0,
        wakilTopsis: wakil?.topsisScore ?? 0,
        sekretarisRank: sek?.rank ?? 0,
        sekretarisPoints: sek?.bordaPoints ?? 0,
        sekretarisTopsis: sek?.topsisScore ?? 0,
        bendaharaRank: bend?.rank ?? 0,
        bendaharaPoints: bend?.bordaPoints ?? 0,
        bendaharaTopsis: bend?.topsisScore ?? 0,
        memberScoresJson: JSON.stringify(memberScores),
        totalBordaPoints,
        finalRank: 0,
        statusRecommendation: 'Prioritas Kedua',
        _totalTopsisSum: totalTopsisSum,
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
      return b._totalTopsisSum - a._totalTopsisSum;
    });

    const persistRows = calculatedRows.map((row, index) => {
      const { _totalTopsisSum, ...cleanRow } = row;
      void _totalTopsisSum;
      cleanRow.finalRank = index + 1;
      if (index === 0 || index === 1) {
        cleanRow.statusRecommendation = 'Prioritas Utama';
      } else if (index < Math.ceil(calculatedRows.length * 0.6)) {
        cleanRow.statusRecommendation = 'Prioritas Kedua';
      } else {
        cleanRow.statusRecommendation = 'Dipertimbangkan / Cadangan';
      }
      return cleanRow;
    });

    await prisma.$transaction([
      prisma.consensusRecord.deleteMany({}),
      prisma.consensusRecord.create({
        data: {
          authorizedById: executor.id,
          authorizedByName: executor.name,
          details: {
            create: persistRows,
          },
        },
      }),
    ]);

    const state = await getFullGDSSState();
    return NextResponse.json({
      success: true,
      message:
        'Konsensus pengambilan keputusan (TOPSIS + Borda) berhasil disahkan oleh Ketua.',
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
