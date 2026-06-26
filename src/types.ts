export type ViewType = 'landing' | 'dashboard' | 'documents' | 'assistant' | 'search' | 'analytics' | 'settings' | 'support';

export interface DocumentItem {
  id: string;
  title: string;
  type: 'MRI' | 'CT Scan' | 'Lab Report' | 'Genomic Data' | 'Clinical Notes';
  patientId: string;
  date: string;
  size: string;
  status: 'Ready' | 'Indexing' | 'Failed';
  compliance: 'HIPAA compliant' | 'GDPR compliant';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  category: 'RAG Query' | 'Doc Ingest' | 'Auth' | 'System';
  status: 'Success' | 'Warning' | 'Error';
}

export interface MetricCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  timeframe: string;
}
