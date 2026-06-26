import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Search,
  Upload,
  Filter,
  Trash2,
  Lock,
  CheckCircle,
  FileSpreadsheet,
  FileCode,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { DocumentItem } from '../types';

export default function DocumentsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSkeletons, setIsLoadingSkeletons] = useState(false);

  const initialDocs: DocumentItem[] = [
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
    },
    {
      id: 'DOC-8828',
      title: 'Pharmacogenomics_Warfarin_Metabolism_Cytochrome_Audit.xlsx',
      type: 'Clinical Notes',
      patientId: 'PAT-1102',
      date: '2026-06-23 16:55',
      size: '12.4 MB',
      status: 'Ready',
      compliance: 'HIPAA compliant'
    },
    {
      id: 'DOC-8827',
      title: 'Pediatric_Asthma_Treatment_History_Vance_7M.pdf',
      type: 'Clinical Notes',
      patientId: 'PAT-8831',
      date: '2026-06-23 13:20',
      size: '3.4 MB',
      status: 'Ready',
      compliance: 'HIPAA compliant'
    }
  ];

  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocs);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate short loader
    setIsLoadingSkeletons(true);
    setTimeout(() => {
      setIsLoadingSkeletons(false);
      const newDoc: DocumentItem = {
        id: `DOC-${Math.floor(Math.random() * 9000 + 1000)}`,
        title: 'Dropped_Patient_Medical_Record_Decrypted.pdf',
        type: 'Clinical Notes',
        patientId: 'PAT-NEW',
        date: '2026-06-26 14:42',
        size: '4.8 MB',
        status: 'Indexing',
        compliance: 'HIPAA compliant'
      };
      setDocuments([newDoc, ...documents]);
    }, 1500);
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const documentTypes = ['All', 'CT Scan', 'MRI', 'Lab Report', 'Genomic Data', 'Clinical Notes'];

  return (
    <div className="flex flex-col gap-8 relative z-10" id="documents-view-root">
      
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>CONSOLE</span>
          <span>/</span>
          <span className="text-[#00E5FF]">DOCUMENTS REPOSITORY</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white">
          Secure Medical Repository
        </h1>
        <p className="text-[#94A3B8] text-sm">
          Ingest, manage, and audit clinical patient documents securely mapped to vector indexes.
        </p>
      </div>

      {/* Multi-modal drag and drop uploader */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative p-8 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 overflow-hidden ${
          isDragging
            ? 'border-[#00E5FF] bg-[#00E5FF]/5 shadow-xl shadow-[#00E5FF]/5'
            : 'border-white/10 bg-slate-900/30 hover:border-white/20'
        }`}
        id="document-drag-drop-zone"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-radial-gradient from-[#00E5FF]/5 via-transparent to-transparent pointer-events-none"></div>
        
        <div className={`p-4 rounded-full border transition-all ${
          isDragging ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30' : 'bg-white/5 text-slate-400 border-white/5'
        }`}>
          <Upload size={24} className={isDragging ? 'animate-bounce' : ''} />
        </div>

        <div>
          <span className="font-display font-bold text-sm text-white block">
            Drag & Drop Clinical Records or MRI Bundles
          </span>
          <span className="text-xs text-[#94A3B8] mt-1 block">
            Supports DICOM, PDF, CSV, XLSX files (Max size: 500MB)
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded bg-[#00E5FF]/10 text-[#00E5FF] text-[10px] font-mono font-semibold">
          <Lock size={12} />
          AES-256 STATE CRYPTO ENCRYPTED & CLOSED ENVIRONMENT
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search records by title or patient ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 hover:border-white/20 focus:border-[#00E5FF] focus:outline-none text-white text-xs font-mono placeholder:text-slate-500"
          />
        </div>

        {/* Horizontal Type Filter */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {documentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap cursor-pointer ${
                selectedType === type
                  ? 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/30'
                  : 'bg-slate-900/40 text-slate-400 border-white/5 hover:border-white/15'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeletons or Documents list */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        {isLoadingSkeletons ? (
          // Shimmer loading skeletons
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
              <span>INGEST_INDEXING_SEQUENCE...</span>
              <RefreshCw size={12} className="animate-spin" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-center p-3 rounded bg-white/5 animate-pulse">
                <div className="w-8 h-8 rounded bg-slate-700"></div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 w-1/3 bg-slate-700 rounded"></div>
                  <div className="h-2 w-1/4 bg-slate-700 rounded"></div>
                </div>
                <div className="h-4 w-12 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          // Elegant Empty State
          <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-slate-950/40 text-slate-600 border border-white/5">
              <FolderOpen size={36} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">No Clinical Records Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                We couldn't find any documents matching your current filter. Drag and drop file packages above to dynamically index a new clinical set.
              </p>
            </div>
          </div>
        ) : (
          // Document Grid table
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs" id="documents-table">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/20 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-semibold">Document Reference</th>
                  <th className="p-4 font-semibold">Classification</th>
                  <th className="p-4 font-semibold">Patient Reference</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Ingestion Date</th>
                  <th className="p-4 font-semibold text-right">Size</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-medium text-white max-w-[240px] truncate">
                      <div className="flex items-center gap-2.5">
                        <FileText size={15} className="text-[#00E5FF] shrink-0" />
                        <span className="truncate">{doc.title}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-950/50 border border-white/5 text-[10px] text-slate-300">
                        {doc.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{doc.patientId}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        doc.status === 'Ready'
                          ? 'bg-[#14F195]/10 text-[#14F195]'
                          : 'bg-amber-400/10 text-amber-400'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          doc.status === 'Ready' ? 'bg-[#14F195]' : 'bg-amber-400 animate-pulse'
                        }`}></span>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">{doc.date}</td>
                    <td className="p-4 text-right font-mono text-slate-400">{doc.size}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded bg-slate-950/20 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Deregister Document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
