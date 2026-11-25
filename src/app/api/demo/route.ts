import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeeded, getFullGDSSState, SEED_PROKERS } from '@/lib/gdss-server';

export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const { action } = body as { action: 'simulate' | 'reset' };

    if (action === 'simulate') {
      const prokers = await prisma.programKerja.findMany({
        orderBy: { code: 'asc' },
      });
      const pIds = prokers.map((p) => p.id);

      if (pIds.length === 0) {
        return NextResponse.json(
          { error: 'Tidak ada program kerja untuk disimulasikan.' },
          { status: 400 }
        );
      }

      const ketuaOrder = [...pIds];
      const sekOrder = [...pIds];
      if (sekOrder.length >= 3) {
        const temp = sekOrder[0];
        sekOrder[0] = sekOrder[2];
        sekOrder[2] = temp;
      }

      const bendOrder = [...pIds];
      if (bendOrder.length >= 4) {
        const temp = bendOrder[1];
        bendOrder[1] = bendOrder[3];
        bendOrder[3] = temp;
      }

      const n = pIds.length;
      const now = new Date();

      const voteData = [
        ...ketuaOrder.map((prokerId, idx) => ({
          decisionMakerId: 'dm-ketua',
          prokerId,
          rank: idx + 1,
          bordaPoints: n - idx,
          submittedAt: now,
        })),
        ...sekOrder.map((prokerId, idx) => ({
          decisionMakerId: 'dm-sekretaris',
          prokerId,
          rank: idx + 1,
          bordaPoints: n - idx,
          submittedAt: now,
        })),
        ...bendOrder.map((prokerId, idx) => ({
          decisionMakerId: 'dm-bendahara',
          prokerId,
          rank: idx + 1,
          bordaPoints: n - idx,
          submittedAt: now,
        })),
      ];

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
