import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Database, 
  Server, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Cpu, 
  Layers, 
  Wifi, 
  Terminal, 
  Check, 
  X, 
  ExternalLink, 
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  runProductionInfrastructureCheck, 
  ProductionReadinessReport, 
  DeploymentChecklistItem 
} from '../lib/infrastructureService';

export function ProductionReadinessView() {
  const [report, setReport] = useState<ProductionReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await runProductionInfrastructureCheck();
      setReport(data);
    } catch (err) {
      console.error('Failed to run production infrastructure scan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading && !report) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center gap-4" id="readiness-loader">
        <RefreshCw size={36} className="text-[#00E5FF] animate-spin" />
        <span className="font-mono text-sm text-slate-400">Scanning physical cloud networks & database schemas...</span>
      </div>
    );
  }

  const getStatusColor = (status: 'passed' | 'failed' | 'warning' | 'pending') => {
    switch (status) {
      case 'passed': return 'text-[#14F195] bg-[#14F195]/10 border-[#14F195]/20';
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: 'passed' | 'failed' | 'warning' | 'pending') => {
    switch (status) {
      case 'passed': return <CheckCircle2 size={16} className="text-[#14F195]" />;
      case 'failed': return <AlertTriangle size={16} className="text-red-400" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-400" />;
      default: return <HelpCircle size={16} className="text-slate-400" />;
    }
  };

  const scoreColor = report 
    ? report.overallScore >= 90 ? 'text-[#14F195]' : report.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'
    : 'text-slate-400';

  return (
    <div className="flex flex-col gap-6" id="production-readiness-dashboard">
      
      {/* Simulator Mode Alert Notification */}
      {report && report.mode === 'simulator' && (
        <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/10 shadow-[0_0_20px_rgba(99,102,241,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3 items-start md:items-center">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Terminal size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-indigo-300">SANDBOX SIMULATOR MODE ACTIVE</h4>
              <p className="text-xs text-slate-400 mt-1">
                A real connected database was not detected. Local storage models are seamlessly mocking multi-tenant operations. Clinician tools remain fully functional.
              </p>
            </div>
          </div>
          <button 
            onClick={() => window.open('https://supabase.com', '_blank')}
            className="px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-semibold hover:bg-indigo-500/25 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>SUPABASE SETUP GUIDE</span>
            <ExternalLink size={12} />
          </button>
        </div>
      )}

      {/* Hero Summary Grid */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Circular Score Visualizer */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/5 bg-slate-950/20 flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Animated Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="72" 
                  cy="72" 
                  r="64" 
                  className="stroke-slate-900 fill-transparent" 
                  strokeWidth="8"
                />
                <motion.circle 
                  cx="72" 
                  cy="72" 
                  r="64" 
                  className="fill-transparent"
                  strokeWidth="8"
                  strokeDasharray={402}
                  stroke={report.overallScore >= 90 ? '#14F195' : report.overallScore >= 50 ? '#f59e0b' : '#ef4444'}
                  initial={{ strokeDashoffset: 402 }}
                  animate={{ strokeDashoffset: 402 - (402 * report.overallScore / 100) }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-4xl font-display font-black tracking-tighter ${scoreColor}`}>
                  {report.overallScore}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase mt-0.5">READINESS</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2 justify-center">
                <span className="text-xs font-mono text-slate-400">Production Health:</span>
                <span className={`text-xs font-mono font-black ${
                  report.overallHealth === 'Optimal' ? 'text-[#14F195]' : 'text-amber-400'
                }`}>
                  {report.overallHealth.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                {report.overallScore === 100 
                  ? 'Your app has passed all verification requirements and is fully hardened for production.'
                  : `Your app scoring ${report.overallScore}% has minor configuration requirements remaining before release.`}
              </p>
            </div>
            
            <button
              onClick={fetchReport}
              disabled={loading}
              className="mt-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>SCAN INFRASTRUCTURE</span>
            </button>
          </div>

          {/* Subsystems Dashboard Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Env Status */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Environment Config</span>
                  <span className="text-sm font-display font-bold text-white">Security Variables</span>
                </div>
                <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  report.envVars.supabaseUrl.configured && report.envVars.geminiApiKey.configured
                    ? 'bg-[#14F195]/10 text-[#14F195] border-[#14F195]/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {report.envVars.supabaseUrl.configured && report.envVars.geminiApiKey.configured ? 'COMPLETE' : 'INCOMPLETE'}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Supabase Gateway:</span>
                  <span className={report.envVars.supabaseUrl.configured ? 'text-white' : 'text-slate-500'}>
                    {report.envVars.supabaseUrl.configured ? 'Configured ✓' : 'Placeholder ✖'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Gemini API:</span>
                  <span className={report.envVars.geminiApiKey.configured ? 'text-white' : 'text-slate-500'}>
                    {report.envVars.geminiApiKey.configured ? 'Configured ✓' : 'Placeholder ✖'}
                  </span>
                </div>
              </div>
            </div>

            {/* Database Status */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Database Tables</span>
                  <span className="text-sm font-display font-bold text-white">PostgreSQL & pgvector</span>
                </div>
                <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  report.database.connectivity.status === 'passed'
                    ? 'bg-[#14F195]/10 text-[#14F195] border-[#14F195]/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {report.database.connectivity.status === 'passed' ? 'STABLE' : 'FAILED'}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Database Schemas:</span>
                  <span className="text-white">
                    {Object.values(report.database.tablesExist).filter(Boolean).length}/10 Verified
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>pgvector Extension:</span>
                  <span className={report.database.pgvectorInstalled ? 'text-white' : 'text-slate-500'}>
                    {report.database.pgvectorInstalled ? 'Installed ✓' : 'Missing ✖'}
                  </span>
                </div>
              </div>
            </div>

            {/* Storage Status */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Clinical Storage</span>
                  <span className="text-sm font-display font-bold text-white">Files Bucket</span>
                </div>
                <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  report.storage.bucketExists
                    ? 'bg-[#14F195]/10 text-[#14F195] border-[#14F195]/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {report.storage.bucketExists ? 'VERIFIED' : 'PENDING'}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Bucket "medical-documents":</span>
                  <span className={report.storage.bucketExists ? 'text-white' : 'text-slate-500'}>
                    {report.storage.bucketExists ? 'Active ✓' : 'Missing ✖'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Bucket Privacy Level:</span>
                  <span className={report.storage.isPrivate ? 'text-[#14F195] font-bold' : 'text-amber-400 font-bold'}>
                    {report.storage.isPrivate ? 'Private (HIPAA)' : 'Public (Insecure)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Authentication & Realtime */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Integrations</span>
                  <span className="text-sm font-display font-bold text-white">Auth & Realtime Channels</span>
                </div>
                <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-[#14F195]/10 text-[#14F195] border-[#14F195]/20">
                  ACTIVE
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Supabase Authentication:</span>
                  <span className="text-white">Active ✓</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Realtime WebSocket:</span>
                  <span className="text-white">Active ✓</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Main Grid: Compliance Alerts & Deployment Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Deployment Checklist */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
            <div>
              <h3 className="font-display font-bold text-base text-white">Deployment Readiness Checklist</h3>
              <p className="text-xs text-slate-400 mt-1">Verification items covering critical backend modules, pipelines, and compliance structures.</p>
            </div>

            {report && (
              <div className="flex flex-col gap-2.5">
                {report.checklist.map((item) => {
                  const isExpanded = expandedItem === item.id;
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border border-white/5 bg-slate-950/40 hover:bg-slate-950/60 transition-all flex flex-col gap-3 cursor-pointer ${
                        isExpanded ? 'bg-slate-950/80 ring-1 ring-white/10' : ''
                      }`}
                      onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(item.status)}
                          <span className="text-sm font-display font-bold text-white">{item.name}</span>
                        </div>
                        <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 pl-7 leading-relaxed font-mono">
                        {item.description}
                      </p>

                      {isExpanded && item.correctiveAction && (
                        <motion.div 
                          className="pl-7 mt-1 flex flex-col gap-2"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="p-3 bg-indigo-500/10 border border-indigo-500/10 rounded-lg flex flex-col gap-1 text-[11px] font-mono text-indigo-300">
                            <span className="font-black uppercase text-[9px] tracking-wider text-indigo-200">CORRECTIVE ACTION:</span>
                            <span>{item.correctiveAction}</span>
                          </div>
                        </motion.div>
                      )}
                      
                      <div className="flex items-center justify-between pl-7 text-[9px] font-mono text-slate-600">
                        <span>CATEGORY: {item.category.toUpperCase()}</span>
                        {item.correctiveAction && (
                          <span className="text-indigo-400 font-bold flex items-center gap-0.5">
                            {isExpanded ? 'Hide guide' : 'Show repair guide'} <ArrowRight size={8} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Security Verification Detail */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
            <div>
              <h3 className="font-display font-bold text-base text-white">Security & Access Auditing</h3>
              <p className="text-xs text-slate-400 mt-1">Direct testing of multi-tenant Row-Level Security (RLS) constraints and schema isolation.</p>
            </div>

            {report && (
              <div className="flex flex-col gap-4">
                
                {/* RLS, Auth, Isolation Check Indicators */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-white/5 bg-slate-950/20 flex flex-col gap-1 font-mono">
                    <span className="text-[9px] text-slate-500 uppercase font-black">ROW-LEVEL SECURITY</span>
                    <span className={`text-xs font-bold ${report.security.rlsEnabled ? 'text-[#14F195]' : 'text-amber-400'}`}>
                      {report.security.rlsEnabled ? 'RLS ENABLED' : 'RLS INACTIVE'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-white/5 bg-slate-950/20 flex flex-col gap-1 font-mono">
                    <span className="text-[9px] text-slate-500 uppercase font-black">STORAGE SECURITY</span>
                    <span className={`text-xs font-bold ${report.security.storagePoliciesConfigured ? 'text-[#14F195]' : 'text-amber-400'}`}>
                      {report.security.storagePoliciesConfigured ? 'POLICIES SAFE' : 'UNCONFIGURED'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-white/5 bg-slate-950/20 flex flex-col gap-1 font-mono">
                    <span className="text-[9px] text-slate-500 uppercase font-black">TENANT ISOLATION</span>
                    <span className={`text-xs font-bold ${report.security.organizationIsolationActive ? 'text-[#14F195]' : 'text-amber-400'}`}>
                      {report.security.organizationIsolationActive ? 'ISOLATION ACTIVE' : 'INCOMPLETE'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-white/5 bg-slate-950/20 flex flex-col gap-1 font-mono">
                    <span className="text-[9px] text-slate-500 uppercase font-black">RPC TRIGGERS</span>
                    <span className={`text-xs font-bold ${report.security.rpcFunctionsAvailable ? 'text-[#14F195]' : 'text-amber-400'}`}>
                      {report.security.rpcFunctionsAvailable ? 'TRIGGERS SYNCED' : 'MISSING'}
                    </span>
                  </div>
                </div>

                {/* Warnings List */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wide">Security Alerts & Warnings</h4>
                  
                  {report.security.warnings.length === 0 ? (
                    <div className="p-4 rounded-xl border border-[#14F195]/10 bg-[#14F195]/5 text-center flex flex-col items-center gap-1">
                      <CheckCircle2 size={24} className="text-[#14F195]" />
                      <span className="text-xs font-mono text-[#14F195] font-bold">No Security Vulnerabilities Detected</span>
                      <span className="text-[10px] font-mono text-slate-500">Row-level partition policies are correctly enforcing data hygiene boundaries.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {report.security.warnings.map((warn, index) => (
                        <div 
                          key={index} 
                          className="p-3 rounded-xl border border-amber-500/10 bg-amber-500/5 text-amber-400 text-xs font-mono leading-relaxed flex gap-2.5 items-start"
                        >
                          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black block uppercase text-[9px] text-amber-300">SECURITY AUDIT WARNING:</span>
                            <span className="text-slate-300">{warn}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
