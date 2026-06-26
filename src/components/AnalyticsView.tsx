import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Cpu,
  Clock,
  TrendingUp,
  BarChart2,
  Database,
  ArrowUpRight,
  Shield,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

export default function AnalyticsView() {
  const [activeChart, setActiveChart] = useState<'latency' | 'accuracy' | 'clusters'>('latency');

  return (
    <div className="flex flex-col gap-8 relative z-10" id="analytics-view-root">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>CONSOLE</span>
          <span>/</span>
          <span className="text-[#00E5FF]">SYSTEM PERFORMANCE ANALYTICS</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white">
          Performance & Model Metrics
        </h1>
        <p className="text-[#94A3B8] text-sm">
          Monitor your private RAG semantic index's response intervals, factual alignment ratios, and resource footprint.
        </p>
      </div>

      {/* Grid of quick summary statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1.5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#00E5FF]"></div>
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">Mean Search Latency</span>
          <span className="text-3xl font-display font-black text-white">114ms</span>
          <span className="text-xs text-[#14F195] font-mono mt-1 flex items-center gap-1">
            <Clock size={12} /> -14ms vs last build
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1.5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#14F195]"></div>
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">Citation Attribution Rate</span>
          <span className="text-3xl font-display font-black text-white">100.0%</span>
          <span className="text-xs text-slate-500 font-mono mt-1">Grounded Zero-Hallucination Limit</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1.5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#7C3AED]"></div>
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">Private Vectors Cached</span>
          <span className="text-3xl font-display font-black text-white">1.8M</span>
          <span className="text-xs text-[#00E5FF] font-mono mt-1 flex items-center gap-1">
            <Database size={12} /> Active Index Synced
          </span>
        </div>
      </div>

      {/* Main interactive SVG chart module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Dynamic Chart Shell */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                {activeChart === 'latency' && 'Query Ingestion & Inference Latency Trend'}
                {activeChart === 'accuracy' && 'Factual Grounding Accuracy vs Legacy LLMs'}
                {activeChart === 'clusters' && 'High-Dimensional Vector Space Topology'}
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {activeChart === 'latency' && 'Time elapsed (ms) across the last 12-hour surgical audit rotation.'}
                {activeChart === 'accuracy' && 'Comparison of source-grounded answers to non-RAG models on identical medical boards.'}
                {activeChart === 'clusters' && 'Projection of mapped patient records, medical journals, and active drug files.'}
              </p>
            </div>
            
            <div className="p-2 bg-slate-950/40 rounded-lg border border-white/5 text-[#00E5FF]">
              <BarChart2 size={16} />
            </div>
          </div>

          {/* Render Customized Exquisite SVG Charts based on state */}
          <div className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-4 flex items-center justify-center relative overflow-hidden" style={{ minHeight: '300px' }}>
            {activeChart === 'latency' && (
              <svg width="100%" height="280" viewBox="0 0 600 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal grid lines */}
                <line x1="40" y1="40" x2="560" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="40" y1="100" x2="560" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="40" y1="160" x2="560" y2="160" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="40" y1="220" x2="560" y2="220" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                
                {/* Y Axis labels */}
                <text x="15" y="45" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">200ms</text>
                <text x="15" y="105" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">150ms</text>
                <text x="15" y="165" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">100ms</text>
                <text x="15" y="225" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">50ms</text>

                {/* X Axis labels */}
                <text x="60" y="250" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">08:00</text>
                <text x="160" y="250" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">11:00</text>
                <text x="260" y="250" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">14:00</text>
                <text x="360" y="250" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">17:00</text>
                <text x="460" y="250" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">20:00</text>

                {/* Area path */}
                <path d="M 60 220 Q 110 120 160 180 T 260 140 T 360 130 T 460 150 L 460 220 L 60 220 Z" fill="url(#latencyGrad)" />

                {/* Line path */}
                <path d="M 60 220 Q 110 120 160 180 T 260 140 T 360 130 T 460 150" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" />

                {/* Blinking actual dot */}
                <circle cx="460" cy="150" r="5" fill="#00E5FF" />
                <circle cx="460" cy="150" r="10" fill="none" stroke="#00E5FF" strokeWidth="2" className="animate-ping" style={{ transformOrigin: '460px 150px' }} />
              </svg>
            )}

            {activeChart === 'accuracy' && (
              <svg width="100%" height="280" viewBox="0 0 600 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Horizontal axis guides */}
                <line x1="40" y1="220" x2="560" y2="220" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                
                {/* Y Axis accuracy lines */}
                <text x="15" y="60" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">100%</text>
                <line x1="40" y1="55" x2="560" y2="55" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <text x="15" y="140" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">50%</text>
                <line x1="40" y1="135" x2="560" y2="135" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

                {/* Bar 1: Legacy Keyword */}
                <rect x="80" y="150" width="60" height="70" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
                <text x="80" y="140" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="sans-serif" fontWeight="bold">32%</text>
                <text x="65" y="240" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="sans-serif">Keyword Search</text>

                {/* Bar 2: Standard ChatGPT-4 / LLM */}
                <rect x="230" y="90" width="60" height="130" rx="4" fill="rgba(124, 58, 237, 0.2)" stroke="rgba(124, 58, 237, 0.4)" />
                <text x="230" y="80" fill="#7C3AED" fontSize="10" fontFamily="sans-serif" fontWeight="bold">64% (hallucinates)</text>
                <text x="220" y="240" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="sans-serif">Standard LLM</text>

                {/* Bar 3: MedIntel AI (Grounded RAG) */}
                <rect x="380" y="56" width="60" height="164" rx="4" fill="rgba(20, 241, 149, 0.25)" stroke="#14F195" />
                <text x="380" y="46" fill="#14F195" fontSize="10" fontFamily="sans-serif" fontWeight="bold">99.99% (grounded)</text>
                <text x="375" y="240" fill="#14F195" fontSize="10" fontFamily="sans-serif" fontWeight="bold">MedIntel AI RAG</text>
              </svg>
            )}

            {activeChart === 'clusters' && (
              <svg width="100%" height="280" viewBox="0 0 600 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Circular ambient rings represent similarity tiers */}
                <circle cx="300" cy="140" r="120" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <circle cx="300" cy="140" r="70" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                
                {/* Cluster nodes */}
                {/* EHR Cluster (Cyan) */}
                <circle cx="210" cy="100" r="8" fill="#00E5FF" opacity="0.8" />
                <circle cx="190" cy="115" r="5" fill="#00E5FF" opacity="0.6" />
                <circle cx="215" cy="80" r="6" fill="#00E5FF" opacity="0.5" />
                <text x="160" y="70" fill="#00E5FF" fontSize="9" fontFamily="monospace">EHR RECORDS CLUSTER</text>

                {/* Clinical trials Cluster (Purple) */}
                <circle cx="410" cy="170" r="10" fill="#7C3AED" opacity="0.8" />
                <circle cx="430" cy="150" r="6" fill="#7C3AED" opacity="0.6" />
                <circle cx="390" cy="190" r="4" fill="#7C3AED" opacity="0.5" />
                <text x="410" y="210" fill="#7C3AED" fontSize="9" fontFamily="monospace">PUBMED JOURNAL VECTORS</text>

                {/* Core nexus (Green) */}
                <circle cx="300" cy="140" r="14" fill="#14F195" opacity="0.9" />
                <text x="270" y="170" fill="#14F195" fontSize="10" fontFamily="monospace" fontWeight="bold">CURRENT PATIENT NEXUS</text>

                {/* Connecting similarity lines */}
                <line x1="300" y1="140" x2="210" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                <line x1="300" y1="140" x2="410" y2="170" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
              </svg>
            )}
          </div>
        </div>

        {/* Right Side: Navigation & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-3">
            <span className="text-[#00E5FF] text-xs font-mono font-bold uppercase">Toggle Statistics View</span>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveChart('latency')}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                  activeChart === 'latency'
                    ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-white'
                    : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/15'
                }`}
              >
                <span className="text-xs font-display font-bold block">1. Inference Speed (ms)</span>
                <span className="text-[10px] font-mono opacity-80 mt-1 block">Inspect pipeline response latency.</span>
              </button>

              <button
                onClick={() => setActiveChart('accuracy')}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                  activeChart === 'accuracy'
                    ? 'bg-[#14F195]/10 border-[#14F195] text-white'
                    : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/15'
                }`}
              >
                <span className="text-xs font-display font-bold block">2. Factual Attributions Ratio</span>
                <span className="text-[10px] font-mono opacity-80 mt-1 block">Verify zero-hallucination score parameters.</span>
              </button>

              <button
                onClick={() => setActiveChart('clusters')}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                  activeChart === 'clusters'
                    ? 'bg-[#7C3AED]/10 border-[#7C3AED] text-white'
                    : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/15'
                }`}
              >
                <span className="text-xs font-display font-bold block">3. High-Dim Clustering Map</span>
                <span className="text-[10px] font-mono opacity-80 mt-1 block">Explore mapped record densities.</span>
              </button>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-white">
              <Shield size={16} className="text-[#14F195]" />
              <h4 className="font-display font-bold text-xs">Compliance Audit Certificate</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every inference recorded undergoes fully decentralized SOC2 and HIPAA compliant audit logging. Clinicians can export signed cryptographic compliance packets.
            </p>
            <button className="w-full py-2.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-white/25 text-white font-mono text-[10px] font-semibold tracking-wider transition-all">
              EXPORT CRYPTO PROOF BUNDLE
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
