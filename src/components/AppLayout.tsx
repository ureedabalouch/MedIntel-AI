import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FolderOpen,
  Brain,
  Search,
  LineChart,
  Settings,
  LifeBuoy,
  LogOut,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  User,
  Activity,
  ChevronDown,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  Database
} from 'lucide-react';
import { ViewType } from '../types';
import Logo from './Logo';
import { supabaseSim } from '../lib/supabaseSim';
import { getSupabaseClient } from '../lib/supabase';

// Views
import DashboardView from './DashboardView';
import DocumentsView from './DocumentsView';
import AIAssistantView from './AIAssistantView';
import MedicalSearchView from './MedicalSearchView';
import AnalyticsView from './AnalyticsView';
import SettingsView from './SettingsView';
import SupportView from './SupportView';
import SupabaseConsoleView from './SupabaseConsoleView';

interface AppLayoutProps {
  onExitPlatform: () => void;
}

export default function AppLayout({ onExitPlatform }: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState<Exclude<ViewType, 'landing'>>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isDarkThemeLocked, setIsDarkThemeLocked] = useState(true);
  const [themeFeedback, setThemeFeedback] = useState(false);

  // Supabase states
  const [session, setSession] = useState(supabaseSim.getSession());
  const [userOrgs, setUserOrgs] = useState<any[]>([]);
  const [isOrgSelectorOpen, setIsOrgSelectorOpen] = useState(false);

  // References
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const orgDropdownRef = useRef<HTMLDivElement | null>(null);

  // Load user organizations
  const loadUserOrgs = async () => {
    const sess = supabaseSim.getSession();
    setSession(sess);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: { session: realSession } } = await supabase.auth.getSession();
        const userId = realSession?.user?.id || sess?.user?.id;
        if (userId) {
          // Query memberships for the user
          const { data: memberships, error: memError } = await supabase
            .from('memberships')
            .select('organization_id')
            .eq('user_id', userId);
          if (memError) throw memError;

          if (memberships && memberships.length > 0) {
            const orgIds = memberships.map((m: any) => m.organization_id);
            // Retrieve related organizations from public.organizations
            const { data: orgs, error: orgsError } = await supabase
              .from('organizations')
              .select('*')
              .in('id', orgIds);
            if (orgsError) throw orgsError;

            setUserOrgs(orgs || []);
          } else {
            setUserOrgs([]);
          }
        } else {
          setUserOrgs([]);
        }
      } catch (err) {
        console.error('Error fetching real organizations:', err);
        // Fallback to simulator if database queries fail
        if (sess?.user) {
          const raw = supabaseSim.getRawState();
          const myMemb = raw.memberships.filter((m: any) => m.user_id === sess.user?.id);
          const myOrgIds = myMemb.map((m: any) => m.organization_id);
          const myOrgs = raw.organizations.filter((o: any) => myOrgIds.includes(o.id));
          setUserOrgs(myOrgs);
        }
      }
    } else {
      if (sess?.user) {
        const raw = supabaseSim.getRawState();
        const myMemb = raw.memberships.filter((m: any) => m.user_id === sess.user?.id);
        const myOrgIds = myMemb.map((m: any) => m.organization_id);
        const myOrgs = raw.organizations.filter((o: any) => myOrgIds.includes(o.id));
        setUserOrgs(myOrgs);
      }
    }
  };

  useEffect(() => {
    loadUserOrgs();
  }, [activeTab]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
        setIsOrgSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents' as const, label: 'Knowledge Library', icon: FolderOpen },
    { id: 'assistant' as const, label: 'AI Assistant', icon: Brain },
    { id: 'search' as const, label: 'Medical Search', icon: Search },
    { id: 'analytics' as const, label: 'Analytics', icon: LineChart },
    { id: 'supabase' as const, label: 'Supabase Console', icon: Database },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'support' as const, label: 'Support', icon: LifeBuoy }
  ];

  const notifications = [
    {
      id: 'n1',
      title: 'New MRI Record Ingested',
      desc: 'Pelvis_MRI_Bilateral_Contrast_Review.dicom ready in vector search partition.',
      time: '15m ago',
      type: 'success'
    },
    {
      id: 'n2',
      title: 'Security Sync Notice',
      desc: 'Decentralized BAA cryptographic keys successfully auto-rotated.',
      time: '1h ago',
      type: 'info'
    },
    {
      id: 'n3',
      title: 'SLA Priority Threshold',
      desc: 'Mean RAG query latency dropped to 114ms (Optimum limits).',
      time: '2h ago',
      type: 'warning'
    }
  ];

  const handleThemeToggleClick = () => {
    setThemeFeedback(true);
    setTimeout(() => {
      setThemeFeedback(false);
    }, 4000);
  };

  const handleStatNavigation = (view: Exclude<ViewType, 'landing'>) => {
    setActiveTab(view);
  };

  return (
    <div className="min-h-screen z-10 flex select-none text-slate-100 font-sans relative overflow-x-hidden" id="app-platform-layout">
      
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 glass-panel h-screen sticky top-0 shrink-0 z-40 p-4 justify-between">
        <div className="flex flex-col gap-6">
          <div className="py-2 border-b border-white/5">
            <Logo size={32} />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5" id="desktop-sidebar-navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/20 shadow-md shadow-[#00E5FF]/5'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#00E5FF]' : 'text-slate-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer options */}
        <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
          <button
            onClick={() => {
              supabaseSim.signOut();
              onExitPlatform();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            Logout Session
          </button>
          <button
            onClick={onExitPlatform}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-semibold uppercase text-slate-500 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Website
          </button>
        </div>
      </aside>

      {/* 2. Main Content Context Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        
        {/* Top Header Navigation */}
        <header className="sticky top-0 z-30 glass-panel border-b border-white/5 px-6 py-3 flex items-center justify-between backdrop-blur-lg">
          
          {/* Left: Mobile menu toggle or mock search */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-950 transition-all"
            >
              <Menu size={18} />
            </button>

            {/* Simulated quick search drawer trigger */}
            <div className="relative hidden md:block max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search console (CMD+K)..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-950/40 border text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-[#00E5FF] transition-all font-mono ${
                  searchFocused ? 'border-[#00E5FF] w-64' : 'border-white/5'
                }`}
              />
            </div>

            {/* Connection Bridge Status & Org Selector */}
            <div className="hidden md:flex items-center gap-3 relative" ref={orgDropdownRef}>
              <span className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20 text-[10px] font-mono font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse"></span>
                EHR GATEWAY SECURE
              </span>

              {/* Active Workspace / Org Dropdown Selector */}
              <button
                onClick={() => setIsOrgSelectorOpen(!isOrgSelectorOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 hover:text-white cursor-pointer transition-all"
              >
                <Database size={12} className="text-[#00E5FF]" />
                <span className="font-bold uppercase tracking-wider">{session?.activeOrg?.name || 'Mayo Clinic Cardiology'}</span>
                <ChevronDown size={12} className="text-slate-500" />
              </button>

              <AnimatePresence>
                {isOrgSelectorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-64 glass-panel border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 text-xs font-mono"
                  >
                    <div className="p-3 bg-slate-950/80 border-b border-white/5 flex justify-between items-center">
                      <span className="font-bold text-slate-400">SWITCH WORKSPACE</span>
                      <span className="text-[9px] bg-[#00E5FF]/10 text-[#00E5FF] px-1.5 py-0.5 rounded font-bold">RLS FILTER</span>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      {userOrgs.map((o) => {
                        const isCurrent = session?.activeOrg?.id === o.id;
                        return (
                          <button
                            key={o.id}
                            onClick={() => {
                              supabaseSim.switchActiveOrg(o.id);
                              loadUserOrgs();
                              setIsOrgSelectorOpen(false);
                              // Trigger state update
                              const event = new CustomEvent('orgSwitched', { detail: o.id });
                              window.dispatchEvent(event);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all flex justify-between items-center ${
                              isCurrent ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'text-slate-300'
                            }`}
                          >
                            <span className="truncate pr-2">{o.name}</span>
                            {isCurrent && <span className="text-[8px] bg-[#00E5FF]/20 text-[#00E5FF] px-1.5 py-0.5 rounded font-bold">ACTIVE</span>}
                          </button>
                        );
                      })}
                      {userOrgs.length === 0 && (
                        <div className="p-3 text-slate-500 italic text-center text-[11px]">
                          No organizations joined yet.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Icons: notifications, theme, clinician profile menu */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle Placeholder */}
            <div className="relative">
              <button
                onClick={handleThemeToggleClick}
                className="p-2 rounded-lg bg-slate-900/80 border border-white/5 text-slate-400 hover:text-white transition-all hover:border-white/15 cursor-pointer"
                title="Theme Configuration"
              >
                {isDarkThemeLocked ? <Moon size={15} /> : <Sun size={15} />}
              </button>

              <AnimatePresence>
                {themeFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 p-3 rounded-lg bg-slate-950 border border-[#00E5FF]/20 font-mono text-[10px] text-slate-300 w-48 shadow-xl text-center"
                  >
                    💡 <strong className="text-[#00E5FF]">Enterprise Protocol:</strong> Dark theme is strictly locked to prevent eye strain during medical imaging audits.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dynamic Notification Popover */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-lg bg-slate-900/80 border border-white/5 text-slate-400 hover:text-white transition-all relative hover:border-white/15 cursor-pointer"
              >
                <Bell size={15} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400"></span>
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-72 md:w-80 glass-panel border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                  >
                    <div className="p-3 bg-slate-950/60 border-b border-white/5 flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-white uppercase">System Notifications</span>
                      <span className="text-[10px] text-[#00E5FF] uppercase font-bold">3 New Alerts</span>
                    </div>

                    <div className="divide-y divide-white/5">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-white/5 transition-colors text-xs flex gap-2">
                          <div className="pt-0.5 shrink-0">
                            <Activity size={12} className="text-[#00E5FF]" />
                          </div>
                          <div>
                            <span className="font-semibold text-white block leading-tight">{n.title}</span>
                            <span className="text-slate-400 text-[10px] mt-0.5 block leading-relaxed">{n.desc}</span>
                            <span className="text-[9px] text-slate-600 font-mono mt-1 block">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Clinician Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white hover:border-white/15 transition-all text-xs font-mono cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#00E5FF] to-[#7C3AED] flex items-center justify-center text-[10px] font-bold text-slate-950 font-sans uppercase">
                  {(() => {
                    const name = session?.profile?.full_name || 'Dr. Sarah Lin';
                    const cleanName = name.replace(/^(Dr\.|Dr|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+/i, '').trim();
                    const parts = cleanName.split(/\s+/);
                    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
                  })()}
                </div>
                <span className="hidden sm:inline font-semibold">{session?.profile?.full_name || 'Dr. Sarah Lin'}</span>
                <ChevronDown size={12} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 glass-panel border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 text-xs"
                  >
                    <div className="p-3 bg-slate-950/60 border-b border-white/5 font-mono">
                      <span className="font-bold text-white block">{session?.profile?.full_name || 'Dr. Sarah Lin'}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block truncate">{session?.user?.email}</span>
                    </div>

                    <div className="p-2 flex flex-col gap-1 text-slate-300">
                      <div className="px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer flex justify-between items-center">
                        <span>Active Role</span>
                        <span className="text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] font-mono px-2 py-0.5 rounded uppercase font-bold">
                          {session?.profile?.role || 'Doctor'}
                        </span>
                      </div>
                      <div className="px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer flex justify-between items-center">
                        <span>Sandbox Encryption</span>
                        <span className="text-[10px] bg-[#14F195]/10 text-[#14F195] font-mono px-2 py-0.5 rounded uppercase font-bold">AES-256</span>
                      </div>
                      <button
                        onClick={() => {
                          supabaseSim.signOut();
                          onExitPlatform();
                        }}
                        className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 mt-1 cursor-pointer font-bold"
                      >
                        <LogOut size={12} />
                        <span>Logout Session</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* 3. Main Dynamic Panel Area */}
        <main className="flex-1 p-6 md:p-8 relative overflow-y-auto no-scrollbar">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'dashboard' && <DashboardView onNavigateTo={handleStatNavigation} />}
              {activeTab === 'documents' && <DocumentsView />}
              {activeTab === 'assistant' && <AIAssistantView />}
              {activeTab === 'search' && <MedicalSearchView />}
              {activeTab === 'analytics' && <AnalyticsView />}
              {activeTab === 'supabase' && <SupabaseConsoleView />}
              {activeTab === 'settings' && <SettingsView />}
              {activeTab === 'support' && <SupportView />}
            </motion.div>
          </AnimatePresence>

        </main>
      </div>

      {/* 4. Responsive Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />

            {/* Sidebar drawer content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 bottom-0 left-0 w-64 border-r border-white/5 bg-[#07111F] z-50 p-4 flex flex-col justify-between lg:hidden"
            >
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <Logo size={28} />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-white/5 text-slate-400"
                  >
                    <X size={16} />
                  </button>
                </div>

                <nav className="flex flex-col gap-1.5" id="mobile-sidebar-navigation">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/20 shadow-md shadow-[#00E5FF]/5'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-[#00E5FF]' : 'text-slate-400'} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={onExitPlatform}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  Back to Website
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
