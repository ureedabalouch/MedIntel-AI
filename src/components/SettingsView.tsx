import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Shield,
  Key,
  Database,
  Lock,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw
} from 'lucide-react';

export default function SettingsView() {
  const [groundedOnly, setGroundedOnly] = useState(true);
  const [mriIngestEncrypted, setMriIngestEncrypted] = useState(true);
  const [activeSyncInterval, setActiveSyncInterval] = useState('Hourly');

  return (
    <div className="flex flex-col gap-8 relative z-10" id="settings-view-root">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>CONSOLE</span>
          <span>/</span>
          <span className="text-[#00E5FF]">SYSTEM CONFIGURATION</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white">
          System Control & Gateways
        </h1>
        <p className="text-[#94A3B8] text-sm">
          Manage your enterprise healthcare integration keys, database bridges, and reasoning guardrails.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Toggles and Settings */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Section 1: Clinical Model Guardrails */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white">
              <Cpu size={18} className="text-[#00E5FF]" />
              <h3 className="font-display font-bold text-base">Clinical Model Guardrails</h3>
            </div>
            <p className="text-xs text-slate-400">
              Configure parameters that restrict or guide the generative medical synthesis streams.
            </p>

            <div className="divide-y divide-white/5 text-xs">
              
              {/* Toggle 1 */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="font-display font-bold text-slate-200 block">Strict Grounded-Only Mode</span>
                  <span className="text-slate-400 text-[11px] mt-0.5 block">When active, the model throws an error rather than extrapolating or guessing if no close vector matches are retrieved.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGroundedOnly(!groundedOnly)}
                  className={`w-11 h-6 rounded-full p-1 transition-all ${groundedOnly ? 'bg-[#00E5FF]' : 'bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-slate-950 transition-all ${groundedOnly ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="font-display font-bold text-slate-200 block">Active DICOM/MRI Decryption</span>
                  <span className="text-slate-400 text-[11px] mt-0.5 block">Automatically decrypt and index DICOM spatial arrays in real-time during drag-and-drop operations.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMriIngestEncrypted(!mriIngestEncrypted)}
                  className={`w-11 h-6 rounded-full p-1 transition-all ${mriIngestEncrypted ? 'bg-[#14F195]' : 'bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-slate-950 transition-all ${mriIngestEncrypted ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>

            </div>
          </div>

          {/* Section 2: Connected Gateways & Bridges */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white">
              <Database size={18} className="text-[#14F195]" />
              <h3 className="font-display font-bold text-base">EHR Database Bridges</h3>
            </div>
            <p className="text-xs text-slate-400">
              Active connections to institutional health repository APIs.
            </p>

            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-[#00E5FF]/10 text-[#00E5FF] font-mono font-bold text-xs">EPIC</div>
                  <div>
                    <span className="text-xs font-display font-bold text-white block">Epic Systems Sandbox Sync</span>
                    <span className="text-[10px] font-mono text-slate-500">Endpoint: https://epic-gateway.local-hospital.org/v2/fhir</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-400/15 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  CONNECTED
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-[#7C3AED]/10 text-[#7C3AED] font-mono font-bold text-xs">CERN</div>
                  <div>
                    <span className="text-xs font-display font-bold text-white block">Cerner Millennium Sync Bridge</span>
                    <span className="text-[10px] font-mono text-slate-500">Endpoint: https://cerner.local-hospital.org/hl7</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-400/15 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  CONNECTED
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Security Audits */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white">
              <Shield size={16} className="text-[#7C3AED]" />
              <h3 className="font-display font-bold text-sm">Security & Compliance Log</h3>
            </div>
            
            <p className="text-xs text-slate-400">
              Your platform operates strictly under SOC2 Type II trust principles.
            </p>

            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 text-[10px] font-mono text-slate-300">
                <span className="text-slate-500">[07:40:12]</span> SECURE_KEY_CHECK completed. Keys validated.
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 text-[10px] font-mono text-slate-300">
                <span className="text-slate-500">[06:12:44]</span> BAA signature token checked (expires in 21 days).
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 text-[10px] font-mono text-slate-300">
                <span className="text-slate-500">[04:30:11]</span> Daily vector snapshot backup stored on VPC vault.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 flex gap-2 items-start text-xs text-amber-300 mt-2">
              <AlertCircle size={16} className="shrink-0" />
              <div>
                <span className="font-semibold block">SLA Warning limits</span>
                <span className="text-[10px] leading-relaxed mt-0.5 block">Access key rotation scheduled in 48 hours to maintain strict SOC2 audit standards.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
