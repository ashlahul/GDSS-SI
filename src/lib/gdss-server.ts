import { prisma } from '@/lib/prisma';
import {
  DecisionMaker,
  ProgramKerja,
  DecisionMakerVote,
  ConsensusRecord,
  BordaDetailRow,
  RoleType,
} from '@/types/gdss';

export const SEED_DECISION_MAKERS: (DecisionMaker & { password: string })[] = [
  {
    id: 'dm-ketua',
    name: 'Ashlahul Umam',
    nim: '240605110008',
    email: 'ashlah@gmail.com',
    password: 'password123',
    role: 'KETUA',
    roleLabel: 'Ketua Umum (Jabatan Tertinggi)',
    isHighestRole: true,
    avatarColor: 'bg-amber-600',
  },
  {
    id: 'dm-wakil',
    name: 'Zakka Yogaraksa',
    nim: '240605110009',
    email: 'zakka@gmail.com',
    password: 'password123',
    role: 'WAKIL_KETUA',
    roleLabel: 'Wakil Ketua Umum',
    isHighestRole: false,
    avatarColor: 'bg-purple-600',
  },
  {
    id: 'dm-sekretaris',
    name: 'Muhammad Akmalul Fikri',
    nim: '240605110147',
    email: 'akmal@gmail.com',
    password: 'password123',
    role: 'SEKRETARIS',
    roleLabel: 'Sekretaris Jenderal',
    isHighestRole: false,
    avatarColor: 'bg-emerald-600',
  },
  {
    id: 'dm-bendahara',
    name: 'Ega Fikri Prayoga',
    nim: '240605110151',
    email: 'ega@gmail.com',
    password: 'password123',
    role: 'BENDAHARA',
    roleLabel: 'Bendahara Umum',
    isHighestRole: false,
    avatarColor: 'bg-blue-600',
  },
];

export const SEED_PROKERS: Omit<ProgramKerja, 'id'>[] = [
  {
    code: 'PK-01',
    name: 'Latihan Keterampilan Manajemen Mahasiswa (LKMM-TD)',
    divisi: 'Kaderisasi & Pengembangan Organisasi',
    description:
      'Pelatihan kepemimpinan dasar dan manajerial untuk anggota baru dan mahasiswa umum.',
    anggaran: 8500000,
    targetPeserta: '120 Mahasiswa',
  },
  {
    code: 'PK-02',
    name: 'National Tech Expo & Hackathon 2027',
    divisi: 'Riset & Teknologi Informasi',
    description:
      'Kompetisi pengembangan aplikasi dan pameran inovasi teknologi tingkat nasional.',
    anggaran: 18500000,
    targetPeserta: '40 Tim / 200 Mahasiswa Se-Indonesia',
  },
  {
    code: 'PK-03',
    name: 'Bakti Desa & Pengabdian Masyarakat Berkelanjutan',
    divisi: 'Pengabdian Masyarakat & Sosial',
    description:
      'Sosialisasi literasi digital, renovasi fasilitas baca, dan cek kesehatan gratis di desa binaan.',
    anggaran: 7200000,
    targetPeserta: '350 Warga Desa Sukamaju',
  },
  {
    code: 'PK-04',
    name: 'Company Visit & Career Mentoring Day',
    divisi: 'Hubungan Industri & Alumni',
    description:
      'Kunjungan ke 3 perusahaan teknologi terkemuka dan workshop review CV/portofolio bersama praktisi.',
    anggaran: 6000000,
    targetPeserta: '80 Mahasiswa Tingkat Akhir',
  },
  {
    code: 'PK-05',
    name: 'Dies Natalis & Gebyar Seni Budaya Ormawa',
    divisi: 'Minat, Bakat & Apresiasi Seni',
    description:
      'Peringatan ulang tahun ormawa dengan pentas seni musik, teater budaya, dan bazar UMKM mahasiswa.',
    anggaran: 12000000,
    targetPeserta: '500 Mahasiswa & Tamu Undangan',
  },
];

const ROLE_ORDER: Record<RoleType, number> = {
  KETUA: 1,
  WAKIL_KETUA: 2,
  SEKRETARIS: 3,
  BENDAHARA: 4,
};

