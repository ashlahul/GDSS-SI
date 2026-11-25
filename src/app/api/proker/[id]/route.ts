import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFullGDSSState } from '@/lib/gdss-server';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    await prisma.programKerja.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.divisi !== undefined && { divisi: String(body.divisi) }),
        ...(body.description !== undefined && {
          description: String(body.description),
        }),
        ...(body.anggaran !== undefined && { anggaran: Number(body.anggaran) }),
        ...(body.targetPeserta !== undefined && {
          targetPeserta: String(body.targetPeserta),
        }),
      },
    });

    const state = await getFullGDSSState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('PATCH /api/proker/[id] error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui program kerja.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await prisma.$transaction([
      prisma.programKerja.delete({
        where: { id },
      }),
      prisma.consensusRecord.deleteMany({}),
      prisma.vote.deleteMany({}),
    ]);

    const state = await getFullGDSSState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('DELETE /api/proker/[id] error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus program kerja.' },
      { status: 500 }
    );
  }
}
