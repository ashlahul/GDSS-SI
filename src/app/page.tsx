'use client';

import React, { useState } from 'react';
import { useGDSS } from '@/context/GDSSContext';
import { LoginView } from '@/components/LoginView';
import { AppShell } from '@/components/AppShell';
import { OverviewTab } from '@/components/tabs/OverviewTab';
import { ProkerTab } from '@/components/tabs/ProkerTab';
import { VotingTab } from '@/components/tabs/VotingTab';
import { ConsensusTab } from '@/components/tabs/ConsensusTab';
import { ResultsTab } from '@/components/tabs/ResultsTab';
import { MethodGuideTab } from '@/components/tabs/MethodGuideTab';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Home() {
  const { isHydrated, isAuthenticated, isLoadingData, dbError, refreshData } =
    useGDSS();
  const [activeTab, setActiveTab] = useState<string>('overview');

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f7f9]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-neutral-500">
            Memuat Sistem GDSS Ormawa...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {dbError && (
        <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs print:hidden">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Gagal Terhubung ke Database PostgreSQL</h4>
              <p className="mt-0.5 text-rose-800">{dbError}</p>
            </div>
          </div>
          <button
            onClick={() => refreshData()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
          </button>
        </div>
      )}

      {isLoadingData && !dbError ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-7 h-7 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-neutral-500">
            Menyinkronkan data dari Neon PostgreSQL...
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab onNavigate={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'proker' && <ProkerTab />}
          {activeTab === 'voting' && (
            <VotingTab onNavigateToConsensus={() => setActiveTab('consensus')} />
          )}
          {activeTab === 'consensus' && (
            <ConsensusTab onNavigateToResults={() => setActiveTab('results')} />
          )}
          {activeTab === 'results' && (
            <ResultsTab onNavigateToConsensus={() => setActiveTab('consensus')} />
          )}
          {activeTab === 'guide' && (
            <MethodGuideTab onNavigate={(tab) => setActiveTab(tab)} />
          )}
        </>
      )}
    </AppShell>
  );
}
