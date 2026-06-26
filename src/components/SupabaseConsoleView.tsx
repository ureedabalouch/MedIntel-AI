import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  Lock,
  Terminal,
  Activity,
  UserCheck,
  Eye,
  RefreshCw,
  HelpCircle,
  Code,
  Shield,
  Trash2,
  Settings,
  Sliders,
  AlertTriangle,
  Play
} from 'lucide-react';
import { supabaseSim } from '../lib/supabaseSim';

export default function SupabaseConsoleView() {
  const [activeTab, setActiveTab] = useState<'schema' | 'rls' | 'tables' | 'sandbox'>('tables');
  const [selectedTable, setSelectedTable] = useState<'profiles' | 'organizations' | 'memberships' | 'documents'>('profiles');
  const [logs, setLogs] = useState<any[]>([]);
  const [dbState, setDbState] = useState<any>(supabaseSim.getRawState());
  const [queryTargetTable, setQueryTargetTable] = useState<'organizations' | 'documents' | 'memberships'>('documents');
  const [sandboxResult, setSandboxResult] = useState<any[] | null>(null);
  const [sandboxExecuting, setSandboxExecuting] = useState(false);
  const [sandboxQueryLog, setSandboxQueryLog] = useState('');

  // Refresh logs and tables on load/action
  const handleRefresh = () => {
    setDbState({ ...supabaseSim.getRawState() });
    setLogs([...supabaseSim.getLogs()]);
  };

  useEffect(() => {
    handleRefresh();
    // Periodically update logs
    const interval = setInterval(() => {
      setLogs([...supabaseSim.getLogs()]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = () => {
    supabaseSim.clearLogs();
    setLogs([...supabaseSim.getLogs()]);
  };

  const handleRunSandboxQuery = () => {
    setSandboxExecuting(true);
    setSandboxResult(null);

    // Build the query log explanation
    const activeOrg = dbState.session?.activeOrg;
    const userId = dbState.session?.user?.id;
    let explanation = ``;

    if (!userId) {
      explanation = `[BLOCKED] RLS Query Denied. No active auth session headers found.`;
      setSandboxQueryLog(explanation);
      setSandboxExecuting(false);
      return;
    }

    if (queryTargetTable === 'documents') {
      explanation = `EXECUTE QUERY:\nSELECT * FROM medical_documents \nWHERE organization_id = '${activeOrg?.id || 'null'}';\n\n-- RLS Policy triggered: "Users can read medical_documents belonging to their active organization context"\n-- JWT Active Claims: { "user_id": "${userId}", "org_id": "${activeOrg?.id || 'null'}" }`;
    } else if (queryTargetTable === 'organizations') {
      explanation = `EXECUTE QUERY:\nSELECT * FROM organizations \nWHERE id IN (\n  SELECT organization_id FROM memberships \n  WHERE user_id = '${userId}'\n);\n\n-- RLS Policy triggered: "Users can read organizations that they are members of"`;
    } else if (queryTargetTable === 'memberships') {
      explanation = `EXECUTE QUERY:\nSELECT * FROM memberships \nWHERE organization_id IN (\n  SELECT organization_id FROM memberships \n  WHERE user_id = '${userId}'\n);\n\n-- RLS Policy triggered: "Users can view memberships of their own organizations"`;
    }

    setSandboxQueryLog(explanation);

    setTimeout(() => {
      try {
        const result = supabaseSim.executeRLSQuery(queryTargetTable);
        setSandboxResult(result);
        setSandboxExecuting(false);
        handleRefresh(); // update logs
      } catch (err: any) {
        setSandboxResult([]);
        setSandboxExecuting(false);
        handleRefresh();
      }
    }, 8000000 / 10000000); // quick feel
  };

  const ddlSchemas = {
    profiles: `CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('Administrator', 'Doctor', 'Researcher', 'Medical Student', 'Nurse', 'Hospital Staff')),
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_profiles_role ON public.profiles(role);`,
    organizations: `CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('Hospital', 'Clinic', 'University', 'Research Institute', 'Other')),
  country text NOT NULL,
  timezone text NOT NULL,
  is_personal boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  join_code text UNIQUE NOT NULL
);

-- Unique index to prevent duplicate case-insensitive slugs
CREATE UNIQUE INDEX idx_organizations_slug_lower ON public.organizations (lower(slug));`,
    memberships: `CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('Owner', 'Admin', 'Member', 'Viewer')),
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, organization_id)
);

-- Indexes for lightning fast multi-tenant joining checks
CREATE INDEX idx_memberships_user_org ON public.memberships (user_id, organization_id);`
  };

  const rlsPolicies = `------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) ISOLATION SCRIPTS
------------------------------------------------------------

-- Enable Row Level Security on all tenant-isolated tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------
-- 1. Profiles Table Policies
------------------------------------------------------------

-- Users can read and update their own profile details
CREATE POLICY "Allow users to read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to edit own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

------------------------------------------------------------
-- 2. Organizations Table Policies
------------------------------------------------------------

-- Users can read organizations they are members of
CREATE POLICY "Allow members to view organization" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

-- Only users with Owner or Admin membership roles can update organization configs
CREATE POLICY "Allow owners and admins to update organization" ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND role IN ('Owner', 'Admin')
    )
  );

------------------------------------------------------------
-- 3. Memberships Table Policies
------------------------------------------------------------

-- Users can read membership details of organizations they are in
CREATE POLICY "Allow members to view org memberships" ON public.memberships
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

-- Only Owners can invite/manage other admins or members
CREATE POLICY "Allow owners to write memberships" ON public.memberships
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND role = 'Owner'
    )
  );

------------------------------------------------------------
-- 4. Clinical Document Table Policies (Multi-Tenancy Guard)
------------------------------------------------------------

-- Users can select/insert documents strictly within their active organization
CREATE POLICY "Allow isolated access to documents" ON public.medical_documents
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow isolated insert to documents" ON public.medical_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );`;

  return (
    <div className="flex flex-col gap-8 relative z-10" id="supabase-console-root">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>INTEGRATION BRIDGE</span>
          <span>/</span>
          <span className="text-[#00E5FF]">SUPABASE DEVELOPER CONSOLE</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white">
          Supabase Identity & DB Schema Inspector
        </h1>
        <p className="text-[#94A3B8] text-sm">
          Audit and test your active clinical session profiles, local PostgreSQL structures, and HIPAA-isolated Row Level Security (RLS) policies.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Config / Code / Testing Panels */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Navigation Bar */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/5 gap-1 self-start">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider transition-all uppercase cursor-pointer ${
                activeTab === 'tables' ? 'bg-[#00E5FF]/10 text-[#00E5FF] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Tables
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider transition-all uppercase cursor-pointer ${
                activeTab === 'sandbox' ? 'bg-[#00E5FF]/10 text-[#00E5FF] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              RLS Policy Sandbox
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider transition-all uppercase cursor-pointer ${
                activeTab === 'schema' ? 'bg-[#00E5FF]/10 text-[#00E5FF] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Postgres DDL Schemas
            </button>
            <button
              onClick={() => setActiveTab('rls')}
              className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider transition-all uppercase cursor-pointer ${
                activeTab === 'rls' ? 'bg-[#00E5FF]/10 text-[#00E5FF] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              RLS Policy Script
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* TAB: LIVE TABLES */}
            {activeTab === 'tables' && (
              <motion.div
                key="tables-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Database size={18} className="text-[#00E5FF]" />
                    <h3 className="font-display font-bold text-base text-white">Live PostgreSQL Table Viewer</h3>
                  </div>

                  {/* Selector */}
                  <div className="flex gap-1.5 flex-wrap">
                    {(['profiles', 'organizations', 'memberships', 'documents'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setSelectedTable(tab)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest border transition-all cursor-pointer ${
                          selectedTable === tab
                            ? 'bg-[#14F195]/10 border-[#14F195]/30 text-[#14F195]'
                            : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Interactive view of actual records stored inside our simulator's local client database. Changes reflect instantly as you manage roles or organizations.
                </p>

                {/* Table Sheet Renderer */}
                <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/60 no-scrollbar">
                  
                  {selectedTable === 'profiles' && (
                    <table className="w-full text-left text-[11px] font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-[10px]">
                          <th className="p-3">ID (UUID)</th>
                          <th className="p-3">FULL_NAME</th>
                          <th className="p-3">EMAIL</th>
                          <th className="p-3">ROLE</th>
                          <th className="p-3 text-right">CREATED_AT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {dbState.profiles.map((p: any) => {
                          const isCurrentUser = dbState.session?.user?.id === p.id;
                          return (
                            <tr key={p.id} className={`hover:bg-white/5 ${isCurrentUser ? 'bg-[#00E5FF]/5' : ''}`}>
                              <td className="p-3 truncate max-w-[100px] text-slate-500" title={p.id}>{p.id}</td>
                              <td className="p-3 font-semibold text-white flex items-center gap-1.5">
                                {p.full_name}
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] text-[8px] font-bold">CURRENT</span>
                                )}
                              </td>
                              <td className="p-3">{p.email}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-[9px] text-slate-400">{p.role}</span>
                              </td>
                              <td className="p-3 text-right text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {selectedTable === 'organizations' && (
                    <table className="w-full text-left text-[11px] font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-[10px]">
                          <th className="p-3">ID (UUID)</th>
                          <th className="p-3">ORG_NAME</th>
                          <th className="p-3">SLUG</th>
                          <th className="p-3">TYPE</th>
                          <th className="p-3">TIMEZONE</th>
                          <th className="p-3">JOIN_CODE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {dbState.organizations.map((org: any) => {
                          const isActiveOrg = dbState.session?.activeOrg?.id === org.id;
                          return (
                            <tr key={org.id} className={`hover:bg-white/5 ${isActiveOrg ? 'bg-[#14F195]/5' : ''}`}>
                              <td className="p-3 truncate max-w-[90px] text-slate-500" title={org.id}>{org.id}</td>
                              <td className="p-3 font-semibold text-white flex items-center gap-1.5">
                                {org.name}
                                {isActiveOrg && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#14F195]/10 text-[#14F195] text-[8px] font-bold">ACTIVE</span>
                                )}
                              </td>
                              <td className="p-3 text-[#00E5FF]">/{org.slug}</td>
                              <td className="p-3 text-slate-400">{org.type}</td>
                              <td className="p-3 text-slate-400">{org.timezone}</td>
                              <td className="p-3 font-bold text-slate-200">{org.join_code}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {selectedTable === 'memberships' && (
                    <table className="w-full text-left text-[11px] font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-[10px]">
                          <th className="p-3">ID (UUID)</th>
                          <th className="p-3">USER_ID</th>
                          <th className="p-3">ORGANIZATION_ID</th>
                          <th className="p-3">MEMBERSHIP_ROLE</th>
                          <th className="p-3 text-right">JOINED_AT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {dbState.memberships.map((m: any) => {
                          const isCurrentUserMemb = dbState.session?.user?.id === m.user_id;
                          return (
                            <tr key={m.id} className={`hover:bg-white/5 ${isCurrentUserMemb ? 'bg-[#00E5FF]/5' : ''}`}>
                              <td className="p-3 truncate max-w-[80px] text-slate-500" title={m.id}>{m.id}</td>
                              <td className="p-3 truncate max-w-[120px] text-slate-300" title={m.user_id}>{m.user_id}</td>
                              <td className="p-3 truncate max-w-[120px] text-slate-300" title={m.organization_id}>{m.organization_id}</td>
                              <td className="p-3 font-bold text-white">
                                <span className={`px-2 py-0.5 rounded text-[9px] ${
                                  m.role === 'Owner' || m.role === 'Admin'
                                    ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                                    : 'bg-white/5 text-slate-400'
                                }`}>
                                  {m.role}
                                </span>
                              </td>
                              <td className="p-3 text-right text-slate-500">{new Date(m.joined_at).toLocaleDateString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {selectedTable === 'documents' && (
                    <table className="w-full text-left text-[11px] font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-[10px]">
                          <th className="p-3">ID (UUID)</th>
                          <th className="p-3">DOCUMENT_TITLE</th>
                          <th className="p-3">TYPE</th>
                          <th className="p-3">ORG_OWNER_ID</th>
                          <th className="p-3 text-right">CONFIDENTIALITY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {/* We display all documents from our pre-seeded list to highlight multi-tenancy */}
                        {[
                          { id: 'doc-1', title: 'Atherosclerosis MRI Contrast Scan', type: 'MRI', organization_id: 'org-mayo-cardiology', confidentiality: 'Standard' },
                          { id: 'doc-2', title: 'Heart Wall Stress Echocardiogram Series', type: 'Clinical Notes', organization_id: 'org-mayo-cardiology', confidentiality: 'Restricted' },
                          { id: 'doc-3', title: 'CYP2D6 Genomic Sequenced FastQ Files', type: 'Genomic Data', organization_id: 'org-stanford-genomics', confidentiality: 'Restricted' },
                          { id: 'doc-4', title: 'Oncology BRCA1 Pathway Map Vectors', type: 'Genomic Data', organization_id: 'org-stanford-genomics', confidentiality: 'Standard' }
                        ].map((doc: any) => {
                          const isAccessibleByActiveOrg = dbState.session?.activeOrg?.id === doc.organization_id;
                          return (
                            <tr key={doc.id} className={`hover:bg-white/5 ${isAccessibleByActiveOrg ? 'bg-[#14F195]/5' : 'opacity-40'}`}>
                              <td className="p-3 text-slate-500">{doc.id}</td>
                              <td className="p-3 font-semibold text-white">{doc.title}</td>
                              <td className="p-3">
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-white/5">{doc.type}</span>
                              </td>
                              <td className="p-3 truncate max-w-[120px] text-slate-400" title={doc.organization_id}>{doc.organization_id}</td>
                              <td className="p-3 text-right">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  doc.confidentiality === 'Restricted' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-900 text-slate-400'
                                }`}>
                                  {doc.confidentiality}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                </div>

                {/* Footnote */}
                <div className="flex gap-2 items-center text-[10px] text-slate-500 font-mono mt-2 bg-slate-950/40 p-3 rounded-lg border border-white/5">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                  <span>
                    <strong>Isolation Key:</strong> Rows dimmed in the documents table are fully shielded from Dr. Sarah Lin if her active organization context does not match. This visual proof demonstrates strict database tenancy boundaries.
                  </span>
                </div>

              </motion.div>
            )}

            {/* TAB: RLS SANDBOX */}
            {activeTab === 'sandbox' && (
              <motion.div
                key="sandbox-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-5"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sliders size={18} className="text-[#00E5FF]" />
                    <h3 className="font-display font-bold text-base text-white">Row Level Security Policy Sandbox</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20 font-mono text-[9px] font-bold tracking-wider">
                    RLS ENFORCER: ACTIVE
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Select a table and run query executions under your current authentication context. See how PostgreSQL automatically intercepts your requests to filter rows based on tenant isolation policies.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Query Configurations */}
                  <div className="md:col-span-1 p-4 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col gap-4">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Query Setup</span>
                    
                    <div className="flex flex-col gap-1.5 text-xs">
                      <label className="text-[10px] font-mono text-slate-500">Target SQL Table</label>
                      <select
                        value={queryTargetTable}
                        onChange={(e) => setQueryTargetTable(e.target.value as any)}
                        className="px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#00E5FF]"
                      >
                        <option value="documents">medical_documents</option>
                        <option value="organizations">organizations</option>
                        <option value="memberships">memberships</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2.5 text-xs font-mono p-3 rounded bg-slate-900/60 border border-white/5 text-slate-400">
                      <div className="flex justify-between">
                        <span>AUTH.UID():</span>
                        <span className="text-white truncate max-w-[80px]" title={dbState.session?.user?.id}>{dbState.session?.user?.id || 'null'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ACTIVE_ORG:</span>
                        <span className="text-[#00E5FF] truncate max-w-[80px]" title={dbState.session?.activeOrg?.name}>{dbState.session?.activeOrg?.slug || 'NONE'}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleRunSandboxQuery}
                      disabled={sandboxExecuting}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {sandboxExecuting ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Evaluating Policies...
                        </>
                      ) : (
                        <>
                          Run RLS Query
                          <Play size={12} />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Executed Code Terminal output */}
                  <div className="md:col-span-2 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>INTERCEPTED POSTGRESQL ENGINE CONSOLE</span>
                      <span>UTF-8 ENCODED</span>
                    </div>

                    <div className="flex-1 p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-white/5 min-h-[140px] flex flex-col gap-3 relative">
                      
                      {sandboxQueryLog ? (
                        <div className="whitespace-pre text-slate-400 text-[11px] leading-relaxed select-text">
                          {sandboxQueryLog}
                        </div>
                      ) : (
                        <span className="text-slate-600 italic my-auto text-center">Awaiting execution...</span>
                      )}

                      {sandboxResult && (
                        <div className="mt-2 border-t border-white/5 pt-3 flex flex-col gap-2">
                          <span className="text-emerald-400 font-bold text-[10px]">[SUCCESS] QUERY COMPLETED. RETRIEVED {sandboxResult.length} ROW(S):</span>
                          <pre className="p-3 rounded bg-slate-900 border border-white/5 text-[10px] text-[#14F195] select-text overflow-x-auto max-h-[120px] no-scrollbar">
                            {JSON.stringify(sandboxResult, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB: POSTGRES DDL SCHEMAS */}
            {activeTab === 'schema' && (
              <motion.div
                key="schema-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4"
              >
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-[#00E5FF]" />
                  <h3 className="font-display font-bold text-base text-white">PostgreSQL Schema Definition (DDL)</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Execute these SQL commands inside your Supabase SQL editor to bootstrap identical structure boundaries on a live production cluster.
                </p>

                {/* Collapsible select schema */}
                <div className="flex gap-2">
                  {(['profiles', 'organizations', 'memberships'] as const).map(schemaKey => (
                    <button
                      key={schemaKey}
                      onClick={() => setSelectedTable(schemaKey as any)}
                      className={`px-3 py-1 text-xs font-mono rounded border transition-all ${
                        selectedTable === schemaKey
                          ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30'
                          : 'bg-slate-900/40 border-white/5 text-slate-400'
                      }`}
                    >
                      {schemaKey}.sql
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-950/80 border border-white/5 font-mono text-xs text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto select-all no-scrollbar">
                    {ddlSchemas[selectedTable as keyof typeof ddlSchemas]}
                  </pre>
                </div>
              </motion.div>
            )}

            {/* TAB: RLS SECURITY POLICY */}
            {activeTab === 'rls' && (
              <motion.div
                key="rls-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4"
              >
                <div className="flex items-center gap-2">
                  <Lock size={18} className="text-[#14F195]" />
                  <h3 className="font-display font-bold text-base text-white">Row Level Security Policies</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Supabase isolates organization boundaries at the database level rather than application level. This eliminates multi-tenant data bleed bugs completely.
                </p>

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-950/80 border border-white/5 font-mono text-xs text-[#14F195] leading-relaxed max-h-[300px] overflow-y-auto select-all no-scrollbar">
                    {rlsPolicies}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Column: DB Logs / Audit logs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#7C3AED]" />
                <h3 className="font-display font-bold text-sm">Postgres Transaction Logs</h3>
              </div>
              <button
                onClick={handleClearLogs}
                className="p-1 rounded bg-slate-900 border border-white/10 text-slate-500 hover:text-red-400 hover:border-red-400/20 transition-all cursor-pointer"
                title="Clear Logs"
              >
                <Trash2 size={12} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Transaction execution logs reflecting actual security handshakes and query events.
            </p>

            <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1 no-scrollbar select-text">
              {logs.map((log, index) => {
                const isRls = log.type === 'RLS';
                const isError = log.type === 'ERROR';
                const isSuccess = log.type === 'SUCCESS';
                return (
                  <div key={index} className="p-3 rounded-lg bg-slate-950 border border-white/5 text-[10px] font-mono flex flex-col gap-1.5 leading-normal">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">[{log.timestamp}]</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        isRls
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : isError
                          ? 'bg-red-400/15 text-red-400'
                          : isSuccess
                          ? 'bg-emerald-400/15 text-[#14F195]'
                          : 'bg-white/5 text-slate-400'
                      }`}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-mono">{log.details}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
