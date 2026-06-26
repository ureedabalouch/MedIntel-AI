import React from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Activity,
  Zap,
  TrendingUp,
  Clock,
  ShieldAlert,
  FolderOpen,
  ArrowUpRight,
  Database,
  Cpu,
  Search,
  CheckCircle,
  Plus
} from 'lucide-react';
import { DocumentItem, ActivityLog } from '../types';

interface DashboardViewProps {
  onNavigateTo: (view: 'dashboard' | 'documents' | 'assistant' | 'search' | 'analytics' | 'settings' | 'support') => void;
}

export default function DashboardView({ onNavigateTo }: DashboardViewProps) {
  const stats = [
    {
      title: 'Indexed Health Docs',
      value: '4,821',
      change: '+14% this month',
      isPositive: true,
      icon: FolderOpen,
      color: 'text-[#00E5FF]'
    },
    {
      title: 'Semantic Query Volume',
      value: '84,103',
      change: '+22.4% vs last week',
      isPositive: true,
      icon: Search,
      color: 'text-[#7C3AED]'
    },
    {
      title: 'Clinical Accuracy Rate',
      value: '99.99%',
      change: '100% Attributed Sources',
      isPositive: true,
      icon: Cpu,
      color: 'text-[#14F195]'
    },
    {
      title: 'RAG Latency (p99)',
      value: '114ms',
      change: '-12ms improvement',
      isPositive: true,
      icon: Clock,
      color: 'text-amber-400'
    }
  ];

  const recentDocs: DocumentItem[] = [
    {
      id: 'DOC-8832',
      title: 'Chest_CT_Scan_Contrast_Sarah_Lin_58F.dicom',
      type: 'CT Scan',
      patientId: 'PAT-0094',
      date: '2026-06-25 18:42',
      size: '142.4 MB',
      status: 'Ready',
      compliance: 'HIPAA compliant'
    },
    {
      id: 'DOC-8831',
      title: 'Serum_Creatinine_Hematology_Profile_John_Doe_62M.pdf',
      type: 'Lab Report',
      patientId: 'PAT-4821',
      date: '2026-06-25 15:10',
      size: '2.1 MB',
      status: 'Ready',
      compliance: 'HIPAA compliant'
    },
    {
      id: 'DOC-8830',
      title: 'Genetics_BRCA1_BRCA2_Sequence_Audit.csv',
      type: 'Genomic Data',
      patientId: 'PAT-9201',
      date: '2026-06-24 11:15',
      size: '48.9 MB',
      status: 'Indexing',
      compliance: 'HIPAA compliant'
    },
    {
      id: 'DOC-8829',
      title: 'Pelvis_MRI_Bilateral_Contrast_Review.dicom',
      type: 'MRI',
      patientId: 'PAT-3012',
      date: '2026-06-24 09:30',
      size: '210.6 MB',
      status: 'Ready',
      compliance: 'HIPAA compliant'
    }
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: 'LOG-1',
      timestamp: 'Just now',
      action: 'Clinician queried "Atrial Fibrillation contraindications for Warfarin GFR 26"',
      user: 'Dr. Sarah Lin, MD',
      category: 'RAG Query',
      status: 'Success'
    },
    {
      id: 'LOG-2',
      timestamp: '14m ago',
      action: 'Ingested Chest_CT_Scan_Contrast_Sarah_Lin_58F.dicom into clinical index',
      user: 'Automated Ingest Bridge',
      category: 'Doc Ingest',
      status: 'Success'
    },
    {
      id: 'LOG-3',
      timestamp: '45m ago',
      action: 'Vector partition optimization sequence complete (Region: us-east1)',
      user: 'System Core Engine',
      category: 'System',
      status: 'Success'
    },
    {
      id: 'LOG-4',
      timestamp: '1h 12m ago',
      action: 'Unauthorized API route call rejected (Access key invalid)',
      user: 'IP: 198.51.100.42',
      category: 'Auth',
      status: 'Warning'
    }
  ];

  return (
    <div className="flex flex-col gap-8 relative z-10" id="dashboard-view-root">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white">
            Clinical Console Dashboard
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Real-time status of your institution's private medical knowledge indexes, search endpoints, and RAG pipelines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTo('assistant')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] hover:opacity-90 text-slate-950 font-display font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-[#00E5FF]/15"
          >
            <Plus size={14} />
            New RAG Consultation
          </button>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-[#00E5FF]/20 transition-all"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full pointer-events-none group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">{stat.title}</span>
                <div className={`p-2 rounded-lg bg-slate-950/40 border border-white/5 ${stat.color}`}>
                  <Icon size={16} />
                </div>
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-display font-black text-white block">{stat.value}</span>
                <span className="text-xs text-[#14F195] font-mono mt-1.5 flex items-center gap-1">
                  <TrendingUp size={12} />
                  {stat.change}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Two Columns: Recent Documents & Real-Time System Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Ingestion Table */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Recent Ingestion Stream</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">Patient records automatically indexified with HIPAA encryption.</p>
            </div>
            <button
              onClick={() => onNavigateTo('documents')}
              className="text-xs text-[#00E5FF] hover:underline flex items-center gap-1 font-mono"
            >
              All Docs
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs" id="recent-docs-table">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-mono uppercase tracking-wider text-[10px] pb-3">
                  <th className="py-3 font-semibold">Document Name</th>
                  <th className="py-3 font-semibold">Type</th>
                  <th className="py-3 font-semibold">Patient ID</th>
                  <th className="py-3 font-semibold">Status</th>
                  <th className="py-3 font-semibold text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-3.5 pr-3 font-medium text-white max-w-[200px] truncate">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[#00E5FF] group-hover:scale-110 transition-transform" />
                        <span className="truncate">{doc.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-950/40 border border-white/5 text-[10px] text-slate-300">
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">{doc.patientId}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        doc.status === 'Ready'
                          ? 'bg-[#14F195]/10 text-[#14F195]'
                          : 'bg-amber-400/10 text-amber-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          doc.status === 'Ready' ? 'bg-[#14F195]' : 'bg-amber-400 animate-pulse'
                        }`}></span>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-400">{doc.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time reasoning activity stream */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div>
            <h3 className="font-display font-bold text-lg text-white">Audit & Operations Feed</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">Live security logging of RAG model inferences and user actions.</p>
          </div>

          <div className="flex flex-col gap-3.5 flex-1 justify-between">
            <div className="flex flex-col gap-3.5">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950/40 border border-white/5 text-xs flex gap-3 items-start hover:border-white/10 transition-all">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    log.status === 'Success'
                      ? 'bg-[#14F195]/10 text-[#14F195]'
                      : 'bg-amber-400/10 text-amber-400'
                  }`}>
                    <Activity size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-300 truncate">{log.user}</span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-400 mt-1 line-clamp-2 leading-relaxed font-mono text-[11px]">{log.action}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-slate-400 uppercase">{log.category}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'Success' ? 'bg-[#14F195]' : 'bg-amber-400'}`}></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-[#14F195] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#14F195] animate-ping shrink-0"></span>
                Secure Audit Channel Active
              </span>
              <span className="text-slate-500">2026-06-26 UTC</span>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Action Bento Row */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <h3 className="font-display font-bold text-lg text-white">Console Short-Keys</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigateTo('assistant')}
            className="p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-[#00E5FF]/30 hover:bg-slate-950/80 transition-all cursor-pointer flex gap-4 items-center group"
          >
            <div className="p-3 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] group-hover:scale-110 transition-transform">
              <Cpu size={18} />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white group-hover:text-[#00E5FF] transition-colors">Launch Assistant</h4>
              <p className="text-xs text-slate-400 mt-0.5">Interact with clinical models.</p>
            </div>
          </div>

          <div
            onClick={() => onNavigateTo('search')}
            className="p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-[#7C3AED]/30 hover:bg-slate-950/80 transition-all cursor-pointer flex gap-4 items-center group"
          >
            <div className="p-3 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] group-hover:scale-110 transition-transform">
              <Search size={18} />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white group-hover:text-[#7C3AED] transition-colors">Semantic Search</h4>
              <p className="text-xs text-slate-400 mt-0.5">Search journals & databases.</p>
            </div>
          </div>

          <div
            onClick={() => onNavigateTo('settings')}
            className="p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-[#14F195]/30 hover:bg-slate-950/80 transition-all cursor-pointer flex gap-4 items-center group"
          >
            <div className="p-3 rounded-lg bg-[#14F195]/10 text-[#14F195] group-hover:scale-110 transition-transform">
              <Database size={18} />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white group-hover:text-[#14F195] transition-colors">Data Gateways</h4>
              <p className="text-xs text-slate-400 mt-0.5">Audit private API connections.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
