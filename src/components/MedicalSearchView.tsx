import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Sliders,
  Database,
  Globe,
  FileText,
  Filter,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';

interface SearchResult {
  title: string;
  source: string;
  authors: string;
  date: string;
  similarity: number;
  snippet: string;
  tags: string[];
}

export default function MedicalSearchView() {
  const [query, setQuery] = useState('');
  const [similarityThreshold, setSimilarityThreshold] = useState(82);
  const [anatomyWeight, setAnatomyWeight] = useState(70);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const mockArticles: SearchResult[] = [
    {
      title: 'Anticoagulant Outcomes in Moderate-to-Severe Chronic Kidney Disease',
      source: 'The Lancet Oncology & Cardiology Quarterly',
      authors: 'Lin S., Henderson P., Vance R.',
      date: 'March 2025',
      similarity: 94.2,
      snippet: 'Comparing Apixaban (Eliquis) to standard Warfarin parameters in individuals with estimated GFR levels of 15 to 30 mL/min. Patient audits indicate a 34% drop in minor intracranial bleeding when adjusted for pharmacogenetic hepatic metabolisms.',
      tags: ['Nephrology', 'Anticoagulants', 'GFR']
    },
    {
      title: 'Renal Clearance of Factor Xa Inhibitors and Atrial Fibrillation Management',
      source: 'American Journal of Medicine and Hematology',
      authors: 'Rodriguez J., Miller K.',
      date: 'December 2024',
      similarity: 88.7,
      snippet: 'Evaluating safety levels of low-dosage Rivaroxaban and Apixaban. Renal excretion rates of Factor Xa inhibitors are closely monitored. Findings validate clinical reliance on Hepatic CYP3A4 bypass pathways in patients showing elevated Creatinine.',
      tags: ['Pharmacology', 'Cardiology', 'Renal Excretion']
    },
    {
      title: 'Calciphylaxis Hazards Associated with Vitamin K Antagonists (Warfarin)',
      source: 'Global Renal Disease Archives',
      authors: 'Chen Y., Tanaka M.',
      date: 'September 2024',
      similarity: 83.1,
      snippet: 'Chronic oral anticoagulant treatments with Coumadin block Gla proteins, leading to accelerated systemic vascular calcifications in end-stage chronic kidney disease, triggering calciphylaxis in patients with diabetic comorbidities.',
      tags: ['Calciphylaxis', 'Coumadin', 'Dialysis']
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    // Filter results based on similarity threshold
    const filtered = mockArticles.filter((item) => item.similarity >= similarityThreshold);
    setResults(filtered);
  };

  return (
    <div className="flex flex-col gap-8 relative z-10" id="medical-search-root">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>CONSOLE</span>
          <span>/</span>
          <span className="text-[#00E5FF]">SEMANTIC VECTOR SEARCH</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white">
          Clinical Semantic Engine
        </h1>
        <p className="text-[#94A3B8] text-sm">
          Execute high-dimensional semantic queries across connected global indices and private institutional records.
        </p>
      </div>

      {/* Main Search Panel & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Search input and Results area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="font-display font-bold text-base text-white">Semantic Search Query</h3>
            
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Query medical databases (e.g. renal stroke anticoagulant safety limits)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 focus:border-[#00E5FF] focus:outline-none text-white text-xs sm:text-sm font-mono placeholder:text-slate-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-slate-950 font-display font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap"
              >
                Scan Vectors
              </button>
            </form>

            <div className="flex flex-wrap gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><Globe size={13} className="text-[#00E5FF]" /> PubMed Linked</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Database size={13} className="text-[#14F195]" /> Private Institutional Index</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><FileText size={13} className="text-[#7C3AED]" /> RxNorm & SNOMED CT</span>
            </div>
          </div>

          {/* Results list */}
          {hasSearched ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase">Matches Found: {results.length}</span>
                <span className="text-[10px] font-mono text-slate-500">THRESHOLD FILTER ACTIVE</span>
              </div>

              {results.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl flex flex-col items-center justify-center gap-3">
                  <div className="p-3.5 rounded-full bg-slate-950/40 text-slate-600 border border-white/5">
                    <Sliders size={28} />
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-300">No Articles Met the Semantic Cutoff</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting the similarity threshold slider in the right panel to return broader associative matches.
                  </p>
                </div>
              ) : (
                results.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="glass-panel p-6 rounded-2xl flex flex-col gap-4 hover:border-[#00E5FF]/20 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono bg-[#7C3AED]/15 border border-[#7C3AED]/20 text-[#7C3AED] px-2 py-0.5 rounded uppercase">
                          {item.source}
                        </span>
                        <h4 className="font-display font-bold text-base text-white mt-2 group-hover:text-[#00E5FF] transition-colors leading-snug">
                          {item.title}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono mt-1 block">Authors: {item.authors} • Published {item.date}</span>
                      </div>

                      <div className="flex flex-col items-end gap-1 text-right shrink-0">
                        <span className="text-[#14F195] font-mono font-bold text-sm">{item.similarity}%</span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Cosine Match</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-mono text-[11px] p-3 rounded-lg bg-slate-950/40 border border-white/5">
                      "{item.snippet}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                      <div className="flex gap-2">
                        {item.tags.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-slate-400">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <button className="text-[11px] text-[#00E5FF] hover:underline flex items-center gap-1 font-mono">
                        Retrieve Complete Paper
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            // Pre-search help state
            <div className="glass-panel p-16 text-center rounded-2xl flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-full bg-slate-950/40 text-[#00E5FF] border border-[#00E5FF]/10 glow-primary">
                <Search size={32} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">Interactive Semantic Index</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Type a clinical diagnostic concept (e.g., "renal stroke") and click "Scan Vectors" to query high-dimensional research indices.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Right Configuration parameters column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-white">
              <Sliders size={16} className="text-[#00E5FF]" />
              <h3 className="font-display font-bold text-sm">Hyperparameter Tuning</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically adjust search parameters to prioritize institutional databases vs international public journals.
            </p>

            {/* Slider 1: Semantic Threshold */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300">Min Similarity Index</span>
                <span className="text-[#00E5FF] font-bold">{similarityThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
              />
              <span className="text-[10px] text-slate-500 font-mono">Filters out low-confidence associative vector matches.</span>
            </div>

            {/* Slider 2: Anatomy Weight */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300">Anatomy Bias Weight</span>
                <span className="text-[#14F195] font-bold">{anatomyWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={anatomyWeight}
                onChange={(e) => setAnatomyWeight(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#14F195]"
              />
              <span className="text-[10px] text-slate-500 font-mono">Amplifies anatomical/physiological keyword matches in indexing.</span>
            </div>

            <div className="pt-3 border-t border-white/5 flex flex-col gap-2.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Active Indices</span>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#14F195]"></span>
                <span>PMC FullText Database (v15)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#14F195]"></span>
                <span>RxNorm Active Ingredient Tables</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF]"></span>
                <span>Private Hospital GFR/EHR Database</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
