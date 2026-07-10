import { getSupabaseClient } from './supabase';
import { supabaseSim } from './supabaseSim';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker source using CDN to make it extremely reliable in browser contexts
// Using @ts-ignore in case there are missing type definitions for the worker properties
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.js`;

/**
 * Document Processing Service
 * 
 * This service acts as the central orchestrator for processing uploaded documents.
 * It is structured modularly with placeholder stages so that each stage
 * (validation, extraction, chunking, embeddings, and vector storage) can later
 * be implemented independently.
 */

/**
 * Helper to extract text from a PDF's ArrayBuffer using pdfjs-dist.
 */
async function extractTextFromPdfBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (err) {
    console.error('[DocumentProcessor] Failed to extract text from PDF buffer:', err);
    throw err;
  }
}

/**
 * Stage 1: Validate Document
 * Verifies that the document exists in either the real Supabase database
 * or the local simulation store.
 * 
 * @param documentId The unique ID of the document to validate.
 */
export async function validateDocument(documentId: string): Promise<boolean> {
  console.log(`[DocumentProcessor] [Stage 1: validateDocument] Validating document existence: ${documentId}`);
  
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id')
        .eq('id', documentId)
        .maybeSingle();
        
      if (!error && data) {
        console.log(`[DocumentProcessor] Document validated successfully in real database.`);
        return true;
      }
    } catch (err) {
      console.warn(`[DocumentProcessor] Failed to validate document in real database:`, err);
    }
  }
  
  // Fallback to simulator validation
  const simState = supabaseSim.getRawState();
  const existsInSim = simState.documents.some((d: any) => d.id === documentId);
  if (existsInSim) {
    console.log(`[DocumentProcessor] Document validated successfully in simulator.`);
    return true;
  }
  
  console.error(`[DocumentProcessor] Document validation failed: document ID ${documentId} not found.`);
  return false;
}

/**
 * Stage 2: Extract Text
 * Performs OCR or direct text extraction from the document file.
 * If the document is not a PDF, returns "Unsupported document type".
 * Gracefully falls back to the simulator pipeline if no real backend is configured
 * or if parsing/retrieval fails.
 * 
 * @param documentId The unique ID of the document.
 * @returns The extracted raw text contents.
 */
export async function extractText(documentId: string): Promise<string> {
  console.log(`[DocumentProcessor] [Stage 2: extractText] Extracting text from document: ${documentId}`);
  
  const supabase = getSupabaseClient();
  
  if (supabase) {
    try {
      // 1. Fetch document metadata from real database
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();
        
      if (docError || !doc) {
        console.warn(`[DocumentProcessor] Document metadata not found in real DB for: ${documentId}. Trying simulator fallback.`);
      } else {
        // 2. Validate if it's a PDF
        const mimeType = (doc.mime_type || '').toLowerCase();
        const filename = (doc.original_filename || doc.title || '').toLowerCase();
        const isPdf = mimeType.includes('pdf') || filename.endsWith('.pdf');
        
        if (!isPdf) {
          console.warn(`[DocumentProcessor] Document ${documentId} is not a PDF (mime_type: ${mimeType}, title: ${doc.title}). Returning unsupported type.`);
          return "Unsupported document type";
        }
        
        // 3. Download the actual PDF from storage bucket
        console.log(`[DocumentProcessor] Downloading PDF from storage path: ${doc.storage_path}`);
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('medical-documents')
          .download(doc.storage_path);
          
        if (downloadError || !fileData) {
          console.error(`[DocumentProcessor] Failed to download PDF from storage for ${documentId}:`, downloadError);
          // Fall back to simulated text extraction rather than failing completely
        } else {
          // Convert Blob/File to ArrayBuffer and extract text
          const arrayBuffer = await fileData.arrayBuffer();
          const extractedText = await extractTextFromPdfBuffer(arrayBuffer);
          return extractedText;
        }
      }
    } catch (err) {
      console.error(`[DocumentProcessor] Error during real text extraction for document ${documentId}:`, err);
      // Fall back to simulator
    }
  }

  // --- Simulator / Fallback Pipeline ---
  console.log(`[DocumentProcessor] Running simulator/fallback text extraction for: ${documentId}`);
  
  const simState = supabaseSim.getRawState();
  const simDoc = simState.documents.find((d: any) => d.id === documentId);
  
  if (simDoc) {
    // Validate if simulated document is a PDF
    const simFileType = (simDoc.file_type || '').toLowerCase();
    const simTitle = (simDoc.title || '').toLowerCase();
    const isSimPdf = simFileType.includes('pdf') || simTitle.endsWith('.pdf');
    
    if (!isSimPdf) {
      console.warn(`[DocumentProcessor] Simulated document ${documentId} is not a PDF (file_type: ${simDoc.file_type}, title: ${simDoc.title}). Returning unsupported type.`);
      return "Unsupported document type";
    }
    
    // Return high-fidelity detailed simulated medical text extract
    return `[Simulated High-Fidelity PDF Text Extraction for: ${simDoc.title}]
