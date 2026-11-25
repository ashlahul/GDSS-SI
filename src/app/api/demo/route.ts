import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeeded, getFullGDSSState, SEED_PROKERS } from '@/lib/gdss-server';
import { computeTopsis, TopsisScoreInput } from '@/lib/topsis';

type RoleScoresPreset = Record<string, { c1: number; c2: number; c3: number; c4: number }>;

const ROLE_MATRIX_PRESETS: Record<string, RoleScoresPreset> = {
  KETUA: {
    'PK-01': { c1: 5, c2: 5, c3: 5, c4: 2 },
    'PK-02': { c1: 5, c2: 4, c3: 5, c4: 4 },
    'PK-03': { c1: 4, c2: 4, c3: 4, c4: 2 },
    'PK-04': { c1: 3, c2: 4, c3: 3, c4: 2 },
    'PK-05': { c1: 3, c2: 3, c3: 4, c4: 4 },
  },
  WAKIL_KETUA: {
    'PK-01': { c1: 4, c2: 5, c3: 5, c4: 2 },
    'PK-02': { c1: 5, c2: 5, c3: 5, c4: 3 },
    'PK-03': { c1: 4, c2: 4, c3: 5, c4: 2 },
    'PK-04': { c1: 3, c2: 3, c3: 4, c4: 2 },
    'PK-05': { c1: 4, c2: 3, c3: 3, c4: 4 },
  },
  SEKRETARIS: {
    'PK-01': { c1: 4, c2: 5, c3: 4, c4: 2 },
    'PK-02': { c1: 4, c2: 3, c3: 4, c4: 4 },
    'PK-03': { c1: 5, c2: 5, c3: 4, c4: 2 },
    'PK-04': { c1: 3, c2: 5, c3: 4, c4: 2 },
    'PK-05': { c1: 3, c2: 3, c3: 3, c4: 3 },
  },
  BENDAHARA: {
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
      const [prokers, dms] = await Promise.all([
        prisma.programKerja.findMany({ orderBy: { code: 'asc' } }),
        prisma.decisionMaker.findMany({ where: { role: { not: 'ADMIN' } } }),
      ]);

      if (prokers.length === 0 || dms.length === 0) {
        return NextResponse.json(
          { error: 'Tidak ada program kerja atau penilai untuk disimulasikan.' },
          { status: 400 }
        );
      }

      const now = new Date();
      const voteData = dms.flatMap((dm, dmOffset) => {
        const preset = ROLE_MATRIX_PRESETS[dm.role] || {};
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
          decisionMakerId: dm.id,
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
