import { RetrievalResult } from './documentRetrieval';

// Global memory caches
const queryEmbeddingsCache = new Map<string, number[]>();
const semanticSearchCache = new Map<string, { timestamp: number; data: RetrievalResult[]; version: string }>();
const hybridSearchCache = new Map<string, { timestamp: number; data: RetrievalResult[]; version: string }>();
const rerankCache = new Map<string, { timestamp: number; data: RetrievalResult[]; version: string }>();

// TTL for caches: 5 minutes (300,000ms)
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Gets the current document index version to detect index changes.
 */
function getDocIndexVersion(): string {
  try {
    return localStorage.getItem('medintel_doc_index_version') || 'default-version';
  } catch (err) {
    return 'fallback-version';
  }
}

/**
 * Invalidates retrieval caches by writing a new document index version to localStorage
 * and clearing the cache maps.
 */
export function invalidateRetrievalCache() {
  console.log('[RetrievalCache] Invalidating all retrieval caches due to document index change.');
  try {
    localStorage.setItem('medintel_doc_index_version', Date.now().toString());
  } catch (err) {
    console.warn('[RetrievalCache] Failed to write new doc index version to localStorage:', err);
  }
  semanticSearchCache.clear();
  hybridSearchCache.clear();
  rerankCache.clear();
}

/**
 * Get cached query embedding. Query embeddings are persistent across document index changes
 * since they are independent of document contents.
 */
export function getCachedQueryEmbedding(query: string): number[] | null {
  const normalized = query.trim().toLowerCase();
  return queryEmbeddingsCache.get(normalized) || null;
}

/**
 * Cache query embedding.
 */
export function setCachedQueryEmbedding(query: string, embedding: number[]) {
  const normalized = query.trim().toLowerCase();
  queryEmbeddingsCache.set(normalized, embedding);
}

/**
 * Gets cached semantic search results if valid and within TTL.
 */
export function getCachedSemanticSearch(
  query: string,
  options: any
): RetrievalResult[] | null {
  const version = getDocIndexVersion();
  const key = `${version}::${options.organizationId}::${options.documentId || ''}::${options.matchThreshold ?? 0}::${options.matchCount ?? 5}::${query.trim().toLowerCase()}`;
  
  const cached = semanticSearchCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL_MS || cached.version !== version) {
    semanticSearchCache.delete(key);
    return null;
  }
  
  console.log('[RetrievalCache] Hit semantic search cache for:', query);
  return cached.data;
}

/**
 * Caches semantic search results.
 */
export function setCachedSemanticSearch(
  query: string,
  options: any,
  data: RetrievalResult[]
) {
  const version = getDocIndexVersion();
  const key = `${version}::${options.organizationId}::${options.documentId || ''}::${options.matchThreshold ?? 0}::${options.matchCount ?? 5}::${query.trim().toLowerCase()}`;
  
  semanticSearchCache.set(key, {
    timestamp: Date.now(),
    data,
    version
  });
}

/**
 * Gets cached hybrid search candidate pools if valid and within TTL.
 */
export function getCachedHybridSearch(
  query: string,
  options: any
): RetrievalResult[] | null {
  const version = getDocIndexVersion();
  const key = `${version}::${options.organizationId}::${options.documentId || ''}::${options.semanticWeight ?? 0.7}::${options.ftsWeight ?? 0.3}::${options.matchCount ?? 5}::${query.trim().toLowerCase()}`;
  
  const cached = hybridSearchCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL_MS || cached.version !== version) {
    hybridSearchCache.delete(key);
    return null;
  }
  
  console.log('[RetrievalCache] Hit hybrid search cache for:', query);
  return cached.data;
}

/**
 * Caches hybrid search candidate pools.
 */
export function setCachedHybridSearch(
  query: string,
  options: any,
  data: RetrievalResult[]
) {
  const version = getDocIndexVersion();
  const key = `${version}::${options.organizationId}::${options.documentId || ''}::${options.semanticWeight ?? 0.7}::${options.ftsWeight ?? 0.3}::${options.matchCount ?? 5}::${query.trim().toLowerCase()}`;
  
  hybridSearchCache.set(key, {
    timestamp: Date.now(),
    data,
    version
  });
}

/**
 * Gets cached intelligent reranking outputs if valid and within TTL.
 */
export function getCachedRerank(
  query: string,
  chunks: RetrievalResult[],
  options: any
): RetrievalResult[] | null {
  const version = getDocIndexVersion();
  const chunksFingerprint = chunks.map(c => `${c.document_id}:${c.chunk_index}:${c.similarity.toFixed(4)}`).join('|');
  const key = `${version}::${options.semanticWeight ?? 0.5}::${options.keywordWeight ?? 0.3}::${options.lengthWeight ?? 0.1}::${options.metadataWeight ?? 0.1}::${options.topK ?? 5}::${query.trim().toLowerCase()}::${chunksFingerprint}`;
  
  const cached = rerankCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL_MS || cached.version !== version) {
    rerankCache.delete(key);
    return null;
  }
  
  console.log('[RetrievalCache] Hit rerank cache for query:', query);
  return cached.data;
}

/**
 * Caches intelligent reranking outputs.
 */
export function setCachedRerank(
  query: string,
  chunks: RetrievalResult[],
  options: any,
  data: RetrievalResult[]
) {
  const version = getDocIndexVersion();
  const chunksFingerprint = chunks.map(c => `${c.document_id}:${c.chunk_index}:${c.similarity.toFixed(4)}`).join('|');
  const key = `${version}::${options.semanticWeight ?? 0.5}::${options.keywordWeight ?? 0.3}::${options.lengthWeight ?? 0.1}::${options.metadataWeight ?? 0.1}::${options.topK ?? 5}::${query.trim().toLowerCase()}::${chunksFingerprint}`;
  
  rerankCache.set(key, {
    timestamp: Date.now(),
    data,
    version
  });
}
