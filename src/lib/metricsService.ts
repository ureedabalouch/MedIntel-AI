import { supabaseSim } from './supabaseSim';
import { IngestionMetrics } from './documentProcessor';

export interface SystemMetrics {
  totalUploadedDocs: number;
  successfullyIndexedDocs: number;
  failedProcessingJobs: number;
  skippedDuplicateDocs: number;
  retryCounts: number;
  
  // Averages in MS
  avgProcessingDuration: number;
  avgExtractionDuration: number;
  avgChunkingDuration: number;
  avgEmbeddingDuration: number;
  avgVectorStorageDuration: number;
  avgRetrievalLatency: number;
  avgAIResponseLatency: number;

  // Active jobs
  activeProcessingJobs: number;

  // Cache stats
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;

  // Performance rates
  successRate: number;
  failureRate: number;
}

export interface PipelineEvent {
  id: string;
  stageName: 
    | 'Validation' 
    | 'Text Extraction' 
    | 'Chunking' 
    | 'Embedding Generation' 
    | 'Vector Storage' 
    | 'Semantic Retrieval' 
    | 'Hybrid Search' 
    | 'Reranking' 
    | 'Gemini Generation';
  timestamp: string;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

export interface ErrorEvent {
  id: string;
  timestamp: string;
  stage: string;
  errorType: 'StageFailure' | 'RetryAttempt' | 'UnsupportedDocument' | 'DatabaseFailure' | 'GeminiAPIFailure' | 'Other';
  message: string;
  documentId?: string;
  metadata?: any;
}

const METRICS_STORAGE_KEY = 'medintel_operational_query_metrics';
const PIPELINE_STORAGE_KEY = 'medintel_pipeline_events_history';
const ERROR_STORAGE_KEY = 'medintel_error_events_history';

// Helper to load persistent query-time metrics
interface QueryMetricsState {
  retrieval_latencies: number[];
  ai_response_latencies: number[];
  cache_hits: number;
  cache_misses: number;
}

const DEFAULT_QUERY_METRICS: QueryMetricsState = {
  retrieval_latencies: [122, 108, 114, 131, 95], // seed data to avoid empty state
  ai_response_latencies: [1340, 1620, 1410, 1550, 1280],
  cache_hits: 24,
  cache_misses: 9,
};

function getQueryMetricsState(): QueryMetricsState {
  try {
    const data = localStorage.getItem(METRICS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(DEFAULT_QUERY_METRICS));
      return DEFAULT_QUERY_METRICS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.warn('[MetricsService] Failed to load query metrics, using default:', err);
    return DEFAULT_QUERY_METRICS;
  }
}

function saveQueryMetricsState(state: QueryMetricsState) {
  try {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[MetricsService] Failed to save query metrics:', err);
  }
}

/**
 * High-performance, asynchronous monitoring service.
 * Executing asynchronously using microtasks/setTimeout to ensure main thread is never delayed.
 */
export const metricsService = {
  
  /**
   * Records a retrieval (semantic search or hybrid search) event latency
   */
  recordRetrieval(searchType: 'semantic' | 'hybrid', durationMs: number, success: boolean) {
    setTimeout(() => {
      try {
        // Save query metrics
        const state = getQueryMetricsState();
        state.retrieval_latencies.push(durationMs);
        if (state.retrieval_latencies.length > 100) {
          state.retrieval_latencies.shift();
        }
        saveQueryMetricsState(state);

        // Save pipeline event
        this.addPipelineEvent({
          id: `pe-${Math.random().toString(36).substring(2, 11)}`,
          stageName: searchType === 'hybrid' ? 'Hybrid Search' : 'Semantic Retrieval',
          timestamp: new Date().toISOString(),
          durationMs,
          success,
          metadata: { searchType }
        });

        if (!success) {
          this.recordError(
            searchType === 'hybrid' ? 'Hybrid Search' : 'Semantic Retrieval',
            'DatabaseFailure',
            `Search query failed to respond within limits.`
          );
        }
      } catch (err) {
        console.error('[MetricsService] Error recording retrieval latency:', err);
      }
    }, 0);
  },

  /**
   * Records a Gemini AI text generation event latency
   */
  recordAIResponse(durationMs: number, success: boolean, errorMessage?: string) {
    setTimeout(() => {
      try {
        const state = getQueryMetricsState();
        state.ai_response_latencies.push(durationMs);
        if (state.ai_response_latencies.length > 100) {
          state.ai_response_latencies.shift();
        }
        saveQueryMetricsState(state);

        this.addPipelineEvent({
          id: `pe-${Math.random().toString(36).substring(2, 11)}`,
          stageName: 'Gemini Generation',
          timestamp: new Date().toISOString(),
          durationMs,
          success,
          errorMessage
        });

        if (!success) {
          this.recordError(
            'Gemini Generation',
            'GeminiAPIFailure',
            errorMessage || 'Gemini response generation failed.'
          );
        }
      } catch (err) {
        console.error('[MetricsService] Error recording AI response latency:', err);
      }
    }, 0);
  },

  /**
   * Records a reranking event latency
   */
  recordRerank(durationMs: number, success: boolean) {
    setTimeout(() => {
      this.addPipelineEvent({
        id: `pe-${Math.random().toString(36).substring(2, 11)}`,
        stageName: 'Reranking',
        timestamp: new Date().toISOString(),
        durationMs,
        success
      });
    }, 0);
  },

  /**
   * Records a cache hit
   */
  recordCacheHit() {
    setTimeout(() => {
      try {
        const state = getQueryMetricsState();
        state.cache_hits++;
        saveQueryMetricsState(state);
      } catch (err) {
        console.error('[MetricsService] Error recording cache hit:', err);
      }
    }, 0);
  },

  /**
   * Records a cache miss
   */
  recordCacheMiss() {
    setTimeout(() => {
      try {
        const state = getQueryMetricsState();
        state.cache_misses++;
        saveQueryMetricsState(state);
      } catch (err) {
        console.error('[MetricsService] Error recording cache miss:', err);
      }
    }, 0);
  },

  /**
   * Records an explicit operational error
   */
  recordError(stage: string, errorType: ErrorEvent['errorType'], message: string, documentId?: string, metadata?: any) {
    setTimeout(() => {
      try {
        const errors = this.getErrorHistory();
        const newError: ErrorEvent = {
          id: `err-${Math.random().toString(36).substring(2, 11)}`,
          timestamp: new Date().toISOString(),
          stage,
          errorType,
          message,
          documentId,
          metadata
        };
        errors.unshift(newError);
        localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors.slice(0, 100)));
      } catch (err) {
        console.error('[MetricsService] Error recording error log:', err);
      }
    }, 0);
  },

  /**
   * Adds a generic pipeline event to history
   */
  addPipelineEvent(event: PipelineEvent) {
    try {
      const history = this.getPipelineHistory();
      history.unshift(event);
      localStorage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify(history.slice(0, 200)));
    } catch (err) {
      console.warn('[MetricsService] Failed to save pipeline event:', err);
    }
  },

  /**
   * Gets the pipeline analytics history
   */
  getPipelineHistory(): PipelineEvent[] {
    try {
      const data = localStorage.getItem(PIPELINE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.warn('[MetricsService] Failed to read pipeline history:', err);
      return [];
    }
  },

  /**
   * Gets the error event logs
   */
  getErrorHistory(): ErrorEvent[] {
    try {
      const data = localStorage.getItem(ERROR_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.warn('[MetricsService] Failed to read error history:', err);
      return [];
    }
  },

  /**
   * Computes and returns the complete real-time SystemMetrics
   */
  getMetrics(): SystemMetrics {
    const qState = getQueryMetricsState();
    
    // 1. Read ingestion metrics from localStorage
    let rMetrics: IngestionMetrics[] = [];
    try {
      const existingStr = localStorage.getItem('rag_ingestion_metrics');
      rMetrics = existingStr ? JSON.parse(existingStr) : [];
    } catch (err) {
      console.warn('[MetricsService] Failed to load RAG ingestion metrics:', err);
    }

    // 2. Read raw state from supabaseSim to calculate active/successful/failed jobs and uploads
    const simState = supabaseSim.getRawState();
    const documents = simState.documents || [];
    const jobs = simState.processing_jobs || [];

    const totalUploadedDocs = documents.length;
    const successfullyIndexedDocs = documents.filter(d => d.status === 'Ready' || (d.status as string) === 'indexed').length;
    const failedProcessingJobs = jobs.filter(j => j.status === 'failed').length;
    const activeProcessingJobs = jobs.filter(j => j.status === 'queued' || j.status === 'indexing' || j.status === 'running' || j.status === 'started').length;

    // Skipped duplicates: scan jobs and logs
    const skippedDuplicateDocs = jobs.filter(j => j.status === 'skipped' || (j.current_step && j.current_step.includes('Skipped'))).length;

    // Gather retries from ingestion metrics
    let totalRetries = 0;
    rMetrics.forEach(m => {
      if (m.diagnostics) {
        // Count any failed diagnostic stages or stages with retry messages
        m.diagnostics.forEach(d => {
          if (d.status === 'failed') {
            totalRetries++;
          }
        });
      }
    });

    // Ingestion average durations
    const completedIngestion = rMetrics.filter(m => m.total_duration_ms > 0);
    const count = completedIngestion.length || 1;

    let totalExtraction = 0, countExtraction = 0;
    let totalChunking = 0, countChunking = 0;
    let totalEmbedding = 0, countEmbedding = 0;
    let totalStorage = 0, countStorage = 0;
    let sumProcessing = 0;

    completedIngestion.forEach(m => {
      sumProcessing += m.total_duration_ms;
      if (m.extraction_duration_ms) { totalExtraction += m.extraction_duration_ms; countExtraction++; }
      if (m.chunking_duration_ms) { totalChunking += m.chunking_duration_ms; countChunking++; }
      if (m.embedding_duration_ms) { totalEmbedding += m.embedding_duration_ms; countEmbedding++; }
      if (m.storage_duration_ms) { totalStorage += m.storage_duration_ms; countStorage++; }
    });

    // Average retrieval and AI response latencies
    const avgRetrieval = qState.retrieval_latencies.reduce((a, b) => a + b, 0) / (qState.retrieval_latencies.length || 1);
    const avgAIResponse = qState.ai_response_latencies.reduce((a, b) => a + b, 0) / (qState.ai_response_latencies.length || 1);

    // Cache metrics
    const cacheHits = qState.cache_hits;
    const cacheMisses = qState.cache_misses;
    const cacheHitRate = cacheHits + cacheMisses > 0 
      ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100)
      : 72; // default seed hit rate

    // Rates
    const totalJobs = successfullyIndexedDocs + failedProcessingJobs + skippedDuplicateDocs;
    const successRate = totalJobs > 0 
      ? Math.round((successfullyIndexedDocs / totalJobs) * 100) 
      : 100;
    const failureRate = totalJobs > 0 
      ? Math.round((failedProcessingJobs / totalJobs) * 100) 
      : 0;

    return {
      totalUploadedDocs,
      successfullyIndexedDocs,
      failedProcessingJobs,
      skippedDuplicateDocs,
      retryCounts: totalRetries,
      avgProcessingDuration: sumProcessing > 0 ? Math.round(sumProcessing / count) : 4200, // seed fallback
      avgExtractionDuration: countExtraction > 0 ? Math.round(totalExtraction / countExtraction) : 1200,
      avgChunkingDuration: countChunking > 0 ? Math.round(totalChunking / countChunking) : 350,
      avgEmbeddingDuration: countEmbedding > 0 ? Math.round(totalEmbedding / countEmbedding) : 1850,
      avgVectorStorageDuration: countStorage > 0 ? Math.round(totalStorage / countStorage) : 800,
      avgRetrievalLatency: Math.round(avgRetrieval),
      avgAIResponseLatency: Math.round(avgAIResponse),
      activeProcessingJobs,
      cacheHits,
      cacheMisses,
      cacheHitRate,
      successRate,
      failureRate
    };
  },

  /**
   * Clears all system metrics and histories
   */
  clearAllMetrics() {
    try {
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify({
        retrieval_latencies: [],
        ai_response_latencies: [],
        cache_hits: 0,
        cache_misses: 0
      }));
      localStorage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify([]));
    } catch (err) {
      console.warn('[MetricsService] Failed to clear metrics storage:', err);
    }
  }
};
