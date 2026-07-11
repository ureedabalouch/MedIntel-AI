import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { supabaseSim } from './supabaseSim';
import { GoogleGenAI } from '@google/genai';
import { RetrievalResult, SearchOptions } from './documentRetrieval';
import { getCachedQueryEmbedding, setCachedQueryEmbedding, getCachedHybridSearch, setCachedHybridSearch } from './retrievalCache';
import { metricsService } from './metricsService';

export interface HybridSearchOptions extends SearchOptions {
  semanticWeight?: number; // default: 0.7
  ftsWeight?: number;      // default: 0.3
}

/**
 * Helper to retrieve the Gemini API key from all possible environment locations.
 */
const getGeminiApiKey = (): string | undefined => {
  if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (import.meta.env && import.meta.env.GEMINI_API_KEY) {
    return import.meta.env.GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return undefined;
};

let aiInstance: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  try {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    return aiInstance;
  } catch (err) {
    console.error('[HybridSearch] Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

/**
 * Generates a high-fidelity, deterministic 1536-dimensional simulated embedding.
 */
function generateDeterministicEmbedding(text: string): number[] {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  
  const sRandom = (seed: number) => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  const embedding: number[] = [];
  let seed = Math.abs(hash) || 42;
  for (let j = 0; j < 1536; j++) {
    embedding.push(sRandom(seed + j));
  }
  
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (norm || 1));
}

/**
 * Helper to compute client-side cosine similarity.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Lexical keyword overlap calculation for simulated Full-Text Search.
 */
function calculateLexicalOverlap(query: string, content: string): number {
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const contentWords = content.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (queryWords.size === 0 || contentWords.length === 0) return 0.0;
  
  let matchCount = 0;
  for (const word of contentWords) {
    if (queryWords.has(word)) {
      matchCount++;
    }
  }
  
  return matchCount / Math.max(queryWords.size, 1);
}

/**
 * Generates an embedding for a search query using the Gemini API.
 */
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  const cached = getCachedQueryEmbedding(query);
  if (cached) {
    console.log('[HybridSearch] Reusing cached query embedding for:', query);
    return cached;
  }

  const ai = getGenAIClient();
  if (!ai) return null;
  
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: query,
    });
    
    const res = response as any;
    const values = res.embedding?.values || res.embeddings?.values || res.embeddings?.[0]?.values || res.embedding?.[0]?.values;
    if (values && Array.isArray(values) && values.length > 0) {
      setCachedQueryEmbedding(query, values);
      return values;
    }
    return null;
  } catch (err) {
    console.warn('[HybridSearch] Failed to generate real query embedding. Error:', err);
    return null;
  }
}

/**
 * Multi-tenant Hybrid Search Service.
 * Combines semantic vector similarity search (pgvector) and Full-Text lexical search (PostgreSQL FTS)
 * using weighted fusion (default 70% Semantic, 30% Full-Text Search).
 * 
 * Ensures strict security by filtering results on organization_id and optional document_id.
 * Falls back to deterministic simulated hybrid retrieval when offline.
 */
