import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureSeeded, getFullGDSSState } from '@/lib/gdss-server';
import { RoleType } from '@/types/gdss';

const ALLOWED_MEMBER_ROLES: RoleType[] = [
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

export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const { actorId, name, nim, email, password, role, roleLabel } = body as {
      actorId?: string;
      name?: string;
      nim?: string;
      email?: string;
      password?: string;
      role?: RoleType;
      roleLabel?: string;
    };

    const actor = actorId
      ? await prisma.decisionMaker.findUnique({ where: { id: actorId } })
      : null;

    if (!actor || actor.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: hanya Administrator yang dapat menambah anggota.' },
        { status: 403 }
      );
    }

    const cleanName = String(name || '').trim();
    const cleanNim = String(nim || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');
    const nextRole = role && ALLOWED_MEMBER_ROLES.includes(role) ? role : 'ANGGOTA';

    if (!cleanName || !cleanEmail || cleanPassword.length < 6) {
      return NextResponse.json(
        {
          error:
            'Nama, email, dan password (minimal 6 karakter) wajib diisi dengan benar.',
        },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.decisionMaker.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
      select: { id: true, name: true, isActive: true },
    });
    if (existingEmail) {
      return NextResponse.json(
        {
          error: existingEmail.isActive
            ? 'Email tersebut sudah digunakan oleh anggota lain.'
            : `Email tersebut terdaftar pada anggota nonaktif (${existingEmail.name}). Aktifkan kembali anggota tersebut jika ingin memakainya.`,
        },
        { status: 409 }
      );
    }

    if (nextRole === 'KETUA') {
      const existingKetua = await prisma.decisionMaker.findFirst({
        where: { role: 'KETUA', isActive: true },
        select: { name: true },
      });
      if (existingKetua) {
        return NextResponse.json(
          {
            error: `Jabatan Ketua Umum sudah ditempati oleh ${existingKetua.name}. Edit akun Ketua yang ada jika ingin mengganti orangnya.`,
          },
          { status: 409 }
        );
      }
    }

    const cleanRoleLabel =
      String(roleLabel || '').trim() || DEFAULT_ROLE_LABELS[nextRole];

    const newId = `dm-${crypto.randomUUID().slice(0, 8)}`;

    await prisma.decisionMaker.create({
      data: {
        id: newId,
        name: cleanName,
        nim: cleanNim,
        email: cleanEmail,
        password: cleanPassword,
        role: nextRole,
        roleLabel: cleanRoleLabel,
        isHighestRole: nextRole === 'KETUA',
        isActive: true,
        avatarColor: AVATAR_COLOR_BY_ROLE[nextRole],
      },
    });

    const state = await getFullGDSSState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('POST /api/members error:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan anggota ke database.' },
      { status: 500 }
    );
  }
}
