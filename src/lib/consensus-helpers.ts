import { BordaDetailRow, ConsensusMemberScore, DecisionMaker } from '@/types/gdss';

/**
 * Resolve per-member scores from the stored dynamic snapshot, falling back to
 * legacy fixed-role columns if an older ConsensusRecord lacks memberScores.
 */
export function getRowMemberScores(
  row: BordaDetailRow,
  decisionMakers: DecisionMaker[] = []
): ConsensusMemberScore[] {
  if (row.memberScores && row.memberScores.length > 0) {
    return row.memberScores;
  }

  const findDm = (role: DecisionMaker['role'], fallbackName: string, fallbackLabel: string) => {
    const found = decisionMakers.find((d) => d.role === role);
    return {
      dmId: found?.id || `dm-${role.toLowerCase()}`,
      dmName: found?.name || fallbackName,
      dmNim: found?.nim || '',
      role,
      roleLabel: found?.roleLabel || fallbackLabel,
    };
  };

  return [
    {
      ...findDm('KETUA', 'Ketua Umum', 'Ketua Umum'),
      rank: row.ketuaRank,
      bordaPoints: row.ketuaPoints,
      topsisScore: row.ketuaTopsis,
    },
    {
      ...findDm('WAKIL_KETUA', 'Wakil Ketua', 'Wakil Ketua Umum'),
      rank: row.wakilRank,
      bordaPoints: row.wakilPoints,
      topsisScore: row.wakilTopsis,
    },
    {
      ...findDm('SEKRETARIS', 'Sekretaris', 'Sekretaris Jenderal'),
      rank: row.sekretarisRank,
      bordaPoints: row.sekretarisPoints,
      topsisScore: row.sekretarisTopsis,
    },
    {
      ...findDm('BENDAHARA', 'Bendahara', 'Bendahara Umum'),
      rank: row.bendaharaRank,
      bordaPoints: row.bendaharaPoints,
      topsisScore: row.bendaharaTopsis,
    },
  ];
}