export async function searchHybridChunks(
  query: string,
  options: HybridSearchOptions
): Promise<RetrievalResult[]> {
  console.log(`[HybridSearch] Executing hybrid query: "${query}"`, options);
  
  const { organizationId, documentId } = options;
  const semanticWeight = options.semanticWeight ?? 0.70;
  const ftsWeight = options.ftsWeight ?? 0.30;
  const candidateLimit = 20; // Retrieve Top-20 candidates from both engines
  
  if (!query || query.trim() === '') {
    return [];
  }
  
  if (!organizationId) {
    console.warn('[HybridSearch] Aborting search: missing organizationId constraint.');
    return [];
  }

  const searchStartTime = Date.now();

  // Check cache (Requirement 2)
  const cachedResult = getCachedHybridSearch(query, options);
  if (cachedResult) {
    metricsService.recordCacheHit();
    metricsService.recordRetrieval('hybrid', Date.now() - searchStartTime, true);
    return cachedResult;
  }
  metricsService.recordCacheMiss();
  
  const supabase = getSupabaseClient();
  const ai = getGenAIClient();
  const isRealBackend = isSupabaseConfigured() && ai !== null;
  
  let queryVector: number[] | null = null;
  if (isRealBackend) {
    queryVector = await generateQueryEmbedding(query);
  }
  
  if (!isRealBackend || !queryVector) {
    queryVector = generateDeterministicEmbedding(query);
  }
  
  if (isRealBackend && supabase && queryVector) {
    try {
      console.log('[HybridSearch] Querying real database...');
      
      // Step 2: Semantic Search (Top-20 candidates)
      const semanticPromise = supabase.rpc('match_document_chunks', {
        query_embedding: queryVector,
        match_threshold: 0.0,
        match_count: candidateLimit,
        filter_organization_id: organizationId,
        filter_document_id: documentId || null
      });
      
      // Step 3: Full-Text Search (Top-20 candidates)
      const ftsPromise = supabase.rpc('fts_document_chunks', {
        query_text: query,
        match_count: candidateLimit,
        filter_organization_id: organizationId,
        filter_document_id: documentId || null
      });
      
      const [semanticRes, ftsRes] = await Promise.all([semanticPromise, ftsPromise]);
      
      if (semanticRes.error) {
        console.warn('[HybridSearch] Semantic RPC error:', semanticRes.error);
      }
      if (ftsRes.error) {
        console.warn('[HybridSearch] Full-text FTS RPC error:', ftsRes.error);
      }
      
      const semanticResults = semanticRes.data || [];
      const ftsResults = ftsRes.data || [];
      
      console.log(`[HybridSearch] Database matches retrieved: ${semanticResults.length} semantic, ${ftsResults.length} FTS`);
      
      // Step 4 & 5: Merge and Apply Weighted Fusion Strategy
      const mergedMap = new Map<string, { chunk: any; semanticScore: number; ftsRank: number }>();
      
      // Populate semantic results
      semanticResults.forEach((row: any) => {
        const key = `${row.document_id}::${row.chunk_index}`;
        mergedMap.set(key, {
          chunk: row,
          semanticScore: typeof row.similarity === 'number' ? row.similarity : 0.0,
          ftsRank: 0.0
        });
      });
      
      // Populate and combine FTS results
      ftsResults.forEach((row: any) => {
        const key = `${row.document_id}::${row.chunk_index}`;
        const rawRank = typeof row.rank === 'number' ? row.rank : 0.0;
        
        if (mergedMap.has(key)) {
          mergedMap.get(key)!.ftsRank = rawRank;
        } else {
          mergedMap.set(key, {
            chunk: row,
            semanticScore: 0.0,
            ftsRank: rawRank
          });
        }
      });
      
      // Normalize FTS ranks relative to the maximum rank in this result set
      const maxFtsRank = Math.max(...ftsResults.map((r: any) => typeof r.rank === 'number' ? r.rank : 0.0), 0.001);
      
      const fusedResults: RetrievalResult[] = [];
      
      mergedMap.forEach((val, key) => {
        const normSemantic = Math.max(0, Math.min(1, val.semanticScore));
        const normFts = val.ftsRank / maxFtsRank;
        
        // Calculate dynamic hybrid fusion score
        const hybridScore = (normSemantic * semanticWeight) + (normFts * ftsWeight);
        
        fusedResults.push({
          document_id: val.chunk.document_id,
          chunk_index: val.chunk.chunk_index,
          content: val.chunk.content,
          similarity: hybridScore, // Return combined hybrid score in similarity property
          metadata: val.chunk.metadata || {}
        });
      });
      
      // Sort descending by combined hybrid score
      fusedResults.sort((a, b) => b.similarity - a.similarity);
      setCachedHybridSearch(query, options, fusedResults);
      metricsService.recordRetrieval('hybrid', Date.now() - searchStartTime, true);
      return fusedResults;
      
    } catch (err) {
      console.warn('[HybridSearch] Real hybrid search failed, falling back to offline simulator.', err);
    }
  }
  
  // High-fidelity Simulator Fallback
  console.log('[HybridSearch] Performing simulated hybrid search...');
  try {
    const rawState = supabaseSim.getRawState();
    const allChunks = rawState.document_chunks || [];
    
    // Multi-tenant filter
    const filteredChunks = allChunks.filter((chunk: any) => {
      const matchOrg = chunk.organization_id === organizationId;
      const matchDoc = !documentId || chunk.document_id === documentId;
      return matchOrg && matchDoc;
    });
    
    // Simulate Semantic scores (cosine similarity)
    const semanticScoredList = filteredChunks.map((chunk: any) => {
      let score = 0.0;
      if (chunk.embedding && Array.isArray(chunk.embedding) && queryVector) {
        score = cosineSimilarity(queryVector, chunk.embedding);
      } else {
        score = calculateLexicalOverlap(query, chunk.content);
      }
      return { chunk, score };
    });
    
    // Retrieve Top-20 Semantic Chunks
    const topSemantic = semanticScoredList
      .sort((a, b) => b.score - a.score)
      .slice(0, candidateLimit);
      
    // Simulate FTS scores (keyword lexical overlap)
    const ftsScoredList = filteredChunks.map((chunk: any) => {
      const score = calculateLexicalOverlap(query, chunk.content);
      return { chunk, score };
    });
    
    // Retrieve Top-20 FTS Chunks
    const topFts = ftsScoredList
      .sort((a, b) => b.score - a.score)
      .slice(0, candidateLimit);
      
    // Merge & Dedup
    const mergedMap = new Map<string, { chunk: any; semanticScore: number; ftsRank: number }>();
    
    topSemantic.forEach(item => {
      const key = `${item.chunk.document_id}::${item.chunk.chunk_index}`;
      mergedMap.set(key, {
        chunk: item.chunk,
        semanticScore: item.score,
        ftsRank: 0.0
      });
    });
    
    topFts.forEach(item => {
      const key = `${item.chunk.document_id}::${item.chunk.chunk_index}`;
      if (mergedMap.has(key)) {
        mergedMap.get(key)!.ftsRank = item.score;
      } else {
        mergedMap.set(key, {
          chunk: item.chunk,
          semanticScore: 0.0,
          ftsRank: item.score
        });
      }
    });
    
    const maxFtsRank = Math.max(...topFts.map(item => item.score), 0.001);
    
    const fusedResults: RetrievalResult[] = [];
    
    mergedMap.forEach((val, key) => {
      const normSemantic = Math.max(0, Math.min(1, val.semanticScore));
      const normFts = val.ftsRank / maxFtsRank;
      const hybridScore = (normSemantic * semanticWeight) + (normFts * ftsWeight);
      
      fusedResults.push({
        document_id: val.chunk.document_id,
        chunk_index: val.chunk.chunk_index,
        content: val.chunk.content,
        similarity: hybridScore,
        metadata: val.chunk.metadata || {}
      });
    });
    
    fusedResults.sort((a, b) => b.similarity - a.similarity);
    console.log(`[HybridSearch] [Simulator] Returning ${fusedResults.length} hybrid-fused chunks.`);
    setCachedHybridSearch(query, options, fusedResults);
    metricsService.recordRetrieval('hybrid', Date.now() - searchStartTime, true);
    return fusedResults;
    
  } catch (err) {
    console.error('[HybridSearch] Simulator failure:', err);
    metricsService.recordRetrieval('hybrid', Date.now() - searchStartTime, false);
    return [];
  }
}
