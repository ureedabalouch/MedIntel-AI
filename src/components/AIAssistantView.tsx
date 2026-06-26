import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  Database,
  Brain,
  Shield,
  Search,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Plus
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  latency?: string;
  citations?: { id: string; label: string; url: string }[];
  reasoningSteps?: string[];
}

export default function AIAssistantView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      content: 'Clinical RAG Sandbox session active. Place a prompt or pick a preset clinical audit profile below to query the secure medical database index.',
      timestamp: '07:40 AM'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeReasoningId, setActiveReasoningId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const predefinedPrompts = [
    {
      label: 'Renal anticoagulant assessment',
      text: 'Evaluating a 58yo male with chronic renal insufficiency and sudden atrial fibrillation. Analyze safety of standard anticoagulants (Warfarin vs. Apixaban) considering GFR of 26 mL/min. Generate grounded contraindications.'
    },
    {
      label: 'Chemotherapy Cardiotoxicity Profile',
      text: 'Examine cardiotoxic profile for a 62yo female patient on Trastuzumab (Herceptin) with prior history of mild hypertension. What is the standard cardiac monitoring interval protocol?'
    },
    {
      label: 'Metformin Contrast Dye Hold',
      text: 'Review metfomin administration hold protocols for a patient scheduled for an emergency abdominal contrast CT scan with baseline creatinine of 1.4 mg/dL.'
    }
  ];

  const simulatedResponses: Record<string, { content: string; steps: string[]; citations: { id: string; label: string; url: string }[] }> = {
    'Evaluating a 58yo male with chronic renal insufficiency and sudden atrial fibrillation. Analyze safety of standard anticoagulants (Warfarin vs. Apixaban) considering GFR of 26 mL/min. Generate grounded contraindications.': {
      content: 'Based on current clinical guidelines and private institutional metrics, **Apixaban (Eliquis)** is highly preferred over Warfarin for this 58yo male with chronic renal insufficiency (GFR: 26 mL/min). \n\n**1. Warfarin Risks:** Warfarin is associated with a significantly higher hazard ratio for major hemorrhages in renal failure. Furthermore, it accelerates vascular calcification and elevates calciphylaxis risk in chronic kidney disease.\n\n**2. Apixaban Safety Profile:** Renal excretion of Apixaban represents only 27% of its total clearance. In the ARISTOTLE trial subgroups, Apixaban showed superior safety metrics compared to Warfarin in patients with a GFR of 25–30 mL/min, yielding lower rates of major bleeding and comparable stroke prevention.\n\n**3. Dosing Recommendation & Pharmacogenomics:** Standard dosing is 5 mg BID. However, because this patient shows an MDR1 (ABCB1) variant on genomic audit, which increases active blood concentrations, we strongly suggest a dose adjustment to **2.5 mg BID** to protect against clearance delays.',
      steps: [
        'Checked GFR baseline value against FDA Renal Clearence table (Row 42c).',
        'Cross-referenced Warfarin calciphylaxis reports in PubMed (PMID: 3122904).',
        'Retrieved ARISTOTLE trial pharmacokinetic parameters for renal clearance limits (p-values: 0.012).',
        'Analyzed MDR1 gene variant influence on drug export pump rates in ABCB1 genes.'
      ],
      citations: [
        { id: 'cit-1', label: 'PubMed 3122904', url: '#' },
        { id: 'cit-2', label: 'ARISTOTLE Sub-Analysis GFR', url: '#' },
        { id: 'cit-3', label: 'FDA Table 4c - Anticoagulants', url: '#' }
      ]
    },
    'Examine cardiotoxic profile for a 62yo female patient on Trastuzumab (Herceptin) with prior history of mild hypertension. What is the standard cardiac monitoring interval protocol?': {
      content: 'Trastuzumab (Herceptin) is an effective HER2 inhibitor but carries a known risk of **reversible Left Ventricular Ejection Fraction (LVEF) declines**. \n\n**1. Standard Cardiac Monitoring Protocol:** According to ACC/AHA guidelines, the patient must undergo echocardiographic LVEF assessment at **baseline (pre-treatment), and then at 3, 6, 9, and 12 months** post-initiation of Trastuzumab.\n\n**2. Risk Amplification (Hypertension):** The patient\'s history of hypertension is an independent multiplier for Trastuzumab-induced heart failure. Keep systolic pressure strictly below 130 mmHg. If LVEF falls by >10% to a value below 50%, Trastuzumab should be temporarily held for 4 weeks.',
      steps: [
        'Retrieved ACC/AHA oncology monitoring interval matrices.',
        'Matched Trastuzumab toxicities against patient\'s chronic hypertension notes.',
        'Calculated absolute LVEF deviation warning margins.'
      ],
      citations: [
        { id: 'cit-4', label: 'Lancet Oncol 2024: Herceptin Protocols', url: '#' },
        { id: 'cit-5', label: 'ACC/AHA Cardiotoxicity Guidelines', url: '#' }
      ]
    },
    'Review metfomin administration hold protocols for a patient scheduled for an emergency abdominal contrast CT scan with baseline creatinine of 1.4 mg/dL.': {
      content: 'Metformin is excreted exclusively by glomerular filtration. In contrast CT scans, iodinated contrast media poses a risk of contrast-induced acute kidney injury (CI-AKI), which could trigger metformin accumulation leading to **lactic acidosis**.\n\n**Hold Protocol Guidelines:**\n1. **Immediate Hold:** Hold Metformin *at the time of or prior to* the contrast procedure.\n2. **48-Hour Recovery Hold:** Do not resume Metformin for **at least 48 hours** following the procedure.\n3. **Re-evaluate:** Only resume metformin once serum creatinine has been re-evaluated and confirmed back to patient baseline (e.g., <= 1.4 mg/dL).',
      steps: [
        'Matched baseline creatinine (1.4 mg/dL) with GFR bounds.',
        'Queried ACR (American College of Radiology) contrast media guidelines chapter 4.',
        'Parsed metformin accumulation lactic acidosis hazards.'
      ],
      citations: [
        { id: 'cit-6', label: 'ACR Manual on Contrast Media v11', url: '#' },
        { id: 'cit-7', label: 'ADA Metformin Safety Table', url: '#' }
      ]
    }
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Simulated RAG generation delay
    setTimeout(() => {
      const match = simulatedResponses[text] || {
        content: `I have received your medical query: "${text}". As an AI decision support console grounded strictly in private health indexes, I have retrieved 2 related documents. No drug-drug contraindications were discovered in current medical indexes.`,
        steps: ['Searched SNOMED indices.', 'Checked drug contraindication tables.'],
        citations: [{ id: 'cit-gen', label: 'Standard Clinical Library', url: '#' }]
      };

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        content: match.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latency: '114ms',
        citations: match.citations,
        reasoningSteps: match.steps
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
      setActiveReasoningId(aiMsg.id); // auto-expand reasoning path
    }, 1200);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg-initial',
        sender: 'assistant',
        content: 'Clinical RAG Sandbox session active. Place a prompt or pick a preset clinical audit profile below to query the secure medical database index.',
        timestamp: '07:40 AM'
      }
    ]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10" id="ai-assistant-root">
      
      {/* Left Chat Window Column */}
      <div className="xl:col-span-8 flex flex-col h-[70vh] glass-panel rounded-2xl border border-white/10 overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 bg-slate-950/60 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20 glow-primary">
              <Brain size={18} />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-white">Active RAG Reasoning Terminal</h2>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                INDEX STATUS: LOCKED & GROUNDED
              </span>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="p-2 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Clear Consultation Session"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Chat Message Scroll */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-2 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/20 rounded-tr-none'
                    : 'bg-slate-900/60 text-slate-200 border border-white/5 rounded-tl-none'
                }`}
              >
                {/* User query marker */}
                {msg.sender === 'user' && (
                  <div className="text-[9px] font-mono text-[#00E5FF] uppercase font-bold mb-1 tracking-wider">Clinician Request</div>
                )}
                
                {/* Parse markdown bold and code references */}
                <p className="whitespace-pre-line">
                  {msg.content}
                </p>

                {/* Footnotes references */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <BookOpen size={10} /> Grounded references:
                    </span>
                    {msg.citations.map((cit) => (
                      <a
                        key={cit.id}
                        href={cit.url}
                        className="px-2 py-0.5 rounded bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED] hover:text-white text-[10px] font-mono hover:bg-[#7C3AED]/40 transition-colors"
                      >
                        {cit.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion Reasoning steps for AI */}
              {msg.sender === 'assistant' && msg.reasoningSteps && (
                <div className="w-full">
                  <button
                    onClick={() => setActiveReasoningId(activeReasoningId === msg.id ? null : msg.id)}
                    className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors mt-1 focus:outline-none"
                  >
                    {activeReasoningId === msg.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {activeReasoningId === msg.id ? 'Hide Clinical Reasoning Pathway' : 'Inspect Clinical Reasoning Pathway'}
                  </button>

                  <AnimatePresence>
                    {activeReasoningId === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-1.5"
                      >
                        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 text-[11px] font-mono text-slate-400 flex flex-col gap-2">
                          <span className="text-slate-500 font-bold">RAG PIPELINE EXECUTION SUMMARY:</span>
                          {msg.reasoningSteps.map((step, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <span className="text-[#00E5FF] shrink-0">[{idx + 1}]</span>
                              <span>{step}</span>
                            </div>
                          ))}
                          <div className="text-[9px] text-[#14F195] pt-1.5 border-t border-white/5 flex justify-between items-center">
                            <span>CITATIONS VERIFIED SECURE</span>
                            <span>LATENCY: {msg.latency}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Timestamp */}
              <span className="text-[10px] font-mono text-slate-500 mt-1">{msg.timestamp}</span>
            </div>
          ))}

          {/* Typing Loading Indicator */}
          {isTyping && (
            <div className="flex flex-col gap-2 mr-auto items-start max-w-[85%]">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 rounded-tl-none flex items-center gap-2">
                <span className="text-xs font-mono text-[#00E5FF] animate-pulse">MedIntel model is analyzing patient indices...</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-slate-950/40 border-t border-white/5">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask MedIntel RAG model or select a preset prompt below..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputVal)}
              disabled={isTyping}
              className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 focus:border-[#00E5FF] focus:outline-none text-white text-xs sm:text-sm placeholder:text-slate-500 font-mono disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(inputVal)}
              disabled={isTyping || !inputVal.trim()}
              className="absolute right-2 p-2 rounded-lg bg-[#00E5FF] text-slate-950 hover:bg-[#00E5FF]/80 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </div>
        </div>

      </div>

      {/* Right Presets & Information Column */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        
        {/* Preset clinical prompts list */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={16} className="text-[#00E5FF]" />
            <h3 className="font-display font-bold text-sm">Preset Patient Cases</h3>
          </div>
          <p className="text-xs text-slate-400">
            Pick an audit preset to test the platform's multi-layered reference retrieval process.
          </p>

          <div className="flex flex-col gap-3">
            {predefinedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setInputVal(p.text)}
                className="p-3 text-left rounded-xl bg-slate-900/50 border border-white/5 hover:border-[#00E5FF]/30 hover:bg-slate-950/80 transition-all text-xs font-mono text-slate-300 leading-relaxed cursor-pointer"
              >
                <div className="font-bold text-[#00E5FF] mb-1">{p.label}</div>
                <div className="line-clamp-2 text-slate-400 text-[11px]">{p.text}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Security & HIPAA Isolation Box */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#7C3AED]/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-2 text-white">
            <Shield size={16} className="text-[#14F195]" />
            <h3 className="font-display font-bold text-sm">Secure Audits Enabled</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All reasoning actions run inside a cryptographically verified clinical environment. No chat inputs or retrieved patient details are exported.
          </p>
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>GDPR/HIPAA AGENT:</span>
              <span className="text-[#14F195] font-bold">SECURE_RUN</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>ZERO-EXTRAPOLATION RULE:</span>
              <span className="text-[#00E5FF] font-bold">ACTIVE</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