export async function ensureSeeded() {
  const existingDms = await prisma.decisionMaker.findMany({
    select: { id: true, name: true, nim: true, email: true, password: true },
  });

  const needsSync =
    existingDms.length !== SEED_DECISION_MAKERS.length ||
    SEED_DECISION_MAKERS.some((seed) => {
      const found = existingDms.find((e) => e.id === seed.id);
      return (
        !found ||
        found.name !== seed.name ||
        found.nim !== seed.nim ||
        found.email !== seed.email ||
        found.password !== seed.password
      );
    });

  if (needsSync) {
    for (const dm of SEED_DECISION_MAKERS) {
      await prisma.decisionMaker.upsert({
        where: { id: dm.id },
        update: {
          name: dm.name,
          nim: dm.nim,
          email: dm.email,
          password: dm.password,
          role: dm.role,
          roleLabel: dm.roleLabel,
          isHighestRole: dm.isHighestRole,
          avatarColor: dm.avatarColor,
        },
        create: {
          id: dm.id,
          name: dm.name,
          nim: dm.nim,
          email: dm.email,
          password: dm.password,
          role: dm.role,
          roleLabel: dm.roleLabel,
          isHighestRole: dm.isHighestRole,
          avatarColor: dm.avatarColor,
        },
      });
    }
  }

  const prokerCount = await prisma.programKerja.count();
  if (prokerCount === 0) {
    await prisma.programKerja.createMany({
      data: SEED_PROKERS,
      skipDuplicates: true,
    });
  }
}

export async function getFullGDSSState() {
  await ensureSeeded();

  const [dms, prokers, allVotes, latestConsensus] = await Promise.all([
    prisma.decisionMaker.findMany(),
    prisma.programKerja.findMany({
      orderBy: { code: 'asc' },
    }),
    prisma.vote.findMany({
      orderBy: { rank: 'asc' },
    }),
    prisma.consensusRecord.findFirst({
      orderBy: { calculatedAt: 'desc' },
      include: {
        details: {
          orderBy: { finalRank: 'asc' },
          include: {
            proker: true,
          },
        },
      },
    }),
  ]);

  const decisionMakers: DecisionMaker[] = dms
    .map((dm) => ({
      id: dm.id,
      name: dm.name,
      nim: dm.nim,
      email: dm.email,
      role: dm.role as RoleType,
      roleLabel: dm.roleLabel,
      isHighestRole: dm.isHighestRole,
      avatarColor: dm.avatarColor,
    }))
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);

  const programKerjaList: ProgramKerja[] = prokers.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    divisi: p.divisi,
    description: p.description,
    anggaran: p.anggaran,
    targetPeserta: p.targetPeserta,
  }));

  const votes: Record<string, DecisionMakerVote> = {};
  for (const dm of decisionMakers) {
    const userVotes = allVotes.filter((v) => v.decisionMakerId === dm.id);
    votes[dm.id] = {
      userId: dm.id,
      submittedAt:
        userVotes.length > 0 ? userVotes[0].submittedAt.toISOString() : null,
      rankings: userVotes.map((v) => ({
        prokerId: v.prokerId,
        c1Score: v.c1Score,
        c2Score: v.c2Score,
        c3Score: v.c3Score,
        c4Score: v.c4Score,
        topsisScore: v.topsisScore,
        rank: v.rank,
        bordaPoints: v.bordaPoints,
      })),
    };
  }

  let consensusResult: ConsensusRecord | null = null;
  if (latestConsensus) {
    const details: BordaDetailRow[] = latestConsensus.details.map((d) => ({
      proker: {
        id: d.proker.id,
        code: d.proker.code,
        name: d.proker.name,
        divisi: d.proker.divisi,
        description: d.proker.description,
        anggaran: d.proker.anggaran,
        targetPeserta: d.proker.targetPeserta,
      },
      ketuaRank: d.ketuaRank,
      ketuaPoints: d.ketuaPoints,
      ketuaTopsis: d.ketuaTopsis,
      wakilRank: d.wakilRank,
      wakilPoints: d.wakilPoints,
      wakilTopsis: d.wakilTopsis,
      sekretarisRank: d.sekretarisRank,
      sekretarisPoints: d.sekretarisPoints,
      sekretarisTopsis: d.sekretarisTopsis,
      bendaharaRank: d.bendaharaRank,
      bendaharaPoints: d.bendaharaPoints,
      bendaharaTopsis: d.bendaharaTopsis,
      totalBordaPoints: d.totalBordaPoints,
      finalRank: d.finalRank,
      statusRecommendation:
        d.statusRecommendation as BordaDetailRow['statusRecommendation'],
    }));

    consensusResult = {
      calculatedAt: latestConsensus.calculatedAt.toISOString(),
      authorizedBy: latestConsensus.authorizedByName,
      details,
    };
  }

  return {
    decisionMakers,
    programKerjaList,
    votes,
    consensusResult,
  };
}
