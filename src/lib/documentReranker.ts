import { RetrievalResult } from './documentRetrieval';

/**
 * Reranking options parameterizing weights and tuning criteria.
 */
export interface RerankingOptions {
  query: string;
  semanticWeight?: number;  // Default: 0.50
  keywordWeight?: number;   // Default: 0.30
  lengthWeight?: number;    // Default: 0.10
  metadataWeight?: number;  // Default: 0.10
  topK?: number;            // Default: 5
}

/**
 * Calculates a lexical overlap ratio between the query and target content.
 */
function calculateKeywordOverlap(query: string, content: string): number {
  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
  const cleanContent = content.toLowerCase().replace(/[^\w\s]/g, '');
  
  const queryWords = new Set(
    cleanQuery.split(/\s+/).filter(word => word.length > 2)
  );
  const contentWords = new Set(
    cleanContent.split(/\s+/).filter(word => word.length > 2)
  );
  
  if (queryWords.size === 0) return 0.0;
  
  let matchCount = 0;
  queryWords.forEach(word => {
    if (contentWords.has(word)) {
      matchCount++;
    }
  });
  
  return matchCount / queryWords.size;
}

/**
 * Computes a sweet-spot score based on character length.
 * Shorter snippets lack context; excessive blocks dilute density.
 * Optimal size: 300 to 1000 characters.
 */
function calculateLengthScore(content: string): number {
  const len = content.length;
  if (len < 50) return 0.1;
  if (len >= 300 && len <= 1000) return 1.0;
  if (len > 1000 && len <= 2000) return 0.7;
  if (len > 2000) return 0.4;
  // Gradual scale for shorter segments
  return 0.1 + (0.9 * (len - 50)) / 250;
}

/**
 * Scores the completeness and relevance of the chunk's metadata.
 */
function calculateMetadataScore(metadata: any): number {
  if (!metadata || typeof metadata !== 'object') return 0.0;
  
  let score = 0.0;
  
  // High-fidelity keys contribute to overall metadata quality
  if (metadata.source && String(metadata.source).trim().length > 0) score += 0.4;
  if (metadata.category && String(metadata.category).trim().length > 0) score += 0.3;
  if (metadata.patientId && String(metadata.patientId).trim().length > 0) score += 0.1;
  if (metadata.author || metadata.uploaded_by) score += 0.1;
  
  // Any extra metadata entries add minor value
  const keyCount = Object.keys(metadata).length;
  if (keyCount > 0) {
    score += Math.min(0.1, keyCount * 0.02);
  }
  
  return Math.min(1.0, score);
}

/**
 * Performs a hybrid, multi-attribute retrieval reranking on semantic matches.
 * Refines raw cosine similarity scores with keyword checks, chunk structures,
 * and metadata quality checks to deliver optimal medical grounding.
 * 
 * @param chunks The array of semantically retrieved document chunks (Top-20).
 * @param options Grounding parameters and weight preferences.
 * @returns Sorted top-K reranked chunks with recalculated similarity/ranking scores.
 */
export function rerankChunks(
  chunks: RetrievalResult[],
  options: RerankingOptions
): RetrievalResult[] {
  const query = options.query;
  const semanticW = options.semanticWeight ?? 0.50;
  const keywordW = options.keywordWeight ?? 0.30;
  const lengthW = options.lengthWeight ?? 0.10;
  const metadataW = options.metadataWeight ?? 0.10;
  const topK = options.topK ?? 5;
  
  if (!chunks || chunks.length === 0) {
    return [];
  }
  
  console.log(`[DocumentReranker] Reranking ${chunks.length} chunks for query: "${query}"`);
  
  const reranked = chunks.map(chunk => {
    // 1. Semantic Similarity Component (provided directly from vector search)
    const semanticScore = Math.max(0, Math.min(1, chunk.similarity));
    
    // 2. Keyword Overlap Component
    const keywordScore = calculateKeywordOverlap(query, chunk.content);
    
    // 3. Length Quality Component
    const lengthScore = calculateLengthScore(chunk.content);
    
    // 4. Metadata Completeness Component
    const metadataScore = calculateMetadataScore(chunk.metadata);
    
    // Weighted combination to determine normalized ranking score
    const finalScore =
      (semanticScore * semanticW) +
      (keywordScore * keywordW) +
      (lengthScore * lengthW) +
      (metadataScore * metadataW);
      
    console.log(`[DocumentReranker] Chunk (Doc ${chunk.document_id}, Index ${chunk.chunk_index}): ` +
      `Raw Similarity: ${semanticScore.toFixed(3)} | ` +
      `Keyword: ${keywordScore.toFixed(3)} | ` +
      `Length: ${lengthScore.toFixed(3)} | ` +
      `Metadata: ${metadataScore.toFixed(3)} | ` +
      `Weighted Score: ${finalScore.toFixed(3)}`
    );
    
    return {
      ...chunk,
      // Update similarity to store the final reranked score so citations/UI display the smart score
      similarity: finalScore
    };
  });
  
  // Sort by final combined score descending
  return reranked
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
