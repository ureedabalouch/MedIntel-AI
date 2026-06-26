import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  FileText,
  LifeBuoy,
  MessageSquare,
  Shield,
  ArrowRight,
  Send,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

export default function SupportView() {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketSubject.trim()) {
      setTicketSent(true);
      setTimeout(() => {
        setTicketSent(false);
        setTicketSubject('');
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col gap-8 relative z-10" id="support-view-root">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>CONSOLE</span>
          <span>/</span>
          <span className="text-[#00E5FF]">PHYSICIAN SLA SUPPORT</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white">
          Clinical Assistance & BAA Support
        </h1>
        <p className="text-[#94A3B8] text-sm">
          Connect directly with certified bioinformaticians, view clinical guidelines, or file specialized pipeline assistance tickets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Support Ticket Form */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-white">
              <LifeBuoy size={18} className="text-[#00E5FF]" />
              <h3 className="font-display font-bold text-base">Open High-Priority Pipeline Ticket</h3>
            </div>
            
            <p className="text-xs text-slate-400">
              For issues related to secure VPC connectivity, model citation errors, or DICOM indexing delays.
            </p>

            <form onSubmit={handleTicketSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-slate-400">SELECT PROBLEM CLASS</label>
                <select className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:border-[#00E5FF] focus:outline-none">
                  <option>EPIC Systems API Ingestion Pipeline Failure</option>
                  <option>Custom MedIntel Model Hallucination Audit Report</option>
                  <option>SOC2 Key Rotation / Access Vault Lockout</option>
                  <option>Other Bioinformatics Platform Issue</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-slate-400">DETAILED CLINICAL DESCRIPTION</label>
                <textarea
                  placeholder="Describe your vector indexing discrepancy or query pipeline latencies..."
                  rows={4}
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  required
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono focus:border-[#00E5FF] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-slate-950 font-display font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 self-start"
              >
                File Support Ticket
                <Send size={14} />
              </button>
            </form>

            <AnimatePresence>
              {ticketSent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 rounded-xl bg-[#14F195]/10 border border-[#14F195]/20 text-xs font-mono text-[#14F195] flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Pipeline Ticket Registered. Your SLA contract guarantees response from a bioinformatics engineer within 15 minutes.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: SLA Contract Info */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Active SLA contract details */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#14F195]/10 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center gap-2 text-white">
              <Shield size={16} className="text-[#14F195]" />
              <h3 className="font-display font-bold text-sm">Enterprise SLA Active</h3>
            </div>
            
            <div className="flex flex-col gap-2.5 text-xs mt-2">
              <div className="flex justify-between font-mono text-slate-400">
                <span>CONTRACT STATUS:</span>
                <span className="text-[#14F195] font-bold">GOLDEN STANDARD</span>
              </div>
              <div className="flex justify-between font-mono text-slate-400">
                <span>PLATFORM UP-TIME:</span>
                <span className="text-white">99.998% SLA Guaranteed</span>
              </div>
              <div className="flex justify-between font-mono text-slate-400">
                <span>BIO-INF ENGINEER RESP:</span>
                <span className="text-[#00E5FF] font-bold">&lt; 15 Minutes</span>
              </div>
            </div>
          </div>

          {/* Expert Hotlines */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-white">
              <PhoneCall size={16} className="text-[#00E5FF]" />
              <h3 className="font-display font-bold text-sm">Expert Surgeon Helpline</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              If you require clinical RAG model consultation in the middle of active surgical procedures, dial our priority satellite routing numbers.
            </p>
            <span className="text-xs font-mono text-[#00E5FF] font-bold mt-1 block">SATELLITE priority dialer: +1 (800) MEDINTEL-SLA</span>
          </div>

        </div>

      </div>

    </div>
  );
}
