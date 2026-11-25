import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFullGDSSState } from '@/lib/gdss-server';
import { computeTopsis, TopsisScoreInput } from '@/lib/topsis';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, criteriaInputs } = body as {
      userId: string;
      criteriaInputs: TopsisScoreInput[];
    };

    if (!userId || !Array.isArray(criteriaInputs) || criteriaInputs.length === 0) {
      return NextResponse.json(
        { error: 'Data matriks penilaian TOPSIS tidak valid.' },
        { status: 400 }
      );
    }

    const dm = await prisma.decisionMaker.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!dm) {
      return NextResponse.json(
        { error: 'Akun pengambil keputusan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const prokers = await prisma.programKerja.findMany({
      select: { id: true },
    });
    const validIds = new Set(prokers.map((p) => p.id));
    const filteredInputs = criteriaInputs.filter((item) =>
      validIds.has(item.prokerId)
    );

    if (filteredInputs.length !== prokers.length || prokers.length === 0) {
      return NextResponse.json(
        { error: 'Seluruh alternatif program kerja harus dinilai pada setiap kriteria.' },
        { status: 400 }
      );
    }

    // Server-authoritative TOPSIS calculation -> individual rank & Borda points
    const topsis = computeTopsis(filteredInputs);
    const now = new Date();

    await prisma.$transaction([
      prisma.vote.deleteMany({
        where: { decisionMakerId: userId },
      }),
      prisma.vote.createMany({
        data: topsis.rows.map((row) => ({
          decisionMakerId: userId,
          prokerId: row.prokerId,
          c1Score: row.raw.c1,
          c2Score: row.raw.c2,
          c3Score: row.raw.c3,
          c4Score: row.raw.c4,
          topsisScore: row.preferenceScore,
          rank: row.rank,
          bordaPoints: row.bordaPoints,
          submittedAt: now,
        })),
      }),
      // Clear any previous consensus when a vote is updated
      prisma.consensusRecord.deleteMany({}),
    ]);

    const state = await getFullGDSSState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('POST /api/votes error:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan perhitungan TOPSIS ke PostgreSQL.' },
      { status: 500 }
    );
  }
}
