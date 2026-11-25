import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeeded, getFullGDSSState } from '@/lib/gdss-server';
import { RoleType } from '@/types/gdss';

const ALLOWED_VOTER_ROLES: RoleType[] = [
  'KETUA',
  'WAKIL_KETUA',
  'SEKRETARIS',
  'BENDAHARA',
  'ANGGOTA',
];

const DEFAULT_ROLE_LABELS: Record<RoleType, string> = {
  ADMIN: 'Administrator Sistem',
  KETUA: 'Ketua Umum (Jabatan Tertinggi)',
  WAKIL_KETUA: 'Wakil Ketua Umum',
  SEKRETARIS: 'Sekretaris Jenderal',
  BENDAHARA: 'Bendahara Umum',
  ANGGOTA: 'Anggota Pengurus',
};

const AVATAR_COLOR_BY_ROLE: Record<RoleType, string> = {
  ADMIN: 'bg-neutral-800',
  KETUA: 'bg-amber-600',
  WAKIL_KETUA: 'bg-purple-600',
  SEKRETARIS: 'bg-emerald-600',
  BENDAHARA: 'bg-blue-600',
  ANGGOTA: 'bg-indigo-600',
};

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeeded();
    const { id } = await context.params;
    const body = await req.json();
    const { actorId, name, nim, email, password, role, roleLabel, isActive } = body as {
      actorId?: string;
      name?: string;
      nim?: string;
      email?: string;
      password?: string;
      role?: RoleType;
      roleLabel?: string;
      isActive?: boolean;
    };

    const actor = actorId
      ? await prisma.decisionMaker.findUnique({ where: { id: actorId } })
      : null;

    if (!actor || actor.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: hanya Administrator yang dapat mengubah data anggota.' },
        { status: 403 }
      );
    }

    const target = await prisma.decisionMaker.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json(
        { error: 'Data anggota tidak ditemukan.' },
        { status: 404 }
      );
    }

    const cleanName = name !== undefined ? String(name).trim() : target.name;
    const cleanNim = nim !== undefined ? String(nim).trim() : target.nim;
    const cleanEmail =
      email !== undefined ? String(email).trim().toLowerCase() : target.email;

    if (!cleanName || !cleanEmail) {
      return NextResponse.json(
        { error: 'Nama dan email anggota tidak boleh kosong.' },
        { status: 400 }
      );
    }

    if (password !== undefined && password.trim().length > 0 && password.trim().length < 6) {
      return NextResponse.json(
        { error: 'Password baru minimal harus 6 karakter.' },
        { status: 400 }
      );
    }

    const duplicateEmail = await prisma.decisionMaker.findFirst({
      where: {
        id: { not: id },
        email: { equals: cleanEmail, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicateEmail) {
      return NextResponse.json(
        { error: 'Email tersebut sudah digunakan oleh akun lain.' },
        { status: 409 }
      );
    }

    let nextRole = target.role as RoleType;
    if (target.role !== 'ADMIN' && role && ALLOWED_VOTER_ROLES.includes(role)) {
      nextRole = role;
    }

    if (target.role === 'KETUA' && nextRole !== 'KETUA') {
      return NextResponse.json(
        {
          error:
            'Jabatan Ketua Umum tidak boleh diturunkan langsung karena harus ada 1 Ketua sebagai pengesah konsensus.',
        },
        { status: 400 }
      );
    }

    if (target.role !== 'KETUA' && nextRole === 'KETUA') {
      const otherKetua = await prisma.decisionMaker.findFirst({
        where: { id: { not: id }, role: 'KETUA', isActive: true },
        select: { name: true },
      });
      if (otherKetua) {
        return NextResponse.json(
          {
            error: `Jabatan Ketua Umum sudah ditempati oleh ${otherKetua.name}.`,
          },
          { status: 409 }
        );
      }
    }

    let nextIsActive = target.isActive;
    if (typeof isActive === 'boolean') {
      if (target.role === 'ADMIN' || target.role === 'KETUA' || target.isHighestRole) {
        if (!isActive) {
          return NextResponse.json(
            { error: 'Akun Administrator dan Ketua Umum harus tetap aktif.' },
            { status: 400 }
          );
        }
      }
      if (target.isActive && !isActive) {
        const activeVoterCount = await prisma.decisionMaker.count({
          where: { role: { not: 'ADMIN' }, isActive: true },
        });
        if (activeVoterCount <= 2) {
          return NextResponse.json(
            { error: 'Minimal harus terdapat 2 Decision Maker aktif dalam sistem GDSS.' },
            { status: 400 }
          );
        }
      }
      nextIsActive = isActive;
    }

    const nextRoleLabel =
      roleLabel !== undefined
        ? String(roleLabel).trim() || DEFAULT_ROLE_LABELS[nextRole]
        : target.role !== nextRole
        ? DEFAULT_ROLE_LABELS[nextRole]
        : target.roleLabel;

    await prisma.decisionMaker.update({
      where: { id },
      data: {
        name: cleanName,
        nim: cleanNim,
        email: cleanEmail,
        role: nextRole,
        roleLabel: nextRoleLabel,
        isHighestRole: nextRole === 'KETUA',
        isActive: nextIsActive,
        avatarColor: AVATAR_COLOR_BY_ROLE[nextRole],
        ...(password && password.trim().length >= 6
          ? { password: password.trim() }
          : {}),
      },
    });

    const state = await getFullGDSSState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('PATCH /api/members/[id] error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui data anggota.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeeded();
    const { id } = await context.params;
    const url = new URL(req.url);
    const actorId = url.searchParams.get('actorId');

    const actor = actorId
      ? await prisma.decisionMaker.findUnique({ where: { id: actorId } })
      : null;

    if (!actor || actor.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: hanya Administrator yang dapat menonaktifkan anggota.' },
        { status: 403 }
      );
    }

    const target = await prisma.decisionMaker.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json(
        { error: 'Data anggota tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (target.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Akun Administrator tidak dapat dinonaktifkan.' },
        { status: 400 }
      );
    }

    if (target.role === 'KETUA' || target.isHighestRole) {
      return NextResponse.json(
        {
          error:
            'Akun Ketua Umum tidak dapat dinonaktifkan karena diperlukan sebagai pengesah konsensus.',
        },
        { status: 400 }
      );
    }

    if (!target.isActive) {
      const state = await getFullGDSSState();
      return NextResponse.json(state);
    }

    const activeVoterCount = await prisma.decisionMaker.count({
      where: { role: { not: 'ADMIN' }, isActive: true },
    });
    if (activeVoterCount <= 2) {
      return NextResponse.json(
        { error: 'Minimal harus terdapat 2 Decision Maker aktif dalam sistem GDSS.' },
        { status: 400 }
      );
    }

    // Soft-delete: set isActive = false without deleting Vote or Consensus history
    await prisma.decisionMaker.update({
      where: { id },
      data: { isActive: false },
    });

    const state = await getFullGDSSState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('DELETE /api/members/[id] error:', error);
    return NextResponse.json(
      { error: 'Gagal menonaktifkan anggota.' },
      { status: 500 }
    );
  }
}
