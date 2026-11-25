'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from 'react';
import {
  DecisionMaker,
  ProgramKerja,
  DecisionMakerVote,
  ConsensusRecord,
  RoleType,
} from '@/types/gdss';
import { TopsisScoreInput } from '@/lib/topsis';

export const FALLBACK_ADMIN: DecisionMaker = {
  id: 'dm-admin',
  name: 'Administrator GDSS',
  nim: '-',
  email: 'admin@gmail.com',
  role: 'ADMIN',
  roleLabel: 'Administrator Sistem',
  isHighestRole: false,
  avatarColor: 'bg-neutral-800',
};

export const FALLBACK_DECISION_MAKERS: DecisionMaker[] = [
  {
    id: 'dm-ketua',
    name: 'Ashlahul Umam',
    nim: '240605110008',
    email: 'ashlah@gmail.com',
    role: 'KETUA',
    roleLabel: 'Ketua Umum',
    isHighestRole: true,
    avatarColor: 'bg-amber-600',
  },
  {
    id: 'dm-wakil',
    name: 'Zakka Yogaraksa',
    nim: '240605110009',
    email: 'zakka@gmail.com',
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
    role: 'BENDAHARA',
    roleLabel: 'Bendahara Umum',
    isHighestRole: false,
    avatarColor: 'bg-blue-600',
  },
];

export interface MemberInputPayload {
  name: string;
  nim: string;
  email: string;
  password?: string;
  role: RoleType;
  roleLabel: string;
}

interface GDSSContextType {
  accounts: DecisionMaker[];
  decisionMakers: DecisionMaker[];
  isAuthenticated: boolean;
  currentUser: DecisionMaker;
  loginWithCredentials: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  addMember: (
    payload: MemberInputPayload
  ) => Promise<{ success: boolean; message?: string }>;
  updateMember: (
    id: string,
    payload: Partial<MemberInputPayload>
  ) => Promise<{ success: boolean; message?: string }>;
  deleteMember: (id: string) => Promise<{ success: boolean; message?: string }>;
  programKerjaList: ProgramKerja[];
  addProker: (proker: Omit<ProgramKerja, 'id' | 'code'>) => Promise<void>;
  updateProker: (id: string, proker: Partial<ProgramKerja>) => Promise<void>;
  deleteProker: (id: string) => Promise<void>;
  votes: Record<string, DecisionMakerVote>;
  submitVote: (userId: string, criteriaInputs: TopsisScoreInput[]) => Promise<void>;
  isConsensusReady: boolean;
  consensusResult: ConsensusRecord | null;
  executeConsensus: () => Promise<{ success: boolean; message: string }>;
  resetConsensus: () => Promise<void>;
  refreshData: () => Promise<void>;
  isHydrated: boolean;
  isLoadingData: boolean;
  dbError: string | null;
}

const GDSSContext = createContext<GDSSContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'gdss_ormawa_session_v4';

function loadSession(): {
  isAuthenticated: boolean;
  currentUserId: string;
} {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        isAuthenticated: Boolean(parsed.isAuthenticated),
        currentUserId: parsed.currentUserId || 'dm-ketua',
      };
    }
  } catch (e) {
    console.error('Failed to read session', e);
  }
  return { isAuthenticated: false, currentUserId: 'dm-ketua' };
}

const emptySubscribe = () => () => {};

async function fetchGDSSStateWithRetry(maxAttempts = 2) {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch('/api/gdss', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat data dari PostgreSQL');
      }
      return data;
    } catch (err) {
      lastError =
        err instanceof Error ? err : new Error('Gagal terhubung ke PostgreSQL.');
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }
  }
  throw lastError || new Error('Gagal terhubung ke PostgreSQL.');
}

const InnerGDSSProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [initialSession] = useState(() => loadSession());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    initialSession.isAuthenticated
  );
  const [currentUserId, setCurrentUserId] = useState<string>(
    initialSession.currentUserId
  );

  const [accounts, setAccounts] = useState<DecisionMaker[]>([
    ...FALLBACK_DECISION_MAKERS,
    FALLBACK_ADMIN,
  ]);
  const [decisionMakers, setDecisionMakers] = useState<DecisionMaker[]>(
    FALLBACK_DECISION_MAKERS
  );
  const [programKerjaList, setProgramKerjaList] = useState<ProgramKerja[]>([]);
  const [votes, setVotes] = useState<Record<string, DecisionMakerVote>>({});
  const [consensusResult, setConsensusResult] =
    useState<ConsensusRecord | null>(null);

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ isAuthenticated, currentUserId })
      );
    } catch (e) {
      console.error('Failed to save session', e);
    }
  }, [isAuthenticated, currentUserId]);

  const applyServerState = useCallback(
    (data: {
      accounts?: DecisionMaker[];
      decisionMakers?: DecisionMaker[];
      programKerjaList?: ProgramKerja[];
      votes?: Record<string, DecisionMakerVote>;
      consensusResult?: ConsensusRecord | null;
    }) => {
      if (data.accounts?.length) setAccounts(data.accounts);
      if (data.decisionMakers?.length) setDecisionMakers(data.decisionMakers);
      if (data.programKerjaList) setProgramKerjaList(data.programKerjaList);
      if (data.votes) setVotes(data.votes);
      if (data.consensusResult !== undefined) {
        setConsensusResult(data.consensusResult);
      }
    },
    []
  );

  const refreshData = useCallback(async () => {
    setIsLoadingData(true);
    setDbError(null);
    try {
      const data = await fetchGDSSStateWithRetry(2);
      applyServerState(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gagal terhubung ke PostgreSQL.';
      setDbError(msg);
    } finally {
      setIsLoadingData(false);
    }
  }, [applyServerState]);

  useEffect(() => {
    let active = true;
    fetchGDSSStateWithRetry(2)
      .then((data) => {
        if (!active) return;
        applyServerState(data);
        setDbError(null);
      })
      .catch((err) => {
        if (!active) return;
        const msg =
          err instanceof Error ? err.message : 'Gagal terhubung ke PostgreSQL.';
        setDbError(msg);
      })
      .finally(() => {
        if (active) setIsLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [applyServerState]);

  const currentUser = useMemo(() => {
    return (
      accounts.find((acc) => acc.id === currentUserId) ||
      decisionMakers[0] ||
      FALLBACK_DECISION_MAKERS[0]
    );
  }, [accounts, decisionMakers, currentUserId]);

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          message:
            data.message ||
            'Email atau kata sandi tidak sesuai dengan akun terdaftar.',
        };
      }
      setCurrentUserId(data.user.id);
      setIsAuthenticated(true);
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return {
        success: false,
        message: 'Gagal terhubung ke server database PostgreSQL.',
      };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const addMember = async (payload: MemberInputPayload) => {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, actorId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Gagal menambahkan anggota.' };
      }
      applyServerState(data);
      return { success: true, message: 'Anggota berhasil ditambahkan.' };
    } catch {
      return { success: false, message: 'Gagal terhubung ke server.' };
    }
  };

  const updateMember = async (id: string, payload: Partial<MemberInputPayload>) => {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, actorId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Gagal memperbarui anggota.' };
      }
      applyServerState(data);
      return { success: true, message: 'Data anggota berhasil diperbarui.' };
    } catch {
      return { success: false, message: 'Gagal terhubung ke server.' };
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const res = await fetch(
        `/api/members/${id}?actorId=${encodeURIComponent(currentUser.id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Gagal menghapus anggota.' };
      }
      applyServerState(data);
      return { success: true, message: 'Anggota berhasil dihapus.' };
    } catch {
      return { success: false, message: 'Gagal terhubung ke server.' };
    }
  };

  const addProker = async (data: Omit<ProgramKerja, 'id' | 'code'>) => {
    const res = await fetch('/api/proker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    if (res.ok) applyServerState(updated);
  };

  const updateProker = async (id: string, data: Partial<ProgramKerja>) => {
    const res = await fetch(`/api/proker/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    if (res.ok) applyServerState(updated);
  };

  const deleteProker = async (id: string) => {
    const res = await fetch(`/api/proker/${id}`, {
      method: 'DELETE',
    });
    const updated = await res.json();
    if (res.ok) applyServerState(updated);
  };

  const submitVote = async (userId: string, criteriaInputs: TopsisScoreInput[]) => {
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, criteriaInputs }),
    });
    const updated = await res.json();
    if (res.ok) applyServerState(updated);
  };

  const isConsensusReady = useMemo(() => {
    if (programKerjaList.length === 0 || decisionMakers.length === 0) return false;
    return decisionMakers.every((dm) => {
      const v = votes[dm.id];
      return v && v.submittedAt && v.rankings.length === programKerjaList.length;
    });
  }, [decisionMakers, votes, programKerjaList]);

  const executeConsensus = async () => {
    try {
      const res = await fetch('/api/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Gagal mengesahkan konsensus.',
        };
      }
      if (data.state) applyServerState(data.state);
      return { success: true, message: data.message };
    } catch {
      return {
        success: false,
        message: 'Terjadi kesalahan saat menghubungi server PostgreSQL.',
      };
    }
  };

  const resetConsensus = async () => {
    const res = await fetch('/api/consensus', { method: 'DELETE' });
    const updated = await res.json();
    if (res.ok) applyServerState(updated);
  };

  return (
    <GDSSContext.Provider
      value={{
        accounts,
        decisionMakers,
        isAuthenticated,
        currentUser,
        loginWithCredentials,
        logout,
        addMember,
        updateMember,
        deleteMember,
        programKerjaList,
        addProker,
        updateProker,
        deleteProker,
        votes,
        submitVote,
        isConsensusReady,
        consensusResult,
        executeConsensus,
        resetConsensus,
        refreshData,
        isHydrated: true,
        isLoadingData,
        dbError,
      }}
    >
      {children}
    </GDSSContext.Provider>
  );
};

const SSR_FALLBACK_VALUE: GDSSContextType = {
  accounts: [...FALLBACK_DECISION_MAKERS, FALLBACK_ADMIN],
  decisionMakers: FALLBACK_DECISION_MAKERS,
  isAuthenticated: false,
  currentUser: FALLBACK_DECISION_MAKERS[0],
  loginWithCredentials: async () => ({ success: false, message: '' }),
  logout: () => {},
  addMember: async () => ({ success: false }),
  updateMember: async () => ({ success: false }),
  deleteMember: async () => ({ success: false }),
  programKerjaList: [],
  addProker: async () => {},
  updateProker: async () => {},
  deleteProker: async () => {},
  votes: {},
  submitVote: async () => {},
  isConsensusReady: false,
  consensusResult: null,
  executeConsensus: async () => ({ success: false, message: '' }),
  resetConsensus: async () => {},
  refreshData: async () => {},
  isHydrated: false,
  isLoadingData: true,
  dbError: null,
};

export const GDSSProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isHydrated) {
    return (
      <GDSSContext.Provider value={SSR_FALLBACK_VALUE}>
        {children}
      </GDSSContext.Provider>
    );
  }

  return <InnerGDSSProvider>{children}</InnerGDSSProvider>;
};

export const useGDSS = () => {
  const context = useContext(GDSSContext);
  if (!context) {
    throw new Error('useGDSS must be used within a GDSSProvider');
  }
  return context;
};
