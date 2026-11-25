import { NextResponse, connection } from 'next/server';
import { getFullGDSSState } from '@/lib/gdss-server';

export async function GET() {
  await connection();
  try {
    const state = await getFullGDSSState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('GET /api/gdss error:', error);
    return NextResponse.json(
      {
        error:
          'Gagal terhubung ke database PostgreSQL. Pastikan DATABASE_URL sudah dikonfigurasi dengan benar.',
      },
      { status: 500 }
    );
  }
}