Organization Context: ${simDoc.organization_id}
Document Reference ID: ${simDoc.id}
Patient Reference ID: ${simDoc.patientId || 'N/A'}
Compliance Metric: ${simDoc.compliance || 'HIPAA Compliant'}
Classification Category: ${simDoc.category || 'Clinical Guidelines'}
Document Description: ${simDoc.description || 'No description provided.'}
Tags/Keywords: ${(simDoc.tags || []).join(', ')}
Date Uploaded: ${simDoc.date}
File Size: ${simDoc.size}

----- CLINICAL REPORT BODY -----
Subject: Diagnostic and Clinical Analysis Report
Status: Verified by ${simDoc.uploaded_by || 'Staff MD'}
Summary:
This clinical record represents a structured document mapping critical patient indicators, renal clearances, and diagnostic evaluations. Let this text segment serve as the downstream semantic corpus for RAG chunking pipelines, embedding generation, and secure vector alignment.
`;
  }
  
  return "Unsupported document type";
}

/**
 * Stage 3: Chunk Document
 * Splits the extracted text into semantically coherent segments/chunks.
 * 
 * @param text The raw extracted text.
 * @returns Array of text chunks.
 */
export async function chunkDocument(text: string): Promise<string[]> {
  console.log(`[DocumentProcessor] [Stage 3: chunkDocument] Chunking text. Characters input: ${text.length}`);
  // Placeholder implementation - returns a single chunk for now
  return [text];
}

/**
 * Stage 4: Generate Embeddings
 * Vectorizes each text chunk using an embedding model.
 * 
 * @param chunks The text chunks to vectorize.
 * @returns Array of vectors representing each chunk.
 */
export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  console.log(`[DocumentProcessor] [Stage 4: generateEmbeddings] Generating embeddings for ${chunks.length} chunk(s)`);
  // Placeholder implementation - returns a dummy 1536-dimensional vector for each chunk
  return chunks.map(() => Array.from({ length: 1536 }, () => Math.random()));
}

/**
 * Stage 5: Store Vectors
 * Stores the generated embeddings and raw chunk metadata in the vector database.
 * 
 * @param documentId The unique ID of the document.
 * @param chunks The raw text chunks.
 * @param vectors The corresponding vectors.
 */
export async function storeVectors(documentId: string, chunks: string[], vectors: number[][]): Promise<boolean> {
  console.log(`[DocumentProcessor] [Stage 5: storeVectors] Storing ${vectors.length} vectors and chunks for document: ${documentId}`);
  // Placeholder implementation - always returns true for now
  return true;
}

/**
 * Orchestrates the full document processing pipeline.
 * Runs each stage sequentially and handles logging/errors.
 * 
 * @param documentId The unique ID of the document to process.
 * @returns A promise resolving to a boolean indicating overall success.
 */
export async function processDocument(documentId: string): Promise<boolean> {
  console.log(`[DocumentProcessor] Starting processing pipeline for document ID: ${documentId}`);
  
  try {
    // Stage 1: Validation
    const isValid = await validateDocument(documentId);
    if (!isValid) {
      console.error(`[DocumentProcessor] Validation failed for document: ${documentId}`);
      return false;
    }

    // Stage 2: Text Extraction
    const rawText = await extractText(documentId);
    console.log(`[DocumentProcessor] Extracted text length: ${rawText.length}`);

    // If it's an unsupported document type, we log it and return false gracefully without crashing
    if (rawText === "Unsupported document type") {
      console.warn(`[DocumentProcessor] Document ${documentId} is of unsupported type or could not be extracted.`);
      return false;
    }

    // Stage 3: Text Chunking
    const chunks = await chunkDocument(rawText);
    console.log(`[DocumentProcessor] Document split into ${chunks.length} chunks`);

    // Stage 4: Embeddings Generation
    const embeddings = await generateEmbeddings(chunks);
    console.log(`[DocumentProcessor] Generated ${embeddings.length} embeddings`);

    // Stage 5: Vector Storage
    const storageSuccess = await storeVectors(documentId, chunks, embeddings);
    if (!storageSuccess) {
      console.error(`[DocumentProcessor] Failed to store vectors for document: ${documentId}`);
      return false;
    }

    console.log(`[DocumentProcessor] Pipeline completed successfully for document: ${documentId}`);
    return true;

  } catch (error) {
    console.error(`[DocumentProcessor] Error processing document ${documentId}:`, error);
    return false;
  }
}
