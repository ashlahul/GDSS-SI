import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeeded, getFullGDSSState, SEED_PROKERS } from '@/lib/gdss-server';
import { computeTopsis, TopsisScoreInput } from '@/lib/topsis';

type RoleScoresPreset = Record<string, { c1: number; c2: number; c3: number; c4: number }>;

const DEMO_MATRIX_PRESETS: Record<string, RoleScoresPreset> = {
  'dm-ketua': {
    'PK-01': { c1: 5, c2: 5, c3: 5, c4: 2 },
    'PK-02': { c1: 5, c2: 4, c3: 5, c4: 4 },
    'PK-03': { c1: 4, c2: 4, c3: 4, c4: 2 },
    'PK-04': { c1: 3, c2: 4, c3: 3, c4: 2 },
    'PK-05': { c1: 3, c2: 3, c3: 4, c4: 4 },
  },
  'dm-wakil': {
    'PK-01': { c1: 4, c2: 5, c3: 5, c4: 2 },
    'PK-02': { c1: 5, c2: 5, c3: 5, c4: 3 },
    'PK-03': { c1: 4, c2: 4, c3: 5, c4: 2 },
    'PK-04': { c1: 3, c2: 3, c3: 4, c4: 2 },
    'PK-05': { c1: 4, c2: 3, c3: 3, c4: 4 },
  },
  'dm-sekretaris': {
    'PK-01': { c1: 4, c2: 5, c3: 4, c4: 2 },
    'PK-02': { c1: 4, c2: 3, c3: 4, c4: 4 },
    'PK-03': { c1: 5, c2: 5, c3: 4, c4: 2 },
    'PK-04': { c1: 3, c2: 5, c3: 4, c4: 2 },
    'PK-05': { c1: 3, c2: 3, c3: 3, c4: 3 },
  },
  'dm-bendahara': {
    'PK-01': { c1: 5, c2: 4, c3: 4, c4: 2 },
    'PK-02': { c1: 5, c2: 3, c3: 4, c4: 5 },
    'PK-03': { c1: 4, c2: 4, c3: 4, c4: 2 },
    'PK-04': { c1: 4, c2: 5, c3: 4, c4: 1 },
    'PK-05': { c1: 3, c2: 3, c3: 3, c4: 5 },
  },
};

export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const { action } = body as { action: 'simulate' | 'reset' };

    if (action === 'simulate') {
      const prokers = await prisma.programKerja.findMany({
        orderBy: { code: 'asc' },
      });

      if (prokers.length === 0) {
        return NextResponse.json(
          { error: 'Tidak ada program kerja untuk disimulasikan.' },
          { status: 400 }
        );
      }

      const dmIds = ['dm-ketua', 'dm-wakil', 'dm-sekretaris', 'dm-bendahara'] as const;
      const now = new Date();
      const voteData = dmIds.flatMap((dmId, dmOffset) => {
        const preset = DEMO_MATRIX_PRESETS[dmId] || {};
        const inputs: TopsisScoreInput[] = prokers.map((p, idx) => {
          const found = preset[p.code];
          if (found) {
            return { prokerId: p.id, ...found };
          }
          return {
            prokerId: p.id,
            c1: ((idx + dmOffset) % 4) + 2,
            c2: ((idx + 1 + dmOffset) % 4) + 2,
            c3: ((idx + 2) % 4) + 2,
            c4: ((idx + dmOffset) % 4) + 1,
          };
        });

        const topsis = computeTopsis(inputs);
        return topsis.rows.map((row) => ({
          decisionMakerId: dmId,
          prokerId: row.prokerId,
          c1Score: row.raw.c1,
          c2Score: row.raw.c2,
          c3Score: row.raw.c3,
          c4Score: row.raw.c4,
          topsisScore: row.preferenceScore,
          rank: row.rank,
          bordaPoints: row.bordaPoints,
          submittedAt: now,
        }));
      });

      await prisma.$transaction([
        prisma.consensusRecord.deleteMany({}),
        prisma.vote.deleteMany({}),
        prisma.vote.createMany({ data: voteData }),
      ]);
    } else if (action === 'reset') {
      await prisma.$transaction([
        prisma.consensusRecord.deleteMany({}),
        prisma.vote.deleteMany({}),
        prisma.programKerja.deleteMany({}),
        prisma.programKerja.createMany({ data: SEED_PROKERS }),
      ]);
    }

    const state = await getFullGDSSState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('POST /api/demo error:', error);
    return NextResponse.json(
      { error: 'Gagal menjalankan aksi demo pada database.' },
      { status: 500 }
    );
  }
}
