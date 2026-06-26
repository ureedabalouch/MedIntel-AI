# MedIntel AI - API Interface Specification

This document details the planned API interface contracts required for full-stack integration of **MedIntel AI** features (Authentication, Multi-Tenant workspaces, Document chunking/RAG ingestion, and Chat).

---

## 1. Authentication Endpoints

Supabase handles primary client-side user sessions directly. For operations requiring server intervention:

### `POST /api/auth/register`
Creates profile context following successful authentication signup.
* **Payload:**
  ```json
  {
    "email": "doctor@hospital.org",
    "full_name": "Dr. Smith",
    "role": "Doctor"
  }
  ```
* **Response:**
  ```json
  {
    "status": "success",
    "profile": {
      "id": "uuid-string",
      "email": "doctor@hospital.org",
      "full_name": "Dr. Smith"
    }
  }
  ```

---

## 2. Ingestion & Document Processing Endpoints

### `POST /api/documents/upload`
Uploads files and schedules background chunking.
* **Headers:** `Content-Type: multipart/form-data`
* **Form Data:**
  * `file`: (Binary PDF stream)
  * `category_id`: `uuid`
  * `title`: `AHA Hypertension Guidelines.pdf`
* **Response:**
  ```json
  {
    "document_id": "doc-uuid-123",
    "job_id": "job-uuid-456",
    "status": "Pending",
    "message": "File uploaded successfully. Document processing job queued."
  }
  ```

### `GET /api/documents/jobs/:job_id`
Tracks processing status for the async ingestion pipeline.
* **Response:**
  ```json
  {
    "job_id": "job-uuid-456",
    "document_id": "doc-uuid-123",
    "current_status": "Chunking",
    "progress_percentage": 45,
    "current_step": "Parsing page 14 of 50...",
    "error_message": null
  }
  ```

---

## 3. RAG Semantic Query Endpoints

### `POST /api/chat/query`
Executes AI-assisted semantic generation with real-time sources referencing.
* **Payload:**
  ```json
  {
    "chat_session_id": "chat-uuid-111",
    "query": "Which dual-therapy compound is recommended for Stage 2 high blood pressure?"
  }
  ```
* **Response:**
  ```json
  {
    "message_id": "assistant-msg-uuid",
    "role": "assistant",
    "content": "According to the AHA Clinical Council, dual-therapy should begin with an ACE inhibitor or ARB combined with a CCB or thiazide diuretic...",
    "metadata": {
      "model": "gemini-1.5-pro",
      "citations": [
        {
          "document_title": "AHA_Hypertension_Guidelines_2026.pdf",
          "page_number": 3,
          "matched_context": "For Stage 2 Hypertension, initiate combination therapy with ACEi or ARB and CCB..."
        }
      ]
    }
  }
  ```
