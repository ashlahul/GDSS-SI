export type RoleType = 'KETUA' | 'WAKIL_KETUA' | 'SEKRETARIS' | 'BENDAHARA';

export interface DecisionMaker {
  id: string;
  name: string;
  nim: string;
  email: string;
  role: RoleType;
  roleLabel: string;
  isHighestRole: boolean;
  avatarColor: string;
}

export interface ProgramKerja {
  id: string;
  code: string;
  name: string;
  divisi: string;
  description: string;
  anggaran: number;
  targetPeserta: string;
}

export interface IndividualRankingItem {
  prokerId: string;
  c1Score: number;
  c2Score: number;
  c3Score: number;
  c4Score: number;
  topsisScore: number;
  rank: number; // 1 = highest TOPSIS preference (V_i)
  bordaPoints: number; // For N proker, Rank 1 gets N, Rank 2 gets N-1, etc.
}

export interface DecisionMakerVote {
  userId: string;
  submittedAt: string | null;
  rankings: IndividualRankingItem[];
}

export interface BordaDetailRow {
  proker: ProgramKerja;
  ketuaRank: number;
  ketuaPoints: number;
  ketuaTopsis: number;
  wakilRank: number;
  wakilPoints: number;
  wakilTopsis: number;
  sekretarisRank: number;
  sekretarisPoints: number;
  sekretarisTopsis: number;
  bendaharaRank: number;
  bendaharaPoints: number;
  bendaharaTopsis: number;
  totalBordaPoints: number;
  finalRank: number;
  statusRecommendation: 'Prioritas Utama' | 'Prioritas Kedua' | 'Dipertimbangkan / Cadangan';
}

export interface ConsensusRecord {
  calculatedAt: string;
  authorizedBy: string; // Ketua's name
  details: BordaDetailRow[];
}
