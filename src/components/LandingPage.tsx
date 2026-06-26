import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Shield,
  Activity,
  Search,
  Database,
  Brain,
  Layers,
  FileText,
  Lock,
  Globe,
  Zap,
  CheckCircle,
  HelpCircle,
  Check,
  TrendingUp,
  Cpu,
  Sparkles
} from 'lucide-react';
import Logo from './Logo';

interface LandingPageProps {
  onLaunchPlatform: () => void;
}

export default function LandingPage({ onLaunchPlatform }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [demoRequested, setDemoRequested] = useState(false);
  const [activeHowItWorksStep, setActiveHowItWorksStep] = useState(0);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setDemoRequested(true);
      setTimeout(() => {
        setDemoRequested(false);
        setEmail('');
      }, 5000);
    }
  };

  const steps = [
    {
      title: 'Multimodal Ingestion',
      description: 'EHR records, MRI reports, clinical scans, genomic data sheets, and journals are securely ingested and translated into high-dimensional medical vectors.',
      icon: Database,
      badge: 'HIPAA Isolated Secure Ingestion'
    },
    {
      title: 'Contextual Semantic Search',
      description: 'Our medical embedding model matches clinical queries with private records and primary databases (PubMed, SNOMED-CT, RxNorm) with specialized anatomy weights.',
      icon: Search,
      badge: 'Sub-150ms Vector Retrieval'
    },
    {
      title: 'Grounded Clinical Rationale',
      description: 'The platform generates clinical summaries, diagnostic suggestions, and treatment contraindications, complete with inline verified footnotes pointing directly to primary literature.',
      icon: Brain,
      badge: 'Verified Zero-Hallucination Framework'
    }
  ];

  return (
    <div className="relative min-h-screen z-10 select-none overflow-x-hidden font-sans" id="landing-page-root">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-lg">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Logo size={36} />
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-[#00E5FF] transition-colors">Platform Features</a>
            <a href="#how-it-works" className="hover:text-[#00E5FF] transition-colors">Technology</a>
            <a href="#security" className="hover:text-[#00E5FF] transition-colors">Security</a>
            <a href="#why-medintel" className="hover:text-[#00E5FF] transition-colors">Enterprise SLA</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={onLaunchPlatform}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text-slate-900 font-display font-semibold text-sm hover:opacity-90 hover:shadow-lg hover:shadow-[#00E5FF]/20 transition-all cursor-pointer flex items-center gap-2"
              id="launch-console-header-btn"
            >
              Launch Console
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 px-6 max-w-7xl mx-auto flex flex-col items-center text-center" id="hero-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-[#00E5FF]/30 text-xs font-semibold text-[#00E5FF] mb-6 backdrop-blur"
        >
          <span className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse"></span>
          FDA CLASS II STANDARDIZED & HIPAA COMPLIANT
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-extrabold text-4xl sm:text-5xl md:text-7xl tracking-tight text-white max-w-5xl leading-[1.1] mb-6"
        >
          Transforming Medical Knowledge <br />
          into <span className="text-gradient-cyan-purple font-black">Intelligent Decisions</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[#94A3B8] text-lg sm:text-xl max-w-3xl leading-relaxed mb-10"
        >
          The next generation of clinical decision support. MedIntel AI aggregates institutional EHR repositories, diagnostic medical reports, and global research vectors into zero-hallucination medical reasoning streams.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md"
        >
          <button
            onClick={onLaunchPlatform}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#7C3AED] to-[#14F195] text-slate-950 font-display font-bold text-base hover:opacity-95 hover:shadow-2xl hover:shadow-[#00E5FF]/30 transition-all cursor-pointer flex items-center justify-center gap-3 group"
          >
            Launch Medical Console
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900/60 border border-white/10 hover:border-white/25 hover:bg-slate-900/90 text-white font-medium text-sm transition-all text-center"
          >
            Explore Framework Rationale
          </a>
        </motion.div>

        {/* Live Simulation of RAG Lifecycle (Hero Interactive Element) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 w-full max-w-5xl glass-panel rounded-2xl border border-white/10 overflow-hidden relative"
          id="hero-rag-sim"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00E5FF] via-[#7C3AED] to-[#14F195]"></div>
          
          <div className="p-4 bg-slate-950/60 border-b border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
              <span className="ml-2 text-slate-300 font-bold">MEDINTEL-RAG-SANDBOX // SESSION_049B</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] font-semibold">SECURE SANDBOX ACTIVE</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 text-left">
            {/* Input clinical query */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <span className="text-xs uppercase font-mono tracking-wider text-[#00E5FF] font-semibold">Incoming Clinical Prompt</span>
              <div className="p-4 rounded-xl bg-[#07111F] border border-white/5 font-mono text-sm text-slate-200 leading-relaxed">
                <span className="text-[#14F195] font-bold">Q:</span> "Evaluating a 58yo male with chronic renal insufficiency and sudden atrial fibrillation. Analyze safety of standard anticoagulants (Warfarin vs. Apixaban) considering GFR of 26 mL/min. Generate grounded contraindications."
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">Retrieved EHR Matches</span>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5 text-xs text-slate-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-[#7C3AED]" />
                    <span className="truncate font-mono">Patient_ID_9903_LabReport_Serum_Creatinine.pdf</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px] shrink-0">98% Match</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5 text-xs text-slate-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-[#7C3AED]" />
                    <span className="truncate font-mono">Patient_ID_9903_Genetics_CYP2C9_MDR1.csv</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px] shrink-0">94% Match</span>
                </div>
              </div>
            </div>

            {/* Simulated generation action */}
            <div className="lg:col-span-2 flex flex-row lg:flex-col items-center justify-center gap-4 text-center py-4">
              <div className="w-full h-px lg:w-px lg:h-24 bg-gradient-to-r lg:bg-gradient-to-b from-[#00E5FF] to-[#7C3AED]"></div>
              <div className="p-3.5 rounded-full bg-slate-900 border border-[#00E5FF]/20 text-[#00E5FF] glow-primary animate-pulse shrink-0">
                <Cpu size={24} />
              </div>
              <div className="w-full h-px lg:w-px lg:h-24 bg-gradient-to-r lg:bg-gradient-to-b from-[#7C3AED] to-[#14F195]"></div>
            </div>

            {/* Generated output */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-wider text-[#14F195] font-semibold">MedIntel Reasoning Synthesis</span>
                <span className="text-[10px] bg-[#14F195]/15 text-[#14F195] font-mono px-2 py-0.5 rounded">Grounded Answer</span>
              </div>

              <div className="p-5 rounded-xl bg-slate-950/80 border border-white/15 relative">
                <p className="text-xs text-slate-200 leading-relaxed mb-3">
                  In patients with severe renal insufficiency (GFR 26 mL/min), <strong className="text-[#00E5FF]">Apixaban (Eliquis)</strong> is preferred over Warfarin as it shows a lower risk of major bleeding <span className="text-[#7C3AED] hover:underline cursor-help font-mono font-bold">[PubMed ID: 3122904]</span>. Warfarin presents a heightened risk of calciphylaxis and accelerated arterial calcification in chronic kidney disease <span className="text-[#7C3AED] hover:underline cursor-help font-mono font-bold">[RxNorm-CT: AR-509]</span>.
                </p>
                <p className="text-xs text-slate-200 leading-relaxed">
                  <strong className="text-red-400">Contraindications:</strong> Check genetic profile. Patient's MDR1 (ABCB1) variant shows a 1.4x higher Apixaban exposure rate; dosage reduction to 2.5mg BID should be strongly considered <span className="text-[#7C3AED] hover:underline cursor-help font-mono font-bold">[FDA GFR Table 4c]</span>.
                </p>
                
                <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                  <span className="text-[10px] bg-white/5 text-slate-400 font-mono px-1.5 py-0.5 rounded">Latency: 114ms</span>
                  <span className="text-[10px] bg-white/5 text-slate-400 font-mono px-1.5 py-0.5 rounded">Source Citations: 4 Verified</span>
                  <span className="text-[10px] bg-[#14F195]/10 text-[#14F195] font-mono px-1.5 py-0.5 rounded ml-auto flex items-center gap-1">
                    <CheckCircle size={10} /> 100% Attributed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto scroll-mt-20" id="features">
        <div className="text-center mb-16">
          <span className="text-[#00E5FF] text-sm uppercase font-mono tracking-widest font-semibold block mb-2">MEDINTEL SUITE Capabilities</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white">
            Engineered for Precision Medicine
          </h2>
          <p className="text-[#94A3B8] max-w-2xl mx-auto mt-4 text-base">
            Eliminate loose guesses. Build a comprehensive clinical knowledge base grounded entirely in private enterprise health data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center shrink-0 border border-[#00E5FF]/20">
              <Layers size={22} />
            </div>
            <h3 className="font-display font-bold text-xl text-white">Precision Clinical RAG</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Retrieve patient metrics across segmented datasets. Answers are directly linked with deep citations from current oncology, cardiology, and pharmacology records.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#14F195]/10 text-[#14F195] flex items-center justify-center shrink-0 border border-[#14F195]/20">
              <FileText size={22} />
            </div>
            <h3 className="font-display font-bold text-xl text-white">Multi-Modal Diagnoses</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ingest unstructured lab records, MRI scans, CT descriptions, genomic mutation matrices, and pediatric notes instantly with contextual OCR and visual encoders.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center shrink-0 border border-[#7C3AED]/20">
              <Shield size={22} />
            </div>
            <h3 className="font-display font-bold text-xl text-white">HIPAA Isolated Sandbox</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Zero telemetry logs. Patient PHI remains entirely encapsulated inside isolated virtual databases with AES-256 state and transit data locking mechanisms.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#14F195]/10 text-[#14F195] flex items-center justify-center shrink-0 border border-[#14F195]/20">
              <Database size={22} />
            </div>
            <h3 className="font-display font-bold text-xl text-white">Real-Time Ingest pipeline</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connect effortlessly to local hospital EHR backends, Epic Systems, or Cerner databases. Real-time vector updates and instant neural semantic indexing.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center shrink-0 border border-[#00E5FF]/20">
              <Brain size={22} />
            </div>
            <h3 className="font-display font-bold text-xl text-white">Synthesized Reasoning</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              View exact Chain-of-Thought (CoT) paths behind every conclusion. The platform displays clinical logic trees, differential diagnoses and contraindications.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center shrink-0 border border-[#7C3AED]/20">
              <Activity size={22} />
            </div>
            <h3 className="font-display font-bold text-xl text-white">99.99% Redundancy SLA</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Designed for critical care infrastructure. Distributed nodes guarantee constant sub-150ms access to your private vector database during surgery or emergency tasks.
            </p>
          </div>

        </div>
      </section>

      {/* How It Works - Tech Section */}
      <section className="py-24 px-6 bg-slate-950/40 border-y border-white/5 scroll-mt-20" id="how-it-works">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            <span className="text-[#00E5FF] text-sm uppercase font-mono tracking-widest font-semibold">Engine Architecture</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              Ground-Truth Medical RAG Rationale
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Our advanced architecture decouples medical insights from the generative model itself. This eliminates hallucinations entirely by restricting model synthesis strictly to verified medical indices and EHR databases.
            </p>

            <div className="flex flex-col gap-4 mt-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  onClick={() => setActiveHowItWorksStep(index)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex gap-4 ${
                    activeHowItWorksStep === index
                      ? 'bg-slate-900/80 border-[#00E5FF] shadow-[#00E5FF]/10 shadow-lg'
                      : 'bg-slate-900/20 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    activeHowItWorksStep === index
                      ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30'
                      : 'bg-white/5 text-slate-400 border-white/5'
                  }`}>
                    <step.icon size={18} />
                  </div>
                  <div>
                    <h4 className={`font-display font-bold text-sm ${activeHowItWorksStep === index ? 'text-[#00E5FF]' : 'text-slate-300'}`}>
                      {index + 1}. {step.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/10 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00E5FF]/5 rounded-full blur-3xl"></div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeHowItWorksStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20 px-3 py-1 rounded-full uppercase">
                      {steps[activeHowItWorksStep].badge}
                    </span>
                    <span className="text-xs font-mono text-slate-500">STAGE_0{activeHowItWorksStep + 1}</span>
                  </div>

                  <h3 className="font-display font-extrabold text-2xl text-white">
                    {steps[activeHowItWorksStep].title}
                  </h3>

                  <p className="text-slate-300 text-sm leading-relaxed">
                    {steps[activeHowItWorksStep].description}
                  </p>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 font-mono text-xs text-[#00E5FF] leading-relaxed flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-500">SYSTEM STACK TRACE:</span>
                      <span className="text-[#14F195]">SYS_OK</span>
                    </div>
                    {activeHowItWorksStep === 0 && (
                      <>
                        <span>&gt; Ingesting clinical_scan_mri.dicom...</span>
                        <span>&gt; Mapping spatial anatomy coordinates to vector spaces...</span>
                        <span>&gt; Ingesting lab_hematology.fhir...</span>
                        <span className="text-[#14F195]">&gt; Success: 5.4MB records tokenized and nested under ISO_27001 keys</span>
                      </>
                    )}
                    {activeHowItWorksStep === 1 && (
                      <>
                        <span>&gt; Executing cosine similarity search against index (SNOMED-CT)...</span>
                        <span>&gt; Match retrieved: Nephropathy secondary to amyloidosis (p=0.91)</span>
                        <span>&gt; Query expansion with medical synonym weights loaded...</span>
                        <span className="text-emerald-400">&gt; Vector database query completed in 98ms</span>
                      </>
                    )}
                    {activeHowItWorksStep === 2 && (
                      <>
                        <span>&gt; Invoking reasoning engine with grounded source context...</span>
                        <span>&gt; Applying medical factual guardrails (FDA, Lancet 2026)...</span>
                        <span>&gt; Validating citations and bibliography footprint...</span>
                        <span className="text-purple-400">&gt; Synthesis ready. Zero clinical extrapolation detected.</span>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </section>

      {/* Enterprise Security Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto scroll-mt-20" id="security">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col lg:flex-row gap-12 items-center">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#7C3AED]/10 to-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex-1 flex flex-col gap-6">
            <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] flex items-center justify-center border border-[#7C3AED]/30 glow-accent">
              <Lock size={22} />
            </div>
            
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
              Military-Grade Privacy for Healthcare Enterprise
            </h2>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              We understand that patient health data is incredibly sensitive. MedIntel AI operates under a Zero-Knowledge architecture: patient data never leaves your VPC. Your proprietary models and private clinical records are isolated from public neural networks.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Check className="text-[#14F195] shrink-0" size={16} />
                <span className="text-xs font-mono text-slate-300">HIPAA Compliant Vaults</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-[#14F195] shrink-0" size={16} />
                <span className="text-xs font-mono text-slate-300">AES-256 Multi-Key Lock</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-[#14F195] shrink-0" size={16} />
                <span className="text-xs font-mono text-slate-300">BAA Sign-off Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-[#14F195] shrink-0" size={16} />
                <span className="text-xs font-mono text-slate-300">SOC2 Type II Accredited</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/5 text-center flex flex-col items-center justify-center gap-2">
              <span className="text-3xl sm:text-4xl font-display font-black text-[#00E5FF]">0%</span>
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">Model Telemetry</span>
              <p className="text-[11px] text-slate-500 mt-1">We never train public models on your customer patient datasets.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/5 text-center flex flex-col items-center justify-center gap-2">
              <span className="text-3xl sm:text-4xl font-display font-black text-[#14F195]">100%</span>
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">Attributed Citations</span>
              <p className="text-[11px] text-slate-500 mt-1">Every clinical synthesis requires active, valid source bibliographies.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/5 text-center flex flex-col items-center justify-center gap-2 col-span-2">
              <span className="text-3xl sm:text-4xl font-display font-black text-white">VPC</span>
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">On-Premises / Private Cloud Isolated</span>
              <p className="text-[11px] text-slate-500 mt-1">Deployable directly onto AWS GovCloud, Google Cloud healthcare VPC, or Azure Government.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Comparison: Why MedIntel AI */}
      <section className="py-24 px-6 max-w-7xl mx-auto scroll-mt-20" id="why-medintel">
        <div className="text-center mb-16">
          <span className="text-[#14F195] text-sm uppercase font-mono tracking-widest font-semibold block mb-2">Engine Comparison</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
            Evolving Past Legacy Medical Search
          </h2>
          <p className="text-[#94A3B8] max-w-2xl mx-auto mt-4 text-sm sm:text-base">
            Medical research doubles every 73 days. Standard keyword lookups can't connect the dots, and vanilla LLMs hallucinate critical details. We fix both.
          </p>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-white/5 bg-slate-900/40 p-4 font-display font-bold text-sm text-slate-300">
            <div className="md:col-span-4">Capability</div>
            <div className="md:col-span-4 mt-2 md:mt-0 text-slate-400">Legacy Keyword Search / LLMs</div>
            <div className="md:col-span-4 mt-2 md:mt-0 text-[#00E5FF]">MedIntel AI Enterprise</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-white/5 p-4 items-center text-xs sm:text-sm">
            <div className="md:col-span-4 font-semibold text-white">Clinical Grounding</div>
            <div className="md:col-span-4 text-slate-400 flex items-center gap-2 mt-1 md:mt-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
              Vanilla responses prone to hallucinating.
            </div>
            <div className="md:col-span-4 text-[#14F195] flex items-center gap-2 mt-1 md:mt-0 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] shrink-0"></span>
              Rigid 100% vector-restricted grounding.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-white/5 p-4 items-center text-xs sm:text-sm">
            <div className="md:col-span-4 font-semibold text-white">Genomic / Multimodal Parsing</div>
            <div className="md:col-span-4 text-slate-400 flex items-center gap-2 mt-1 md:mt-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
              Incapable of reading raw multi-modal grids.
            </div>
            <div className="md:col-span-4 text-[#14F195] flex items-center gap-2 mt-1 md:mt-0 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] shrink-0"></span>
              Cross-encoders read raw tables, MRI & CT.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-white/5 p-4 items-center text-xs sm:text-sm">
            <div className="md:col-span-4 font-semibold text-white">Latency in ER/OR</div>
            <div className="md:col-span-4 text-slate-400 flex items-center gap-2 mt-1 md:mt-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
              5-15 seconds; prone to query queues.
            </div>
            <div className="md:col-span-4 text-[#14F195] flex items-center gap-2 mt-1 md:mt-0 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] shrink-0"></span>
              Sub-150ms real-time isolated execution.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 p-4 items-center text-xs sm:text-sm">
            <div className="md:col-span-4 font-semibold text-white">Security Safeguard</div>
            <div className="md:col-span-4 text-slate-400 flex items-center gap-2 mt-1 md:mt-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
              Data stored/logged by external model hosts.
            </div>
            <div className="md:col-span-4 text-[#14F195] flex items-center gap-2 mt-1 md:mt-0 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] shrink-0"></span>
              Complete VPC encapsulation with BAA.
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Area */}
      <section className="py-24 px-6 max-w-7xl mx-auto scroll-mt-20">
        <div className="relative rounded-3xl bg-gradient-to-b from-[#0D1B2A]/80 to-[#07111F]/90 border border-[#00E5FF]/20 p-8 md:p-16 text-center flex flex-col items-center justify-center gap-8 overflow-hidden glow-primary">
          <div className="absolute inset-0 bg-radial-gradient from-[#00E5FF]/10 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="p-3 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] shrink-0">
            <Sparkles size={24} />
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight max-w-3xl">
            Empower Your Clinical Specialists with Medical Cognition
          </h2>
          
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Configure a private clinical RAG sandbox in minutes. Connect your isolated EHR database, load compliance parameters, and test our zero-hallucination medical reasoning streams.
          </p>

          <form onSubmit={handleDemoSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-3 relative z-10">
            <input
              type="email"
              placeholder="Enter institutional email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3.5 rounded-xl bg-[#07111F]/90 border border-white/10 hover:border-white/20 focus:border-[#00E5FF] focus:outline-none text-white text-sm font-mono placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-slate-950 font-display font-bold text-sm transition-all cursor-pointer whitespace-nowrap"
            >
              Request Access
            </button>
          </form>

          <AnimatePresence>
            {demoRequested && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs font-mono text-[#14F195] flex items-center gap-2"
              >
                <CheckCircle size={14} />
                Access Request Registered. Our compliance representative will contact your institution within 12 hours.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-6 mt-4 text-[11px] font-mono text-slate-500">
            <span>HIPAA-COMPLIANT VAULT</span>
            <span>•</span>
            <span>BAA SLA CONTRACT INCLUDED</span>
            <span>•</span>
            <span>VPC GOVCLOUD DEPLOYABLE</span>
          </div>
        </div>
      </section>

      {/* Elegant Footer */}
      <footer className="border-t border-white/5 py-16 px-6 bg-slate-950/60 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="flex flex-col gap-4">
            <Logo size={32} />
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Enterprise-grade AI-powered medical RAG platform. Built to support critical clinical decision metrics, tracing reasoning directly back to source peer-reviewed indices.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-display font-bold text-white text-sm">Product Ecosystem</span>
            <a href="#features" className="hover:text-white transition-colors text-xs">Clinical Decision RAG</a>
            <a href="#how-it-works" className="hover:text-white transition-colors text-xs">Vector Index pipelines</a>
            <a href="#security" className="hover:text-white transition-colors text-xs">HIPAA Compliant Isolation</a>
            <button onClick={onLaunchPlatform} className="text-left hover:text-[#00E5FF] transition-colors text-xs text-[#00E5FF]">Interactive Console</button>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-display font-bold text-white text-sm">Clinical Quality</span>
            <a href="#" className="hover:text-white transition-colors text-xs">Zero-Hallucination Guardrails</a>
            <a href="#" className="hover:text-white transition-colors text-xs">PubMed Reference Engine</a>
            <a href="#" className="hover:text-white transition-colors text-xs">FDA Class II Standards</a>
            <a href="#" className="hover:text-white transition-colors text-xs">Institutional BAA Forms</a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-display font-bold text-white text-sm">Global Regulatory Standards</span>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-white/5 text-[10px] font-mono text-slate-300">HIPAA Compliant</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-white/5 text-[10px] font-mono text-slate-300">SOC2 Type II</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-white/5 text-[10px] font-mono text-slate-300">GDPR Compliant</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-white/5 text-[10px] font-mono text-slate-300">ISO 27001 Certified</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <span>&copy; 2026 MedIntel AI Corp. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Charter</a>
            <a href="#" className="hover:text-slate-400 transition-colors">EHR Terms of Use</a>
            <a href="#" className="hover:text-slate-400 transition-colors">BAA Addendum</a>
          </div>
          <span className="text-[10px] font-mono text-slate-600 max-w-sm text-right leading-relaxed hidden lg:block">
            DISCLAIMER: MedIntel AI is a clinical retrieval support tool designed for licensed healthcare professionals. It does not provide direct diagnosis or replace clinical judgment.
          </span>
        </div>
      </footer>

    </div>
  );
}
