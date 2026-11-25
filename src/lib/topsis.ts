export type CriterionType = 'BENEFIT' | 'COST';

export interface TopsisCriterion {
  id: 'c1' | 'c2' | 'c3' | 'c4';
  code: 'C1' | 'C2' | 'C3' | 'C4';
  name: string;
  shortName: string;
  type: CriterionType;
  weight: number;
  description: string;
}

export const TOPSIS_CRITERIA: TopsisCriterion[] = [
  {
    id: 'c1',
    code: 'C1',
    name: 'Urgensi & Dampak Organisasi',
    shortName: 'Dampak',
    type: 'BENEFIT',
    weight: 0.3,
    description:
      'Seberapa besar manfaat, dampak strategis, dan urgensi proker bagi anggota/mahasiswa (1 = rendah, 5 = sangat tinggi).',
  },
  {
    id: 'c2',
    code: 'C2',
    name: 'Kesiapan SDM & Administrasi',
    shortName: 'Kesiapan',
    type: 'BENEFIT',
    weight: 0.25,
    description:
      'Kesiapan panitia, kader pelaksana, jadwal kalender kerja, dan kelengkapan administrasi (1 = belum siap, 5 = sangat siap).',
  },
  {
    id: 'c3',
    code: 'C3',
    name: 'Keselarasan Visi & Sinergi',
    shortName: 'Sinergi',
    type: 'BENEFIT',
    weight: 0.25,
    description:
      'Kesesuaian dengan visi misi ormawa dan kolaborasi antar divisi (1 = kurang selaras, 5 = sangat selaras).',
  },
  {
    id: 'c4',
    code: 'C4',
    name: 'Beban Biaya & Risiko',
    shortName: 'Biaya (Cost)',
    type: 'COST',
    weight: 0.2,
    description:
      'Besar kebutuhan dana dan tingkat risiko pelaksanaan. Karena bertipe COST, nilai kecil (1 = hemat/ringan) lebih diunggulkan dibanding nilai besar (5 = mahal/berisiko).',
  },
];

export interface TopsisScoreInput {
  prokerId: string;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
}

export interface CriteriaVector {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
}

export interface TopsisComputedRow {
  prokerId: string;
  raw: CriteriaVector;
  normalized: CriteriaVector;
  weighted: CriteriaVector;
  dPlus: number;
  dMinus: number;
  preferenceScore: number; // V_i in [0, 1]
  rank: number; // 1..N
  bordaPoints: number; // N - rank + 1
}

export interface TopsisComputationResult {
  rows: TopsisComputedRow[];
  divisors: CriteriaVector;
  idealPositive: CriteriaVector;
  idealNegative: CriteriaVector;
}

export function clampCriteriaScore(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return 3;
  return Math.min(5, Math.max(1, Math.round(num)));
}

/**
 * Compute full TOPSIS decision matrix normalization, weighted matrix,
 * ideal positive/negative solutions, Euclidean distances, V_i scores,
 * individual rank, and converted Borda points (N - rank + 1).
 */
export function computeTopsis(inputs: TopsisScoreInput[]): TopsisComputationResult {
  const n = inputs.length;
  if (n === 0) {
    const zero: CriteriaVector = { c1: 0, c2: 0, c3: 0, c4: 0 };
    return { rows: [], divisors: zero, idealPositive: zero, idealNegative: zero };
  }

  const sanitized = inputs.map((item) => ({
    prokerId: item.prokerId,
    c1: clampCriteriaScore(item.c1),
    c2: clampCriteriaScore(item.c2),
    c3: clampCriteriaScore(item.c3),
    c4: clampCriteriaScore(item.c4),
  }));

  const keys = ['c1', 'c2', 'c3', 'c4'] as const;

  const divisors: CriteriaVector = { c1: 1, c2: 1, c3: 1, c4: 1 };
  for (const key of keys) {
    const sumSq = sanitized.reduce((acc, row) => acc + row[key] * row[key], 0);
    divisors[key] = sumSq > 0 ? Math.sqrt(sumSq) : 1;
  }

  const weightByKey = Object.fromEntries(
    TOPSIS_CRITERIA.map((c) => [c.id, c.weight])
  ) as Record<(typeof keys)[number], number>;

  const typeByKey = Object.fromEntries(
    TOPSIS_CRITERIA.map((c) => [c.id, c.type])
  ) as Record<(typeof keys)[number], CriterionType>;

  const intermediate = sanitized.map((row) => {
    const normalized: CriteriaVector = {
      c1: row.c1 / divisors.c1,
      c2: row.c2 / divisors.c2,
      c3: row.c3 / divisors.c3,
      c4: row.c4 / divisors.c4,
    };
    const weighted: CriteriaVector = {
      c1: normalized.c1 * weightByKey.c1,
      c2: normalized.c2 * weightByKey.c2,
      c3: normalized.c3 * weightByKey.c3,
      c4: normalized.c4 * weightByKey.c4,
    };
    return {
      prokerId: row.prokerId,
      raw: { c1: row.c1, c2: row.c2, c3: row.c3, c4: row.c4 },
      normalized,
      weighted,
    };
  });

  const idealPositive: CriteriaVector = { c1: 0, c2: 0, c3: 0, c4: 0 };
  const idealNegative: CriteriaVector = { c1: 0, c2: 0, c3: 0, c4: 0 };

  for (const key of keys) {
    const vals = intermediate.map((item) => item.weighted[key]);
    const maxVal = Math.max(...vals);
    const minVal = Math.min(...vals);
    if (typeByKey[key] === 'BENEFIT') {
      idealPositive[key] = maxVal;
      idealNegative[key] = minVal;
    } else {
      // COST criterion: smaller weighted value is ideal positive
      idealPositive[key] = minVal;
      idealNegative[key] = maxVal;
    }
  }

  const scored = intermediate.map((item, originalIndex) => {
    let sumSqPlus = 0;
    let sumSqMinus = 0;
    for (const key of keys) {
      const diffPlus = item.weighted[key] - idealPositive[key];
      const diffMinus = item.weighted[key] - idealNegative[key];
      sumSqPlus += diffPlus * diffPlus;
      sumSqMinus += diffMinus * diffMinus;
    }
    const dPlus = Math.sqrt(sumSqPlus);
    const dMinus = Math.sqrt(sumSqMinus);
    const denom = dPlus + dMinus;
    const preferenceScore = denom > 1e-12 ? dMinus / denom : 0;

    return {
      ...item,
      dPlus,
      dMinus,
      preferenceScore,
      originalIndex,
    };
  });

  // Sort by preferenceScore descending; preserve input order on exact ties
  const rankedSorted = [...scored].sort((a, b) => {
    if (Math.abs(b.preferenceScore - a.preferenceScore) > 1e-9) {
      return b.preferenceScore - a.preferenceScore;
    }
    return a.originalIndex - b.originalIndex;
  });

  const rankMap = new Map<string, number>();
  rankedSorted.forEach((row, idx) => {
    rankMap.set(row.prokerId, idx + 1);
  });

  const rows: TopsisComputedRow[] = scored.map((item) => {
    const rank = rankMap.get(item.prokerId) ?? n;
    return {
      prokerId: item.prokerId,
      raw: item.raw,
      normalized: item.normalized,
      weighted: item.weighted,
      dPlus: item.dPlus,
      dMinus: item.dMinus,
      preferenceScore: item.preferenceScore,
      rank,
      bordaPoints: n - rank + 1,
    };
  });

  return {
    rows,
    divisors,
    idealPositive,
    idealNegative,
  };
}
