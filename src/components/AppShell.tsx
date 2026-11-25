'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGDSS } from '@/context/GDSSContext';
import {
  LayoutDashboard,
  FolderKanban,
  ListOrdered,
  Scale,
  Trophy,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  LogOut,
  X,
  Menu,
  User,
  RotateCw,
  Crown,
} from 'lucide-react';

interface AppShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard GDSS', icon: LayoutDashboard },
  { id: 'proker', label: 'Alternatif Proker', icon: FolderKanban },
  { id: 'voting', label: 'Penilaian Saya', icon: ListOrdered },
];

const CONSENSUS_NAV_ITEMS: NavItem[] = [
  { id: 'consensus', label: 'Konsensus Borda', icon: Scale },
  { id: 'results', label: 'Hasil & Berita Acara', icon: Trophy },
  { id: 'guide', label: 'Alur & Metode Borda', icon: BookOpen },
];

const COLLAPSED_STORAGE_KEY = 'gdss_sidebar_collapsed';

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  setActiveTab,
  children,
}) => {
  const {
    currentUser,
    decisionMakers,
    programKerjaList,
    votes,
    consensusResult,
    refreshData,
    isLoadingData,
    logout,
  } = useGDSS();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Expanded mode sliding frosted capsule state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [indicator, setIndicator] = useState<{
    top: number;
    height: number;
    opacity: number;
  }>({ top: 0, height: 0, opacity: 0 });

  // Collapsed mode gliding circular indicator + dock zoom + speech tooltip
  const [collapsedIndicator, setCollapsedIndicator] = useState<{
    top: number;
    opacity: number;
  }>({ top: 0, opacity: 0 });
  const [hoveredCollapsedIndex, setHoveredCollapsedIndex] = useState<number | null>(
    null
  );
  const [collapsedTooltip, setCollapsedTooltip] = useState<{
    label: string;
    isActive?: boolean;
    top: number;
    left: number;
  } | null>(null);
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const collapsedItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const profileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalProker = programKerjaList.length;
  const completedCount = decisionMakers.filter((dm) => {
    const v = votes[dm.id];
    return v && v.submittedAt && v.rankings.length === totalProker && totalProker > 0;
  }).length;

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
    setCollapsedTooltip(null);
  }, []);

  const updateIndicator = useCallback(
    (targetId: string | null) => {
      if (isCollapsed) {
        setIndicator((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      const id = targetId || activeTab;
      const el = itemRefs.current[id];
      const container = navContainerRef.current;
      if (el && container) {
        const elRect = el.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        setIndicator({
          top: elRect.top - contRect.top + container.scrollTop,
          height: elRect.height,
          opacity: 1,
        });
      } else {
        setIndicator((prev) => ({ ...prev, opacity: 0 }));
      }
    },
    [activeTab, isCollapsed]
  );

  const updateCollapsedIndicator = useCallback(
    (targetId: string | null) => {
      if (!isCollapsed) {
        setCollapsedIndicator((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      const id = targetId || activeTab;
      const el = collapsedItemRefs.current[id];
      const container = navContainerRef.current;
      if (el && container) {
        const elRect = el.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        setCollapsedIndicator({
          top: elRect.top - contRect.top + container.scrollTop,
          opacity: 1,
        });
      } else {
        setCollapsedIndicator((prev) => ({ ...prev, opacity: 0 }));
      }
    },
    [activeTab, isCollapsed]
  );

  // Sync gliding capsule position on activeTab, collapse toggle, or search change
  useEffect(() => {
    const t1 = setTimeout(() => {
      if (isCollapsed) {
        updateCollapsedIndicator(null);
      } else {
        updateIndicator(null);
      }
    }, 40);
    const t2 = setTimeout(() => {
      if (isCollapsed) {
        updateCollapsedIndicator(null);
      } else {
        updateIndicator(null);
      }
    }, 220);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeTab, isCollapsed, sidebarSearch, updateIndicator, updateCollapsedIndicator]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isCollapsed) {
        updateCollapsedIndicator(null);
      } else {
        updateIndicator(hoveredId);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed, hoveredId, updateIndicator, updateCollapsedIndicator]);

  // Keyboard shortcuts: Ctrl/Cmd + B collapse, Ctrl/Cmd + K search, Escape clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCollapsed(false);
        setTimeout(() => searchInputRef.current?.focus(), 140);
      } else if (e.key === 'Escape' && sidebarSearch) {
        setSidebarSearch('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarSearch, toggleCollapse]);

  const getCollapsedScale = (index: number) => {
    if (hoveredCollapsedIndex === null) return 1.0;
    const dist = Math.abs(hoveredCollapsedIndex - index);
    if (dist === 0) return 1.18;
    if (dist === 1) return 1.08;
    if (dist === 2) return 1.03;
    return 1.0;
  };

  const getCollapsedZIndex = (index: number) => {
    if (hoveredCollapsedIndex === null) return 1;
    const dist = Math.abs(hoveredCollapsedIndex - index);
    if (dist === 0) return 30;
    if (dist === 1) return 20;
    if (dist === 2) return 10;
    return 1;
  };

  const getCollapsedBubbleClass = (index: number, isActive: boolean) => {
    if (hoveredCollapsedIndex === null) {
      return isActive
        ? 'text-purple-700 font-bold'
        : 'text-neutral-500 hover:text-neutral-900';
    }
    const dist = Math.abs(hoveredCollapsedIndex - index);
    if (dist === 0) {
      return isActive
        ? 'text-purple-700 font-bold'
        : 'bg-white/60 text-neutral-900 border border-white/80 shadow-xs backdrop-blur-md';
    }
    if (dist === 1) {
      return isActive
        ? 'text-purple-700 font-bold'
        : 'text-neutral-700 bg-white/25 backdrop-blur-xs';
    }
    return isActive ? 'text-purple-600 font-medium' : 'text-neutral-500';
  };

  const showTooltip = (
    label: string,
    isActive: boolean,
    e: React.MouseEvent<HTMLElement>
  ) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCollapsedTooltip({
      label,
      isActive,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const hideTooltip = () => {
    setCollapsedTooltip(null);
    setHoveredCollapsedIndex(null);
  };

  const filteredMain = MAIN_NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(sidebarSearch.trim().toLowerCase())
  );
  const filteredConsensus = CONSENSUS_NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(sidebarSearch.trim().toLowerCase())
  );
  const hasNoResults =
    sidebarSearch.trim() !== '' &&
    filteredMain.length === 0 &&
    filteredConsensus.length === 0;

  const allNavItems = [...filteredMain, ...filteredConsensus];
  const activeCollapsedIndex = allNavItems.findIndex((i) => i.id === activeTab);
  const indicatorCollapsedScale =
    activeCollapsedIndex !== -1 ? getCollapsedScale(activeCollapsedIndex) : 1.0;

  const userInitial = currentUser.name.trim().charAt(0).toUpperCase() || 'U';

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    if (isCollapsed) {
      updateCollapsedIndicator(id);
    } else {
      updateIndicator(id);
    }
  };

  return (
    <div className="flex min-h-screen md:h-screen md:overflow-hidden flex-col md:flex-row bg-[#f6f7f9] text-neutral-900 font-sans">
      {/* Mobile Topbar */}
      <header className="md:hidden sticky top-0 z-40 h-12 bg-white border-b border-neutral-200 px-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            aria-label="Buka navigasi"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm text-neutral-900">GDSS Ormawa</span>
          <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-purple-100/70 text-purple-700 border border-purple-200/50">
            Borda
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
            {currentUser.role}
          </span>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex print:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[85vw] h-full bg-white z-10 shadow-2xl flex flex-col justify-between p-3">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-sm text-neutral-900">GDSS Ormawa</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                    MENU UTAMA
                  </div>
                  <div className="space-y-0.5">
                    {MAIN_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                            isActive
                              ? 'bg-purple-50 text-purple-700 font-semibold'
                              : 'text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                    KONSENSUS & SISTEM
                  </div>
                  <div className="space-y-0.5">
                    {CONSENSUS_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                            isActive
                              ? 'bg-purple-50 text-purple-700 font-semibold'
                              : 'text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100">
              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-neutral-500 truncate">
                    {currentUser.roleLabel}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Glassy Floating Sidebar V5 (1:1 KafaBot glass-sidebar.tsx) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 select-none z-30 transition-[width] duration-300 ease-in-out h-screen p-2.5 print:hidden ${
          isCollapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div
          className={`relative h-full w-full rounded-[26px] bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_10px_35px_rgba(15,23,42,0.06)] ring-1 ring-neutral-200/60 flex flex-col justify-between transition-all duration-300 ${
            isCollapsed ? 'overflow-visible' : 'overflow-hidden'
          }`}
        >
          {/* Top Brand & Nav */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header Bar */}
            <div
              className={`relative shrink-0 flex items-center transition-all duration-300 ${
                isCollapsed
                  ? 'h-14 justify-center'
                  : 'h-14 px-3.5 justify-between border-b border-neutral-100/80'
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelectTab('overview')}
                className={`flex items-center gap-2.5 transition-all group cursor-pointer ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-white/95 border border-neutral-200/80 shadow-xs ring-1 ring-white/90 group-hover:scale-105 group-hover:shadow-md group-hover:border-purple-300 transition-all duration-200 shrink-0 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-purple-600" />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold tracking-tight text-neutral-900 group-hover:text-purple-700 transition-colors">
                        GDSS Ormawa
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-purple-100/70 text-purple-700 border border-purple-200/50">
                        Borda
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-medium truncate max-w-[130px]">
                      Prioritas Program Kerja
                    </span>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={toggleCollapse}
                title={isCollapsed ? 'Buka Sidebar (Ctrl+B)' : 'Tutup Sidebar (Ctrl+B)'}
                className={`rounded-full bg-white/95 border border-neutral-200/90 shadow-md flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-white hover:scale-110 hover:shadow-lg hover:border-purple-300 active:scale-95 transition-all duration-200 cursor-pointer z-20 ${
                  isCollapsed
                    ? 'absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5'
                    : 'w-6 h-6'
                }`}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-neutral-600" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5 text-neutral-600" />
                )}
              </button>
            </div>

            {/* Sidebar Search Bar */}
            {!isCollapsed ? (
              <div className="px-3 pt-3 pb-1 shrink-0">
                <div className="relative flex items-center bg-neutral-100/70 hover:bg-neutral-100/90 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-300 rounded-xl px-2.5 py-1.5 border border-neutral-200/60 transition-all duration-200">
                  <Search className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder="Cari menu..."
                    className="text-xs text-neutral-800 placeholder:text-neutral-400 bg-transparent outline-none w-full"
                  />
                  {sidebarSearch ? (
                    <button
                      onClick={() => setSidebarSearch('')}
                      className="p-0.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200/60 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-mono border border-neutral-200/80 rounded px-1 py-0.5 bg-white/80 shrink-0 select-none">
                      ⌘K
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-2 pt-1 pb-2 shrink-0 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsCollapsed(false);
                    setTimeout(() => searchInputRef.current?.focus(), 140);
                  }}
                  onMouseEnter={(e) => showTooltip('Cari menu... (⌘K)', false, e)}
                  onMouseLeave={hideTooltip}
                  title="Cari Menu (Ctrl+K)"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:text-purple-600 hover:bg-white/80 hover:backdrop-blur-md hover:border hover:border-white/90 hover:shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Scrollable Nav Items with Floating Gliding Glass Capsule */}
            <div
              ref={navContainerRef}
              onScroll={() => updateIndicator(hoveredId)}
              onMouseLeave={() => {
                setHoveredId(null);
                updateIndicator(null);
                setHoveredCollapsedIndex(null);
                hideTooltip();
              }}
              className="relative flex-1 overflow-y-auto px-2 py-2 space-y-4 custom-scrollbar"
            >
              {/* Collapsed Mode Gliding Active Circular Capsule */}
              {isCollapsed && (
                <div
                  className="absolute left-0 right-0 flex justify-center pointer-events-none z-0"
                  style={{
                    transform: `translateY(${collapsedIndicator.top}px)`,
                    opacity: collapsedIndicator.opacity,
                    transition:
                      'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease',
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${indicatorCollapsedScale})`,
                      transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    className="relative w-10 h-10 rounded-full bg-white shadow-[0_4px_18px_rgba(124,58,237,0.22),0_2px_8px_rgba(0,0,0,0.06)] border border-purple-200/90 ring-2 ring-purple-500/20 flex items-center justify-center"
                  >
                    <div className="absolute -inset-1 rounded-full bg-purple-500/15 blur-sm -z-10" />
                  </div>
                </div>
              )}

              {/* Expanded Mode Gliding Frosted Glass Capsule */}
              {!isCollapsed && (
                <div
                  className="absolute top-0 left-2 right-2 pointer-events-none z-0"
                  style={{
                    transform: `translateY(${indicator.top}px)`,
                    height: `${indicator.height}px`,
                    opacity: indicator.opacity,
                    transition:
                      'transform 280ms cubic-bezier(0.16, 1, 0.3, 1), height 240ms ease, opacity 180ms ease',
                  }}
                >
                  <div className="w-full h-full rounded-2xl bg-white/90 backdrop-blur-xl border border-purple-200/60 shadow-[0_4px_20px_rgba(124,58,237,0.12),0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-purple-500/15" />
                </div>
              )}

              {/* MENU UTAMA */}
              {filteredMain.length > 0 && (
                <div className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase select-none">
                      MENU UTAMA
                    </div>
                  )}
                  {isCollapsed && (
                    <div className="border-t border-neutral-100 my-1 mx-2" />
                  )}
                  <div className="space-y-0.5">
                    {filteredMain.map((item, index) => {
                      const isActive = activeTab === item.id;
                      const isHovered = hoveredId === item.id;
                      const Icon = item.icon;
                      const globalIndex = index;

                      if (isCollapsed) {
                        const scale = getCollapsedScale(globalIndex);
                        const zIndex = getCollapsedZIndex(globalIndex);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            ref={(el) => {
                              collapsedItemRefs.current[item.id] = el;
                            }}
                            onClick={() => handleSelectTab(item.id)}
                            onMouseEnter={(e) => {
                              setHoveredCollapsedIndex(globalIndex);
                              showTooltip(item.label, isActive, e);
                            }}
                            onMouseLeave={hideTooltip}
                            style={{
                              transform: `scale(${scale})`,
                              zIndex,
                              transition:
                                'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), background-color 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
                            }}
                            className={`relative flex items-center justify-center w-10 h-10 mx-auto rounded-full cursor-pointer origin-center active:scale-90 transition-transform duration-150 ${getCollapsedBubbleClass(
                              globalIndex,
                              isActive
                            )}`}
                          >
                            <Icon
                              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                                isActive ? 'text-purple-600 scale-105' : ''
                              }`}
                            />
                          </button>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          type="button"
                          ref={(el) => {
                            itemRefs.current[item.id] = el;
                          }}
                          onClick={() => handleSelectTab(item.id)}
                          onMouseEnter={() => {
                            setHoveredId(item.id);
                            updateIndicator(item.id);
                          }}
                          className={`relative z-10 w-full h-9 flex items-center justify-between px-3 rounded-2xl transition-all duration-150 text-xs font-medium group cursor-pointer active:scale-[0.98] ${
                            isActive
                              ? 'text-purple-700 font-semibold'
                              : isHovered
                              ? 'text-neutral-900 font-semibold'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`h-4 w-4 shrink-0 transition-all duration-200 ${
                                isActive
                                  ? 'text-purple-600 scale-105'
                                  : isHovered
                                  ? 'text-purple-600 scale-110'
                                  : 'text-neutral-500 group-hover:text-neutral-800'
                              }`}
                            />
                            <span className="truncate leading-none">{item.label}</span>
                          </div>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 shadow-xs ring-2 ring-purple-200/70 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* KONSENSUS & SISTEM */}
              {filteredConsensus.length > 0 && (
                <div className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase select-none">
                      KONSENSUS & SISTEM
                    </div>
                  )}
                  {isCollapsed && (
                    <div className="border-t border-neutral-100 my-1 mx-2" />
                  )}
                  <div className="space-y-0.5">
                    {filteredConsensus.map((item, index) => {
                      const isActive = activeTab === item.id;
                      const isHovered = hoveredId === item.id;
                      const Icon = item.icon;
                      const globalIndex = filteredMain.length + index;

                      if (isCollapsed) {
                        const scale = getCollapsedScale(globalIndex);
                        const zIndex = getCollapsedZIndex(globalIndex);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            ref={(el) => {
                              collapsedItemRefs.current[item.id] = el;
                            }}
                            onClick={() => handleSelectTab(item.id)}
                            onMouseEnter={(e) => {
                              setHoveredCollapsedIndex(globalIndex);
                              showTooltip(item.label, isActive, e);
                            }}
                            onMouseLeave={hideTooltip}
                            style={{
                              transform: `scale(${scale})`,
                              zIndex,
                              transition:
                                'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), background-color 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
                            }}
                            className={`relative flex items-center justify-center w-10 h-10 mx-auto rounded-full cursor-pointer origin-center active:scale-90 transition-transform duration-150 ${getCollapsedBubbleClass(
                              globalIndex,
                              isActive
                            )}`}
                          >
                            <Icon
                              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                                isActive ? 'text-purple-600' : ''
                              }`}
                            />
                          </button>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          type="button"
                          ref={(el) => {
                            itemRefs.current[item.id] = el;
                          }}
                          onClick={() => handleSelectTab(item.id)}
                          onMouseEnter={() => {
                            setHoveredId(item.id);
                            updateIndicator(item.id);
                          }}
                          className={`relative z-10 w-full h-9 flex items-center justify-between px-3 rounded-2xl transition-all duration-150 text-xs font-medium group cursor-pointer active:scale-[0.98] ${
                            isActive
                              ? 'text-purple-700 font-semibold'
                              : isHovered
                              ? 'text-neutral-900 font-semibold'
                              : 'text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`h-4 w-4 shrink-0 transition-all duration-200 ${
                                isActive
                                  ? 'text-purple-600 scale-105'
                                  : isHovered
                                  ? 'text-purple-600 scale-110'
                                  : 'text-neutral-500 group-hover:text-neutral-800'
                              }`}
                            />
                            <span className="truncate leading-none">{item.label}</span>
                          </div>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 shadow-xs ring-2 ring-purple-200/70 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasNoResults && (
                <div className="px-3 py-6 text-center text-xs text-neutral-400">
                  <p className="font-medium text-neutral-600 mb-1">Tidak ada menu</p>
                  <p className="text-[11px]">Hasil untuk &quot;{sidebarSearch}&quot; kosong</p>
                  <button
                    type="button"
                    onClick={() => setSidebarSearch('')}
                    className="mt-2 text-[11px] text-purple-600 hover:underline font-semibold cursor-pointer"
                  >
                    Reset Pencarian
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: Database Status Pill + User Profile Card */}
          <div className="shrink-0 border-t border-neutral-100/80 bg-neutral-50/50 backdrop-blur-sm">
            {!isCollapsed && (
              <div className="px-3.5 pt-2 pb-1 flex items-center justify-between text-[10px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-medium text-neutral-600">Database Neon</span>
                </span>
                <span className="text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded-full text-[9px] border border-emerald-200/60 shadow-2xs">
                  Online
                </span>
              </div>
            )}

            {!isCollapsed ? (
              <div className="p-2.5 m-2 rounded-2xl bg-white/90 hover:bg-white border border-neutral-200/70 hover:border-neutral-300 hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-2 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:scale-105 transition-transform duration-200">
                      {currentUser.isHighestRole ? (
                        <Crown className="w-3.5 h-3.5 text-amber-200" />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-800 truncate leading-tight group-hover:text-purple-700 transition-colors">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate leading-tight mt-0.5">
                      {currentUser.roleLabel}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Keluar Akun"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                className="py-3 flex flex-col items-center group relative cursor-pointer"
                onMouseEnter={() => {
                  if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
                  setIsProfileHovered(true);
                }}
                onMouseLeave={() => {
                  profileTimeoutRef.current = setTimeout(() => {
                    setIsProfileHovered(false);
                  }, 250);
                }}
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:scale-110 group-hover:shadow-md transition-all duration-200">
                    {currentUser.isHighestRole ? (
                      <Crown className="w-3.5 h-3.5 text-amber-200" />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute -bottom-0.5 -right-0.5" />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Floating Glass Speech Bubble Tooltip for Minimized Mode */}
      {isCollapsed && collapsedTooltip && (
        <div
          className="fixed z-[9999] pointer-events-none transition-all duration-150 ease-out print:hidden"
          style={{
            top: `${collapsedTooltip.top}px`,
            left: `${collapsedTooltip.left}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="relative px-3.5 py-1.5 bg-white/95 backdrop-blur-xl text-neutral-900 text-xs font-semibold rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-neutral-200/90 flex items-center gap-2 select-none whitespace-nowrap">
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white/95 border-l border-b border-neutral-200/90 rotate-45 rounded-2xs" />
            <span className="relative z-10">{collapsedTooltip.label}</span>
            {collapsedTooltip.isActive && (
              <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 shadow-xs ring-2 ring-purple-200" />
            )}
          </div>
        </div>
      )}

      {/* Floating Profile Popover for Minimized Mode */}
      {isCollapsed && isProfileHovered && (
        <div
          onMouseEnter={() => {
            if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
            setIsProfileHovered(true);
          }}
          onMouseLeave={() => {
            profileTimeoutRef.current = setTimeout(() => {
              setIsProfileHovered(false);
            }, 250);
          }}
          className="fixed left-[88px] bottom-3 z-[9999] p-3 bg-white/95 backdrop-blur-xl text-neutral-900 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.15)] border border-neutral-200/90 whitespace-nowrap flex flex-col gap-1.5 min-w-[170px] print:hidden"
        >
          <div className="absolute -left-1.5 bottom-6 w-3 h-3 bg-white/95 border-l border-b border-neutral-200/90 rotate-45" />
          <div className="relative z-10 text-xs font-semibold text-neutral-900">
            {currentUser.name}
          </div>
          <div className="relative z-10 text-[10px] text-neutral-500 truncate">
            {currentUser.roleLabel}
          </div>
          <div className="border-t border-neutral-100 my-1" />
          <button
            type="button"
            onClick={logout}
            className="relative z-10 w-full flex items-center gap-2 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 md:h-screen md:overflow-hidden bg-[#fbfbfc] flex flex-col">
        {/* Global Topbar across all pages */}
        <header className="hidden md:flex h-11 border-b border-neutral-200 bg-white px-5 items-center justify-between shrink-0 select-none print:hidden">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-neutral-900">
              GDSS Ormawa (Borda)
            </span>
            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[10px] font-medium border border-neutral-200/60">
              Ruang Keputusan
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => refreshData()}
              disabled={isLoadingData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-[11px] font-medium text-neutral-600 transition-colors cursor-pointer disabled:opacity-50"
              title="Sinkronkan ulang dari Neon PostgreSQL"
            >
              <RotateCw
                className={`w-3 h-3 ${isLoadingData ? 'animate-spin text-purple-600' : ''}`}
              />
              <span>Sinkronkan</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('consensus')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${
                consensusResult
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : completedCount === 3
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  consensusResult
                    ? 'bg-emerald-500'
                    : completedCount === 3
                    ? 'bg-purple-600 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <span>
                {consensusResult
                  ? 'Konsensus Disahkan'
                  : `Suara: ${completedCount}/3`}
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-[11px] text-neutral-700 pl-2 border-l border-neutral-200">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-medium">{currentUser.name}</span>
              <span className="text-neutral-400">({currentUser.role})</span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 min-h-0 overflow-y-auto w-full flex flex-col bg-white custom-scrollbar">
          <div key={activeTab} className="flex-1 flex flex-col animate-page-enter">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
