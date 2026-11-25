import { NextResponse } from 'next/server';
import { prisma, withDbRetry } from '@/lib/prisma';
import { ensureSeeded } from '@/lib/gdss-server';

export async function POST(req: Request) {
  try {
    await withDbRetry(() => ensureSeeded());
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const user = await prisma.decisionMaker.findFirst({
      where: {
        email: {
          equals: String(email).trim(),
          mode: 'insensitive',
        },
        password: String(password),
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Email atau kata sandi tidak sesuai dengan akun Decision Maker terdaftar.',
        },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Akun Anda telah dinonaktifkan oleh Administrator dan tidak dapat mengakses sistem.',
        },
        { status: 403 }
      );
    }

    const { password: _password, ...safeUser } = user;
    void _password;

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: `Berhasil masuk sebagai ${user.roleLabel}`,
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat verifikasi login ke database.' },
      { status: 500 }
    );
  }
}
