import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFullGDSSState } from '@/lib/gdss-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, rankedProkerIds } = body as {
      userId: string;
      rankedProkerIds: string[];
    };

    if (!userId || !Array.isArray(rankedProkerIds) || rankedProkerIds.length === 0) {
      return NextResponse.json(
        { error: 'Data penilaian tidak valid.' },
        { status: 400 }
      );
    }

    const n = rankedProkerIds.length;
    const now = new Date();

    await prisma.$transaction([
      prisma.vote.deleteMany({
        where: { decisionMakerId: userId },
      }),
      prisma.vote.createMany({
        data: rankedProkerIds.map((prokerId, idx) => ({
          decisionMakerId: userId,
          prokerId,
          rank: idx + 1,
          bordaPoints: n - idx,
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
      { error: 'Gagal menyimpan penilaian ke PostgreSQL.' },
      { status: 500 }
    );
  }
}
