import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFullGDSSState } from '@/lib/gdss-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, divisi, description, anggaran, targetPeserta } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: 'Nama program kerja wajib diisi.' },
        { status: 400 }
      );
    }

    // Generate next unique PK-XX code
    const existing = await prisma.programKerja.findMany({
      select: { code: true },
    });
    let maxNum = 0;
    for (const item of existing) {
      const match = item.code.match(/PK-(\d+)/);
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1], 10));
      }
    }
    const newCode = `PK-${String(maxNum + 1).padStart(2, '0')}`;

    await prisma.$transaction([
      prisma.programKerja.create({
        data: {
          code: newCode,
          name: String(name).trim(),
          divisi: String(divisi || 'Divisi Umum'),
          description: String(description || ''),
          anggaran: Number(anggaran) || 0,
          targetPeserta: String(targetPeserta || 'Mahasiswa'),
        },
      }),
      // Clear previous consensus & votes when alternative list changes
      prisma.consensusRecord.deleteMany({}),
      prisma.vote.deleteMany({}),
    ]);

    const state = await getFullGDSSState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('POST /api/proker error:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan program kerja.' },
      { status: 500 }
    );
  }
}
