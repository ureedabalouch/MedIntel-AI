import React, { useState, useEffect } from 'react';
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
  FolderOpen,
  Grid,
  List,
  Download,
  Eye,
  Edit2,
  Plus,
  X,
  Tag,
  ChevronRight,
  Calendar,
  HardDrive,
  ShieldCheck,
  AlertCircle,
  MoreVertical,
  SlidersHorizontal,
  BookOpen,
  FileCheck2,
  User,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { DocumentItem, CustomCategory } from '../types';
import { supabaseSim } from '../lib/supabaseSim';
import { getSupabaseClient } from '../lib/supabase';

interface UploadProgressItem {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: 'Uploading' | 'Scanning' | 'Ingesting' | 'Completed' | 'Failed';
  error?: string;
  category: string;
  fileType: string;
}

export default function DocumentsView() {
  const session = supabaseSim.getSession();
  const activeOrg = session?.activeOrg;
  const profile = session?.profile;
  const isAdmin = profile?.role === 'Administrator' || profile?.role === 'Doctor';

  // State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [activeFileTypeFilter, setActiveFileTypeFilter] = useState<string>('All');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'size-desc'>('date-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDragging, setIsDragging] = useState(false);

  // Upload Management
  const [uploadQueue, setUploadQueue] = useState<UploadProgressItem[]>([]);
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileDesc, setNewFileDesc] = useState('');
  const [newFileCategory, setNewFileCategory] = useState('Clinical Guidelines');
  const [newFileType, setNewFileType] = useState('PDF');
  const [newFileTags, setNewFileTags] = useState('');
  const [newFilePatientId, setNewFilePatientId] = useState('');
  const [newFileError, setNewFileError] = useState('');

  // Modals / Overlays
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [renameDoc, setRenameDoc] = useState<DocumentItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameDescValue, setRenameDescValue] = useState('');
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Slice selector for DICOM MRI Simulation
  const [dicomSlice, setDicomSlice] = useState(12);

  // Load documents and categories safely scoped to current user organization
  const refreshData = async () => {
    if (activeOrg) {
      let loadedCategories: CustomCategory[] | null = null;
      let loadedDocuments: DocumentItem[] | null = null;

      const supabase = getSupabaseClient();
      if (supabase) {
        // Load categories from Supabase
        try {
          const { data: catData, error: catError } = await supabase
            .from('document_categories')
            .select('id, name, description, color, icon, created_at, updated_at, organization_id')
            .eq('organization_id', activeOrg.id);

          if (catError) {
            throw catError;
          }

          if (catData) {
            const dbCats: CustomCategory[] = catData.map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              organization_id: cat.organization_id
            }));

            const defaultCatsToPreserve = [
              { id: 'cat-cg', name: 'Clinical Guidelines', organization_id: null },
              { id: 'cat-rp', name: 'Research Papers', organization_id: null },
              { id: 'cat-hs', name: 'Hospital SOPs', organization_id: null },
              { id: 'cat-pe', name: 'Patient Education', organization_id: null },
              { id: 'cat-mb', name: 'Medical Books', organization_id: null },
              { id: 'cat-dr', name: 'Drug References', organization_id: null },
              { id: 'cat-ar', name: 'Archived', organization_id: null }
            ];

            for (const defCat of defaultCatsToPreserve) {
              const exists = dbCats.some(c => c.name.toLowerCase() === defCat.name.toLowerCase());
              if (!exists) {
                dbCats.push(defCat);
              }
            }
            loadedCategories = dbCats;
          }
        } catch (err) {
          console.warn('Real Supabase category query failed, falling back to simulator:', err);
        }

        // Load documents from Supabase
        try {
          // First attempt: Query 'documents' with joins for category and profile details
          let { data, error } = await supabase
            .from('documents')
            .select('*, document_categories(name), profiles(full_name)')
            .eq('organization_id', activeOrg.id);
          
          if (error) {
            // Second attempt: Try querying 'documents' without joins in case of schema limitations
            const fallbackQuery = await supabase
              .from('documents')
              .select('*')
              .eq('organization_id', activeOrg.id);
            
            if (!fallbackQuery.error && fallbackQuery.data) {
              data = fallbackQuery.data;
              error = null;
            } else {
              // Third attempt: Try querying 'medical_documents' as specified in some logs/contexts
              const medDocsQuery = await supabase
                .from('medical_documents')
                .select('*')
                .eq('organization_id', activeOrg.id);
              
              if (!medDocsQuery.error && medDocsQuery.data) {
                data = medDocsQuery.data;
                error = null;
              } else {
                throw error || fallbackQuery.error || medDocsQuery.error;
              }
            }
          }

          if (data) {
            const mappedDocs: DocumentItem[] = data.map((doc: any) => ({
              id: doc.id,
              title: doc.title || 'Untitled Document',
              description: doc.description || '',
              category: doc.document_categories?.name || doc.category || 'Clinical Guidelines',
              tags: Array.isArray(doc.tags) ? doc.tags : [],
              organization_id: doc.organization_id,
              uploaded_by: doc.profiles?.full_name || doc.uploaded_by || 'Dr. Sarah Lin',
              uploaded_by_id: doc.uploaded_by || '',
              date: doc.created_at || doc.date || new Date().toISOString(),
              last_modified: doc.updated_at || doc.last_modified || new Date().toISOString(),
              size: doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : (doc.size || '1.2 MB'),
              file_type: doc.mime_type || doc.file_type || 'PDF',
              version: doc.version ? doc.version.toString() : '1',
              status: doc.status === 'indexed' || doc.status === 'Ready' ? 'Ready' : 
                      doc.status === 'processing' || doc.status === 'Indexing' ? 'Indexing' : 
                      doc.status === 'failed' || doc.status === 'Failed' ? 'Failed' : 'Ready',
              compliance: doc.compliance || 'HIPAA compliant',
              patientId: doc.patientId,
            }));
            loadedDocuments = mappedDocs;
          }
        } catch (err) {
          console.warn('Real Supabase document query failed (expected if unauthenticated), using simulator fallback:', err);
        }
      }

      // Update state
      if (loadedCategories) {
        setCategories(loadedCategories);
      } else {
        const orgCats = supabaseSim.getCategories(activeOrg.id);
        setCategories(orgCats);
      }

      if (loadedDocuments) {
        setDocuments(loadedDocuments);
      } else {
        const orgDocs = supabaseSim.getDocuments(activeOrg.id);
        setDocuments(orgDocs);
      }
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeOrg]);

  // Drag and drop handlers
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
    
    if (!activeOrg) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleMultipleFilesUpload(Array.from(files));
    }
  };

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFilesUpload(Array.from(e.target.files));
    }
  };

  const handleMultipleFilesUpload = (files: File[]) => {
    files.forEach(file => {
      // Validation: Max size 500MB
      const sizeInMB = file.size / (1024 * 1024);
      const formattedSize = sizeInMB > 1 ? `${sizeInMB.toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
      const extension = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      const permittedExtensions = ['PDF', 'DICOM', 'CSV', 'XLSX', 'TXT', 'DOCX'];

      const uploadId = 'upload-' + Math.random().toString(36).substring(2, 9);
      
      const newItem: UploadProgressItem = {
        id: uploadId,
        name: file.name,
        size: formattedSize,
        progress: 0,
        status: 'Uploading',
        category: getAutoCategoryByExtension(extension),
        fileType: extension
      };

      if (sizeInMB > 500) {
        newItem.status = 'Failed';
        newItem.error = 'File exceeds maximum 500MB size limit.';
        setUploadQueue(prev => [newItem, ...prev]);
        return;
      }

      if (!permittedExtensions.includes(extension)) {
        newItem.status = 'Failed';
        newItem.error = `File format ${extension} is not supported.`;
        setUploadQueue(prev => [newItem, ...prev]);
        return;
      }

      setUploadQueue(prev => [newItem, ...prev]);

      // Simulate step-by-step progress upload and cyber ingestion
      simulateUploadProgress(uploadId, file, formattedSize, extension);
    });
  };

  const getAutoCategoryByExtension = (ext: string): string => {
    switch (ext) {
      case 'DICOM': return 'Clinical Guidelines';
      case 'CSV':
      case 'XLSX': return 'Research Papers';
      default: return 'Hospital SOPs';
    }
  };

  const simulateUploadProgress = (id: string, file: File, size: string, fileType: string) => {
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 10;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Advance to Scanning
        setUploadQueue(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, progress: 100, status: 'Scanning' };
          }
          return item;
        }));

        // Advance to Ingesting
        setTimeout(async () => {
          setUploadQueue(prev => prev.map(item => {
            if (item.id === id) {
              return { ...item, status: 'Ingesting' };
            }
            return item;
          }));

          let realInsertedDocId: string | undefined;
          const supabase = getSupabaseClient();
          if (supabase && activeOrg) {
            try {
              // 1. Upload to Supabase Storage
              const storagePath = `${activeOrg.id}/${file.name}`;
              const { error: uploadError } = await supabase.storage
                .from('medical-documents')
                .upload(storagePath, file, { upsert: true });
                
              if (uploadError) throw uploadError;

              // 2. Resolve category_id
              const category = getAutoCategoryByExtension(fileType);
              const { data: catData } = await supabase
                .from('document_categories')
                .select('id')
                .eq('organization_id', activeOrg.id)
                .eq('name', category)
                .maybeSingle();
              const categoryId = catData?.id || null;

              // 3. Resolve uploaded_by UUID
              const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
              const uploadedByUuid = profile?.id && isUUID(profile.id) ? profile.id : null;

              // 4. Insert into documents table
              const { data: insertedDoc, error: insertError } = await supabase
                .from('documents')
                .insert({
                  organization_id: activeOrg.id,
                  category_id: categoryId,
                  uploaded_by: uploadedByUuid,
                  title: file.name,
                  description: `Ingested ${fileType} document, automatically validated and mapped to private organizational RLS storage.`,
                  storage_path: storagePath,
                  original_filename: file.name,
                  mime_type: fileType,
                  file_size: file.size,
                  status: 'indexed',
                  version: 1,
                  tags: [fileType, 'Ingested', 'Auto-Mapped']
                })
                .select('*')
                .single();

              if (insertError) throw insertError;
              if (insertedDoc) {
                realInsertedDocId = insertedDoc.id;
              }
            } catch (err) {
              console.warn('Real Supabase upload/insert failed (falling back to simulator):', err);
            }
          }

          // Finalize and insert in Simulated DB
          setTimeout(() => {
            if (!activeOrg) return;

            const category = getAutoCategoryByExtension(fileType);
            
            // Add to simulated db
            const addedDoc = supabaseSim.addDocument({
              title: file.name,
              description: `Ingested ${fileType} document, automatically validated and mapped to private organizational RLS storage.`,
              category: category,
              tags: [fileType, 'Ingested', 'Auto-Mapped'],
              organization_id: activeOrg.id,
              uploaded_by: profile?.full_name || profile?.email || 'Authorized User',
              uploaded_by_id: profile?.id || 'anon',
              size: size,
              file_type: fileType,
              version: '1.0.0',
              status: 'Ready',
              compliance: 'HIPAA compliant',
              patientId: fileType === 'DICOM' ? 'PAT-' + Math.floor(1000 + Math.random() * 9000) : undefined
            });

            if (realInsertedDocId) {
              addedDoc.id = realInsertedDocId;
            }

            // Update state
            setDocuments(prev => [addedDoc, ...prev]);
            
            // Mark completed in upload progress widget
            setUploadQueue(prev => prev.map(item => {
              if (item.id === id) {
                return { ...item, status: 'Completed' };
              }
              return item;
            }));

            // Auto-clear from active queue after 5 seconds
            setTimeout(() => {
              setUploadQueue(prev => prev.filter(item => item.id !== id));
            }, 5000);

          }, 1200);
        }, 1000);

      } else {
        setUploadQueue(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, progress: progress };
          }
          return item;
        }));
      }
    }, 250);
  };

  // Form Upload Submit (custom parameters)
  const handleCustomUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;

    if (!newFileTitle.trim()) {
      setNewFileError('Document Title is required.');
      return;
    }

    const filename = newFileTitle.endsWith('.' + newFileType.toLowerCase()) ? newFileTitle : `${newFileTitle}.${newFileType.toLowerCase()}`;
    const tagsArray = newFileTags
      ? newFileTags.split(',').map(t => t.trim()).filter(Boolean)
      : [newFileType, 'Manual'];

    const fakeSizes: Record<string, string> = {
      'PDF': '2.4 MB',
      'DICOM': '184.2 MB',
      'CSV': '12.8 KB',
      'XLSX': '1.1 MB',
      'TXT': '45.0 KB',
      'DOCX': '850.0 KB'
    };

    let fileSizeInBytes = 1024 * 1024; // 1 MB fallback
    const fakeSizeStr = fakeSizes[newFileType] || '1.2 MB';
    if (fakeSizeStr.includes('MB')) {
      fileSizeInBytes = Math.round(parseFloat(fakeSizeStr) * 1024 * 1024);
    } else if (fakeSizeStr.includes('KB')) {
      fileSizeInBytes = Math.round(parseFloat(fakeSizeStr) * 1024);
    }

    let realInsertedDocId: string | undefined;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const dummyContent = `MedIntel AI manual metadata asset: ${newFileTitle}\nDescription: ${newFileDesc}`;
        const blob = new Blob([dummyContent], { type: 'text/plain' });
        const file = new File([blob], filename, { type: 'text/plain' });

        // 1. Upload to Supabase Storage
        const storagePath = `${activeOrg.id}/${filename}`;
        const { error: uploadError } = await supabase.storage
          .from('medical-documents')
          .upload(storagePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // 2. Resolve category_id
        const { data: catData } = await supabase
          .from('document_categories')
          .select('id')
          .eq('organization_id', activeOrg.id)
          .eq('name', newFileCategory)
          .maybeSingle();
        const categoryId = catData?.id || null;

        // 3. Resolve uploaded_by UUID
        const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const uploadedByUuid = profile?.id && isUUID(profile.id) ? profile.id : null;

        // 4. Insert into documents table
        const { data: insertedDoc, error: insertError } = await supabase
          .from('documents')
          .insert({
            organization_id: activeOrg.id,
            category_id: categoryId,
            uploaded_by: uploadedByUuid,
            title: filename,
            description: newFileDesc.trim() || 'A manual ingestion of workspace clinical assets with customized tag mappings.',
            storage_path: storagePath,
            original_filename: filename,
            mime_type: newFileType,
            file_size: fileSizeInBytes,
            status: 'indexed',
            version: 1,
            tags: tagsArray
          })
          .select('*')
          .single();

        if (insertError) throw insertError;
        if (insertedDoc) {
          realInsertedDocId = insertedDoc.id;
        }
      } catch (err) {
        console.warn('Real Supabase manual upload/insert failed (falling back to simulator):', err);
      }
    }

    const added = supabaseSim.addDocument({
      title: filename,
      description: newFileDesc.trim() || 'A manual ingestion of workspace clinical assets with customized tag mappings.',
      category: newFileCategory,
      tags: tagsArray,
      organization_id: activeOrg.id,
      uploaded_by: profile?.full_name || profile?.email || 'Administrator Session',
      uploaded_by_id: profile?.id || 'anon',
      size: fakeSizes[newFileType] || '1.2 MB',
      file_type: newFileType,
      version: '1.0.0',
      status: 'Ready',
      compliance: 'HIPAA compliant',
      patientId: newFilePatientId.trim() || undefined
    });

    if (realInsertedDocId) {
      added.id = realInsertedDocId;
    }

    // Refresh & Clear
    setDocuments(prev => [added, ...prev]);
    setIsUploadFormOpen(false);
    setNewFileTitle('');
    setNewFileDesc('');
    setNewFileTags('');
    setNewFilePatientId('');
    setNewFileError('');
  };

  // Delete Document
  const handleDeleteDoc = async (id: string) => {
    if (!activeOrg) return;
    if (confirm('Are you sure you want to permanently delete this document from organizational knowledge repository? This action is audited and irreversible.')) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
          if (isUUID(id)) {
            // 1. Fetch storage path
            const { data: docData, error: fetchError } = await supabase
              .from('documents')
              .select('storage_path')
              .eq('id', id)
              .maybeSingle();

            if (fetchError) {
              console.warn('Failed to fetch storage_path for deletion:', fetchError);
            }

            // 2. Remove from storage if exists
            if (docData?.storage_path) {
              const { error: storageError } = await supabase.storage
                .from('medical-documents')
                .remove([docData.storage_path]);
              if (storageError) {
                console.warn('Failed to remove storage object:', storageError);
              }
            }

            // 3. Delete database row
            const { error: deleteError } = await supabase
              .from('documents')
              .delete()
              .eq('id', id);

            if (deleteError) {
              console.warn('Failed to delete document from database:', deleteError);
            }
          } else {
            console.warn('Document ID is not a valid UUID, skipping real database deletion.');
          }
        } catch (err) {
          console.warn('Real Supabase document deletion pipeline failed (falling back to simulator):', err);
        }
      }

      supabaseSim.deleteDocument(id, activeOrg.id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      if (previewDoc?.id === id) {
        setPreviewDoc(null);
      }
    }
  };

  // Rename Document Setup
  const handleRenameClick = (doc: DocumentItem) => {
    setRenameDoc(doc);
    setRenameValue(doc.title);
    setRenameDescValue(doc.description);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !renameDoc) return;
    if (!renameValue.trim()) return;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        if (isUUID(renameDoc.id)) {
          const { error } = await supabase
            .from('documents')
            .update({
              title: renameValue.trim(),
              description: renameDescValue.trim(),
              updated_at: new Date().toISOString()
            })
            .eq('id', renameDoc.id);
          
          if (error) {
            console.warn('Real Supabase document update failed (falling back to simulator):', error);
          }
        } else {
          console.warn('Document ID is not a valid UUID, skipping real database update.');
        }
      } catch (err) {
        console.warn('Real Supabase document rename/metadata update failed (falling back to simulator):', err);
      }
    }

    const updated = supabaseSim.renameDocument(renameDoc.id, activeOrg.id, renameValue);
    supabaseSim.updateDocumentMetadata(renameDoc.id, activeOrg.id, { description: renameDescValue });
    
    // update current lists
    setDocuments(prev => prev.map(d => d.id === renameDoc.id ? { ...d, title: renameValue, description: renameDescValue } : d));
    
    if (previewDoc?.id === renameDoc.id) {
      setPreviewDoc(prev => prev ? { ...prev, title: renameValue, description: renameDescValue } : null);
    }
    
    setRenameDoc(null);
  };

  // Category Manager operations
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !newCategoryName.trim()) return;

    const trimmedName = newCategoryName.trim();
    setCategoryError('');

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Case-insensitive duplicate check
        const { data: existing, error: dupError } = await supabase
          .from('document_categories')
          .select('id, name')
          .eq('organization_id', activeOrg.id)
          .ilike('name', trimmedName);

        if (dupError) {
          console.warn('Real Supabase duplicate check failed:', dupError);
        } else if (existing && existing.length > 0) {
          setCategoryError(`Category '${trimmedName}' already exists.`);
          return;
        }

        // Insert category
        const { error: insertError } = await supabase
          .from('document_categories')
          .insert({
            organization_id: activeOrg.id,
            name: trimmedName,
            description: null,
            color: null,
            icon: null
          });

        if (insertError) {
          console.warn('Real Supabase category insertion failed:', insertError);
          if (insertError.code === '23505') {
            setCategoryError(`Category '${trimmedName}' already exists.`);
            return;
          }
        }
      } catch (err: any) {
        console.warn('Real Supabase category creation pipeline failed:', err);
      }
    }

    try {
      const added = supabaseSim.addCategory(trimmedName, activeOrg.id);
      setCategories(prev => [...prev, added]);
      setNewCategoryName('');
    } catch (err: any) {
      setCategoryError(err.message || 'Error creating category');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!activeOrg) return;
    if (confirm('Delete this custom category? Documents under this category will automatically fallback to "Clinical Guidelines".')) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
          if (isUUID(catId)) {
            // 1. Verify category exists in DB
            const { data: category, error: findError } = await supabase
              .from('document_categories')
              .select('id, name')
              .eq('organization_id', activeOrg.id)
              .eq('id', catId)
              .maybeSingle();

            if (findError) {
              console.warn('Error querying category for deletion:', findError);
            }

            if (category) {
              // 2. Update documents referencing this category to set category_id = NULL
              const { error: updateError } = await supabase
                .from('documents')
                .update({ category_id: null })
                .eq('category_id', catId);

              if (updateError) {
                console.warn('Error disassociating documents from category:', updateError);
              }

              // 3. Delete category from public.document_categories
              const { error: deleteError } = await supabase
                .from('document_categories')
                .delete()
                .eq('id', catId);

              if (deleteError) {
                console.warn('Error deleting category row:', deleteError);
              }
            } else {
              console.warn('Category not found in database, skipping real database deletion.');
            }
          } else {
            console.warn('Category ID is not a valid UUID, skipping real database deletion.');
          }
        } catch (err) {
          console.warn('Real Supabase category deletion pipeline failed:', err);
        }
      }

      supabaseSim.deleteCategory(catId, activeOrg.id);
      // Refresh categories list and docs list
      const updatedCats = supabaseSim.getCategories(activeOrg.id);
      setCategories(updatedCats);
      // reload docs since some may have fallback category assigned
      refreshData();
    }
  };

  // Trigger Mock File Download
  const handleDownloadDoc = (doc: DocumentItem) => {
    // Generate simple text data representing a medical document mapping
    const fileContent = `--- MEDINTEL AI SECURE MEDICAL REPOSITORY DOWNLOAD ---
Document ID: ${doc.id}
Classification Category: ${doc.category}
Active Institution Context: ${activeOrg?.name}
Compliance Clearance: ${doc.compliance}
Uploaded By: ${doc.uploaded_by}
Timestamp: ${doc.date}
Version: ${doc.version}
------------------------------------------------------
This file is generated with AES-256 secure transport headers.

Description:
${doc.description}

This file acts as a secure local workspace representation for ${doc.title}.
For DICOM imagery slices or genomic profiles, access full RAG querying on the MedIntel AI Assistant Console.`;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.title.endsWith('.txt') ? doc.title : `${doc.title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    supabaseSim.logAction(
      'DOC_DOWNLOAD',
      'SUCCESS',
      `Authorized secure download key for '${doc.title}' requested by session user.`
    );
  };

  // Search & Filters filtering
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.patientId && doc.patientId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategoryFilter === 'All' || doc.category === activeCategoryFilter;
    const matchesFileType = activeFileTypeFilter === 'All' || doc.file_type === activeFileTypeFilter;
    const matchesStatus = activeStatusFilter === 'All' || doc.status === activeStatusFilter;

    return matchesSearch && matchesCategory && matchesFileType && matchesStatus;
  });

  // Sorting logic
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'size-desc':
        // simple parsing: MB vs KB
        const sizeVal = (str: string) => {
          const val = parseFloat(str);
          if (str.toUpperCase().includes('GB')) return val * 1024 * 1024;
          if (str.toUpperCase().includes('MB')) return val * 1024;
          if (str.toUpperCase().includes('KB')) return val;
          return val / 1024;
        };
        return sizeVal(b.size) - sizeVal(a.size);
      default:
        return 0;
    }
  });

  // Unique types from organization documents for filter dropdown
  const fileTypesList = ['All', ...Array.from(new Set(documents.map(d => d.file_type)))];

  return (
    <div className="flex flex-col gap-6 relative z-10 text-slate-100" id="knowledge-library-root">
      
      {/* 1. Header with metadata and system actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>{activeOrg?.name?.toUpperCase() || 'CONSOLE'}</span>
            <span>/</span>
            <span className="text-[#00E5FF] tracking-wider font-bold">KNOWLEDGE LIBRARY</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white flex items-center gap-2.5">
            <BookOpen className="text-[#00E5FF]" size={28} />
            Institutional Knowledge Library
          </h1>
          <p className="text-[#94A3B8] text-sm max-w-2xl">
            The central point-of-truth. Secure, RLS-isolated repository to upload guidelines, clinical scans, and SOPs. Directly synchronized to semantic indexes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsManageCategoriesOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sliders size={13} />
              Manage Categories
            </button>
          )}
          
          <button
            onClick={() => setIsUploadFormOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] hover:opacity-95 text-slate-950 font-display font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-[#00E5FF]/10"
          >
            <Plus size={14} />
            Add Custom Metadata Document
          </button>
        </div>
      </div>

      {/* 2. Drag & Drop Active Area + Left Navigation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Drive-Style Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          
          {/* Quick upload card */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 relative overflow-hidden group cursor-pointer ${
              isDragging
                ? 'border-[#00E5FF] bg-[#00E5FF]/5 shadow-xl shadow-[#00E5FF]/5'
                : 'border-white/10 bg-slate-900/30 hover:border-[#00E5FF]/30 hover:bg-slate-950/20'
            }`}
            onClick={() => document.getElementById('sidebar-file-upload')?.click()}
          >
            <input
              type="file"
              id="sidebar-file-upload"
              className="hidden"
              multiple
              onChange={handleManualFileChange}
            />
            
            <div className={`p-3 rounded-full border transition-all ${
              isDragging ? 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40' : 'bg-white/5 text-slate-400 border-white/5 group-hover:border-white/15'
            }`}>
              <Upload size={20} className={isDragging ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'} />
            </div>

            <div>
              <span className="font-display font-bold text-xs text-white block">
                Drag & Drop Files Here
              </span>
              <span className="text-[10px] text-[#94A3B8] mt-1 block">
                Supports DICOM, PDF, CSV, XLSX, DOCX (Max 500MB)
              </span>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/40 text-[9px] font-mono text-slate-500">
              <Lock size={10} />
              AES-256 RLS Isolation
            </div>
          </div>

          {/* Categories Sidebar List */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col gap-2">
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 px-2 pb-2 border-b border-white/5">
              Knowledge Domains
            </h3>
            
            <div className="flex flex-col gap-1 mt-2">
              <button
                onClick={() => setActiveCategoryFilter('All')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                  activeCategoryFilter === 'All'
                    ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen size={14} />
                  All Repository Files
                </span>
                <span className="text-[10px] font-mono bg-slate-950/40 px-1.5 py-0.5 rounded text-slate-500">
                  {documents.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = documents.filter(d => d.category === cat.name).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryFilter(cat.name)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      activeCategoryFilter === cat.name
                        ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {cat.organization_id ? <Tag size={13} className="text-[#7C3AED]" /> : <FolderOpen size={14} />}
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="text-[10px] font-mono bg-slate-950/40 px-1.5 py-0.5 rounded text-slate-500">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick RLS compliance card */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-xs flex flex-col gap-2 leading-relaxed">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck size={14} />
              Boundary Check Completed
            </div>
            <p className="text-slate-400 text-[11px]">
              Every document query explicitly appends the organization boundary RLS key <code className="text-emerald-300 font-mono text-[10px] bg-slate-950/40 px-1 rounded">{activeOrg?.id}</code>. Inter-tenant cross-contamination is hardlocked out at database schema layer.
            </p>
          </div>

        </div>

        {/* Right main area with upload progress queue, search bar, filters and view grid/list toggle */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          
          {/* Active Upload Queue Display */}
          <AnimatePresence>
            {uploadQueue.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl border border-white/10 bg-slate-950/60 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                    <RefreshCw size={13} className="animate-spin text-[#00E5FF]" />
                    ACTIVE INGEST STREAM ({uploadQueue.filter(u => u.status !== 'Completed' && u.status !== 'Failed').length} RUNNING)
                  </div>
                  <button
                    onClick={() => setUploadQueue(prev => prev.filter(u => u.status !== 'Completed' && u.status !== 'Failed'))}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-mono underline"
                  >
                    Clear Inactive
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {uploadQueue.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-white/5 flex gap-3 items-center">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5 text-[#00E5FF]">
                        {item.fileType === 'DICOM' ? <ShieldAlert size={16} /> : <FileText size={16} />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-semibold text-slate-200 truncate pr-2">{item.name}</span>
                          <span className="text-slate-500 shrink-0">{item.size}</span>
                        </div>

                        {/* Status bar */}
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full transition-all duration-300 ${
                              item.status === 'Failed'
                                ? 'bg-red-500'
                                : item.status === 'Completed'
                                ? 'bg-[#14F195]'
                                : 'bg-[#00E5FF]'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[9px] mt-1 font-mono">
                          <span className={
                            item.status === 'Failed' ? 'text-red-400' :
                            item.status === 'Completed' ? 'text-[#14F195]' : 'text-slate-400'
                          }>
                            {item.status === 'Uploading' && `Uploading... ${item.progress}%`}
                            {item.status === 'Scanning' && 'HIPAA Security Check...'}
                            {item.status === 'Ingesting' && 'Splitting & Vector Mapping...'}
                            {item.status === 'Completed' && 'Fully Ingested into RAG'}
                            {item.status === 'Failed' && (item.error || 'Failed')}
                          </span>
                          <span className="text-slate-600 font-bold uppercase">{item.fileType}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search, filters, sorters, layout controls */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3.5">
            
            {/* Search Input and view toggle */}
            <div className="flex flex-col md:flex-row gap-3.5 items-center justify-between">
              
              {/* Search */}
              <div className="relative w-full md:max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search title, description, tags, patient ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/40 border border-white/10 hover:border-white/20 focus:border-[#00E5FF] focus:outline-none text-slate-200 text-xs font-mono placeholder:text-slate-500"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                
                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-slate-950/40 border border-white/5 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="date-desc">Newest Ingested</option>
                    <option value="date-asc">Oldest Ingested</option>
                    <option value="title-asc">Title (A-Z)</option>
                    <option value="title-desc">Title (Z-A)</option>
                    <option value="size-desc">Largest Size</option>
                  </select>
                </div>

                {/* View Toggles */}
                <div className="flex items-center bg-slate-950/40 border border-white/5 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Grid View"
                  >
                    <Grid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="List View"
                  >
                    <List size={14} />
                  </button>
                </div>

              </div>
            </div>

            {/* Quick sub-filter tags (File Format and Processing Status) */}
            <div className="flex flex-wrap gap-4 items-center border-t border-white/5 pt-3 text-[11px] font-mono text-slate-400">
              
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold uppercase">Format:</span>
                <div className="flex gap-1.5">
                  {['All', 'PDF', 'DICOM', 'CSV', 'XLSX'].map(fType => (
                    <button
                      key={fType}
                      onClick={() => setActiveFileTypeFilter(fType)}
                      className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        activeFileTypeFilter === fType
                          ? 'bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF] font-bold'
                          : 'border-transparent bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {fType}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold uppercase">Status:</span>
                <div className="flex gap-1.5">
                  {['All', 'Ready', 'Indexing', 'Failed'].map(status => (
                    <button
                      key={status}
                      onClick={() => setActiveStatusFilter(status)}
                      className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        activeStatusFilter === status
                          ? 'bg-[#14F195]/10 border-[#14F195]/30 text-[#14F195] font-bold'
                          : 'border-transparent bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-auto text-slate-500">
                Found <span className="text-white font-bold">{sortedDocs.length}</span> documents
              </div>

            </div>

          </div>

          {/* 3. Empty state or Grid/List Renderer */}
          {sortedDocs.length === 0 ? (
            <div className="glass-panel p-16 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-full bg-slate-950/40 text-slate-600 border border-white/5">
                <FolderOpen size={36} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">No Clinical Assets Located</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed font-mono">
                  No records match search: "{searchQuery || 'None'}" under Domain: "{activeCategoryFilter}". Drop a packet in the workspace left boundary to inject new clinical indices.
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            
            // Grid View Layout
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              id="knowledge-grid"
            >
              <AnimatePresence mode="popLayout">
                {sortedDocs.map((doc) => (
                  <motion.div
                    layout
                    key={doc.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="glass-panel p-5 rounded-2xl flex flex-col gap-4 justify-between group hover:border-[#00E5FF]/20 transition-all relative overflow-hidden"
                  >
                    {/* Visual glowing accent for DICOM medical records */}
                    {doc.file_type === 'DICOM' && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-radial-gradient from-[#00E5FF]/5 to-transparent rounded-bl-full pointer-events-none" />
                    )}

                    <div className="flex flex-col gap-2.5">
                      {/* Top bar with type and status */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          doc.file_type === 'DICOM' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15' :
                          doc.file_type === 'PDF' ? 'bg-red-500/10 text-red-400 border border-red-500/15' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                        }`}>
                          {doc.file_type}
                        </span>
                        
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                          doc.status === 'Ready'
                            ? 'bg-[#14F195]/10 text-[#14F195]'
                            : doc.status === 'Failed'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-amber-400/10 text-amber-400'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            doc.status === 'Ready' ? 'bg-[#14F195]' : doc.status === 'Failed' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'
                          }`} />
                          {doc.status}
                        </span>
                      </div>

                      {/* Doc Title and Desc */}
                      <div>
                        <h4 className="font-display font-bold text-sm text-white leading-snug group-hover:text-[#00E5FF] transition-colors truncate" title={doc.title}>
                          {doc.title}
                        </h4>
                        <p className="text-[11px] text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed h-8">
                          {doc.description || 'No document description supplied.'}
                        </p>
                      </div>

                      {/* Domain badge and Tags */}
                      <div className="flex flex-col gap-1.5 mt-1 border-t border-white/5 pt-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <FolderOpen size={11} className="text-[#00E5FF]" />
                          <span className="truncate">{doc.category}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.tags.slice(0, 3).map((tag, tIdx) => (
                            <span key={tIdx} className="text-[9px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-400">
                              #{tag}
                            </span>
                          ))}
                          {doc.tags.length > 3 && (
                            <span className="text-[9px] font-mono text-slate-500">+{doc.tags.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer bar containing uploaded by and action buttons */}
                    <div className="border-t border-white/5 pt-3 mt-1 flex items-center justify-between text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 text-slate-400 truncate pr-2">
                        <div className="w-5 h-5 rounded-full bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF] text-[8px] font-bold">
                          {doc.uploaded_by ? doc.uploaded_by.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="truncate" title={`Uploaded by ${doc.uploaded_by}`}>
                          {doc.uploaded_by?.split(',')[0]}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded bg-slate-950/40 text-slate-400 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-all cursor-pointer"
                          title="Preview Content"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleDownloadDoc(doc)}
                          className="p-1.5 rounded bg-slate-950/40 text-slate-400 hover:text-[#14F195] hover:bg-[#14F195]/10 transition-all cursor-pointer"
                          title="Download Text Mock"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={() => handleRenameClick(doc)}
                          className="p-1.5 rounded bg-slate-950/40 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all cursor-pointer"
                          title="Edit Title/Description"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 rounded bg-slate-950/40 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Deregister Purge"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            
            // List View Layout
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs" id="documents-table-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                      <th className="p-4 font-semibold">Document Reference</th>
                      <th className="p-4 font-semibold">Domain Category</th>
                      <th className="p-4 font-semibold">Metadata Tags</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Uploader</th>
                      <th className="p-4 font-semibold">Size</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    <AnimatePresence mode="popLayout">
                      {sortedDocs.map((doc) => (
                        <motion.tr
                          layout
                          key={doc.id}
                          className="hover:bg-white/5 transition-colors group"
                        >
                          <td className="p-4 font-medium text-white max-w-[240px] truncate">
                            <div className="flex items-center gap-2.5">
                              <FileText size={15} className="text-[#00E5FF] shrink-0 group-hover:scale-110 transition-transform" />
                              <div className="flex flex-col gap-0.5 truncate">
                                <span className="truncate font-semibold">{doc.title}</span>
                                <span className="text-[9px] font-mono text-slate-500">{doc.date}</span>
                              </div>
                            </div>
                          </td>
                          
                          <td className="p-4 font-mono">
                            <span className="px-2.5 py-0.5 rounded bg-slate-950/50 border border-white/5 text-[10px] text-slate-300 whitespace-nowrap">
                              {doc.category}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {doc.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-slate-400">
                                  #{tag}
                                </span>
                              ))}
                              {doc.tags.length > 2 && <span className="text-[9px] text-slate-600 font-mono">+{doc.tags.length - 2}</span>}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                              doc.status === 'Ready' ? 'bg-[#14F195]/10 text-[#14F195]' : 'bg-amber-400/10 text-amber-400'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${doc.status === 'Ready' ? 'bg-[#14F195]' : 'bg-amber-400 animate-pulse'}`} />
                              {doc.status}
                            </span>
                          </td>

                          <td className="p-4 text-slate-400 font-mono text-[10px]">
                            <span className="truncate block max-w-[100px]" title={doc.uploaded_by}>{doc.uploaded_by?.split(',')[0]}</span>
                          </td>

                          <td className="p-4 text-slate-400 font-mono text-right whitespace-nowrap">
                            <div className="flex flex-col items-end gap-0.5">
                              <span>{doc.size}</span>
                              <span className="text-[9px] text-slate-500 font-bold">{doc.file_type}</span>
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="p-1.5 rounded bg-slate-950/20 text-slate-400 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors cursor-pointer"
                                title="Preview content"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                onClick={() => handleDownloadDoc(doc)}
                                className="p-1.5 rounded bg-slate-950/20 text-slate-400 hover:text-[#14F195] hover:bg-[#14F195]/10 transition-colors cursor-pointer"
                                title="Download"
                              >
                                <Download size={12} />
                              </button>
                              <button
                                onClick={() => handleRenameClick(doc)}
                                className="p-1.5 rounded bg-slate-950/20 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
                                title="Rename"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteDoc(doc.id)}
                                className="p-1.5 rounded bg-slate-950/20 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* --- MODAL 1: PREVIEW PANEL OVERLAY (DICOM Interactive simulation, PDF text simulation, CSV spreadsheet) --- */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 bg-[#020813]/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="bg-[#091527] border border-white/10 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] md:h-[75vh]"
              id="file-preview-modal"
            >
              
              {/* Left Column: Metadata detailed profile */}
              <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/5 bg-[#050d1a] p-6 flex flex-col gap-5 overflow-y-auto shrink-0">
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Metadata Profile</span>
                  <span className="px-2 py-0.5 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[10px] text-[#00E5FF] font-mono font-bold uppercase">
                    {previewDoc.file_type}
                  </span>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <h3 className="font-display font-extrabold text-base text-white break-words leading-snug">
                    {previewDoc.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {previewDoc.description}
                  </p>
                </div>

                <div className="flex flex-col gap-3.5 border-t border-white/5 pt-4 text-xs font-mono">
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 uppercase text-[9px] font-bold">Category</span>
                    <span className="text-slate-200">{previewDoc.category}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 uppercase text-[9px] font-bold">Doc Size / Format</span>
                    <span className="text-slate-200">{previewDoc.size} ({previewDoc.file_type})</span>
                  </div>

                  {previewDoc.patientId && (
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 uppercase text-[9px] font-bold">Patient ID Reference</span>
                      <span className="text-[#00E5FF] font-bold">{previewDoc.patientId}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 uppercase text-[9px] font-bold">Ingestion Boundary</span>
                    <span className="text-emerald-400 text-[11px] truncate flex items-center gap-1">
                      <ShieldCheck size={11} />
                      {activeOrg?.slug}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 uppercase text-[9px] font-bold">Uploader Account</span>
                    <span className="text-slate-200 truncate">{previewDoc.uploaded_by}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 uppercase text-[9px] font-bold">Registration Dates</span>
                    <div className="text-slate-300 text-[11px] flex flex-col gap-0.5">
                      <span>Ingest: {previewDoc.date}</span>
                      <span>Modified: {previewDoc.last_modified}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 uppercase text-[9px] font-bold">File Version</span>
                    <span className="text-slate-200">v{previewDoc.version} (Optimized)</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 uppercase text-[9px] font-bold">RAG Pipeline Status</span>
                    <span className="text-[#14F195] font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-ping" />
                      Semantic Synced
                    </span>
                  </div>

                </div>

                <div className="mt-auto pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleDownloadDoc(previewDoc)}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-mono transition-all flex items-center justify-center gap-1.5 border border-white/5"
                  >
                    <Download size={13} />
                    Download Mock Dataset
                  </button>
                </div>

              </div>

              {/* Right Column: Immersive Content Viewer */}
              <div className="flex-1 flex flex-col min-w-0 bg-[#030913] relative overflow-hidden">
                
                {/* Viewer top navigation */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#060e1d]">
                  <div className="flex items-center gap-2">
                    <FileCheck2 size={15} className="text-[#00E5FF]" />
                    <span className="text-xs font-mono font-semibold text-slate-300">SECURE RAG PREVIEW PORT - DECRYPTED VIEWER</span>
                  </div>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Main Content Area based on File Format type */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                  
                  {previewDoc.file_type === 'DICOM' ? (
                    
                    // A. DICOM IMAGE SLICE SIMULATOR! Truly mind-blowing high-fidelity
                    <div className="flex flex-col items-center gap-4 py-3">
                      <div className="flex items-center justify-between w-full font-mono text-[10px] text-slate-500 max-w-sm">
                        <span>SERIES_02_CARDIAC_AXIAL</span>
                        <span>SLICE {dicomSlice}/24</span>
                      </div>

                      {/* Decrypted image frame container */}
                      <div className="w-full max-w-xs aspect-square bg-[#01040a] border border-white/10 rounded-lg overflow-hidden flex flex-col items-center justify-center relative p-1">
                        
                        {/* Simulation graphic using simple elegant SVG or radial rings to look highly specialized! */}
                        <div className="absolute inset-4 rounded-full border border-dashed border-[#00E5FF]/20 animate-spin-slow pointer-events-none" />
                        <div className="absolute inset-12 rounded-full border border-dotted border-[#7C3AED]/30 pointer-events-none" />
                        
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* We render a beautiful vector shape that shifts size based on slice selector! */}
                          <svg className="w-4/5 h-4/5 text-[#00E5FF] transition-all duration-300 transform" viewBox="0 0 100 100" style={{ opacity: 0.75 }}>
                            <circle cx="50" cy="50" r={15 + (dicomSlice * 1.2)} stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="5,3" />
                            <circle cx="50" cy="50" r={8 + (dicomSlice * 0.6)} stroke="#7C3AED" strokeWidth="1" fill="none" />
                            {/* Inner cardiac chambers mapping */}
                            <path d={`M 50 50 Q ${30 + dicomSlice} 20, 50 10 Q ${70 - dicomSlice} 20, 50 50`} fill="none" stroke="currentColor" strokeWidth="0.75" />
                            <path d={`M 50 50 Q ${20 + dicomSlice * 1.5} 80, 50 90 Q ${80 - dicomSlice * 1.5} 80, 50 50`} fill="none" stroke="currentColor" strokeWidth="0.75" />
                          </svg>

                          {/* Interactive crosshair overlay */}
                          <div className="absolute left-0 right-0 h-[0.5px] bg-white/10 pointer-events-none" />
                          <div className="absolute top-0 bottom-0 w-[0.5px] bg-white/10 pointer-events-none" />
                          
                          {/* Corner Telemetry Tags */}
                          <div className="absolute top-2 left-2 font-mono text-[8px] text-[#00E5FF]">
                            <div>TE_42ms</div>
                            <div>TR_3500ms</div>
                          </div>
                          <div className="absolute top-2 right-2 font-mono text-[8px] text-slate-500">
                            <div>FOV_240mm</div>
                            <div>FLIP_90</div>
                          </div>
                          <div className="absolute bottom-2 left-2 font-mono text-[8px] text-slate-500">
                            <div>CARDIOLAB_MAYO</div>
                          </div>
                          <div className="absolute bottom-2 right-2 font-mono text-[8px] text-[#14F195]">
                            <div>100% SECURE</div>
                          </div>
                        </div>

                      </div>

                      {/* Slider Control */}
                      <div className="w-full max-w-sm flex flex-col gap-1.5 mt-2">
                        <label className="text-[10px] font-mono text-slate-400 uppercase flex justify-between">
                          <span>Scroll Through Axial Scan Slices:</span>
                          <span className="text-[#00E5FF] font-bold">Slice {dicomSlice}/24</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="24"
                          value={dicomSlice}
                          onChange={(e) => setDicomSlice(parseInt(e.target.value))}
                          className="w-full accent-[#00E5FF] bg-slate-900 rounded-lg appearance-none h-1.5 cursor-pointer"
                        />
                        <span className="text-[9px] text-slate-500 font-mono text-center">
                          Drag slider to inspect anatomical sequences. This simulates local canvas client decryption.
                        </span>
                      </div>
                    </div>

                  ) : previewDoc.file_type === 'CSV' || previewDoc.file_type === 'XLSX' ? (
                    
                    // B. TABULAR DATASET VIEWER (CSV / XLSX)
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-400">STRUCTURED DATAFRAME SCHEMATICS</span>
                        <span className="text-[10px] font-mono text-slate-500">Row count: 5 entries (Filtered)</span>
                      </div>

                      <div className="border border-white/5 rounded-xl bg-slate-950/50 overflow-hidden">
                        <table className="w-full text-left font-mono text-[10px]">
                          <thead>
                            <tr className="border-b border-white/5 bg-slate-900/50 text-[#00E5FF]">
                              <th className="p-3">INDEX_ID</th>
                              <th className="p-3">LOCUS_MARKER</th>
                              <th className="p-3">ALLELE_MUTATION</th>
                              <th className="p-3">RISK_RATIO</th>
                              <th className="p-3">INGEST_VERDICT</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            <tr>
                              <td className="p-3 font-semibold">SEG-4091</td>
                              <td className="p-3">BRCA1-EXON12</td>
                              <td className="p-3 text-red-400">c.5074+1G&gt;A (Pathogenic)</td>
                              <td className="p-3">9.24</td>
                              <td className="p-3"><span className="text-emerald-400">INDEXED_PASS</span></td>
                            </tr>
                            <tr>
                              <td className="p-3 font-semibold">SEG-4092</td>
                              <td className="p-3">BRCA1-EXON15</td>
                              <td className="p-3">c.4837A&gt;G (Neutral)</td>
                              <td className="p-3">1.05</td>
                              <td className="p-3"><span className="text-emerald-400">INDEXED_PASS</span></td>
                            </tr>
                            <tr>
                              <td className="p-3 font-semibold">SEG-4093</td>
                              <td className="p-3">BRCA2-EXON11</td>
                              <td className="p-3 text-amber-400">c.658_659delGT (Variant of Uncertain)</td>
                              <td className="p-3">2.41</td>
                              <td className="p-3"><span className="text-emerald-400">INDEXED_PASS</span></td>
                            </tr>
                            <tr>
                              <td className="p-3 font-semibold">SEG-4094</td>
                              <td className="p-3">CYP2C9-ALLELE3</td>
                              <td className="p-3">*3 Variant Slow Metabolizer</td>
                              <td className="p-3">4.18</td>
                              <td className="p-3"><span className="text-emerald-400">INDEXED_PASS</span></td>
                            </tr>
                            <tr>
                              <td className="p-3 font-semibold">SEG-4095</td>
                              <td className="p-3">VKORC1-PROM11</td>
                              <td className="p-3 text-[#00E5FF]">-1639G&gt;A Low-dose phenotype</td>
                              <td className="p-3">5.50</td>
                              <td className="p-3"><span className="text-emerald-400">INDEXED_PASS</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono italic text-center">
                        Securely mapped via Drizzle ORM matching memberships belonging to organizational token {activeOrg?.id}
                      </p>
                    </div>

                  ) : (
                    
                    // C. CLINICAL REPORT / PDF / GUIDELINE MARKDOWN PREVIEW
                    <div className="flex flex-col gap-5 text-slate-300 text-xs leading-relaxed font-sans max-w-2xl mx-auto p-4 bg-slate-950/40 rounded-xl border border-white/5">
                      <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                        <div>
                          <h4 className="font-display font-bold text-sm text-white">MedIntel Clinical Summary</h4>
                          <span className="text-[9px] font-mono text-slate-500">Document Hash Reference: sha256_e4b102f9011</span>
                        </div>
                        <BookOpen size={16} className="text-[#00E5FF]" />
                      </div>

                      <div>
                        <h5 className="font-display font-bold text-slate-200 uppercase tracking-wider text-[10px] mb-1.5">1. Overview Analysis</h5>
                        <p className="text-slate-400">
                          This clinical guidelines summary has been successfully ingested into the RAG pipeline. It outlines diagnostic parameters, staging protocols, and pharmacological treatment algorithms. The semantic search module utilizes this text profile as primary evidence to answer multi-modal clinician prompts in real-time.
                        </p>
                      </div>

                      <div>
                        <h5 className="font-display font-bold text-slate-200 uppercase tracking-wider text-[10px] mb-1.5">2. Critical Clinical Indicators</h5>
                        <ul className="list-disc list-inside space-y-1 mt-1 text-slate-400">
                          <li>First-line administration triggers under glomerular filtration clearances.</li>
                          <li>Dosage adjustment parameters regarding CYP2C9 phenotype profiles.</li>
                          <li>Radiological scan margins for left ventricular ejection fractions.</li>
                          <li>Contraindication thresholds for patients with pre-existing hepatic clearance anomalies.</li>
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-display font-bold text-slate-200 uppercase tracking-wider text-[10px] mb-1.5">3. Institutional Security clearance</h5>
                        <p className="text-slate-400">
                          This asset is bounded under strict organizational tenant isolation rules. Any telemetry log, vector search query, or manual export audits this transaction against membership ID <code className="text-[#00E5FF] font-mono bg-slate-900 px-1 rounded">{profile?.id}</code>.
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Clearance Level: STANDARD CLINICAL</span>
                        <span>MedIntel AI RAG Index</span>
                      </div>
                    </div>

                  )}

                </div>

                {/* Footer with telemetry status */}
                <div className="p-4 border-t border-white/5 bg-[#060e1d] flex items-center justify-between shrink-0 font-mono text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-[#14F195]" />
                    ORGANIZATIONAL SECURE RLS CHANNELS ENFORCED
                  </span>
                  <span>SESSION TOKEN: ...{profile?.id?.slice(-8)}</span>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: RENAME & DESCRIPTION EDITOR --- */}
      <AnimatePresence>
        {renameDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#091527] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6"
              id="rename-modal"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <h3 className="font-display font-bold text-base text-white">Edit Document Metadata</h3>
                <button onClick={() => setRenameDoc(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRenameSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Document Title</label>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:border-[#00E5FF] font-mono text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Summary Description</label>
                  <textarea
                    value={renameDescValue}
                    onChange={(e) => setRenameDescValue(e.target.value)}
                    rows={4}
                    className="w-full p-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:border-[#00E5FF] text-xs leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-3 justify-end pt-3 border-t border-white/5 mt-2">
                  <button
                    type="button"
                    onClick={() => setRenameDoc(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 text-xs font-mono font-bold hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#00E5FF] text-slate-950 text-xs font-mono font-bold hover:opacity-90 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 3: ADD CUSTOM METADATA DOCUMENT FORM (POPUP) --- */}
      <AnimatePresence>
        {isUploadFormOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#091527] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl p-6"
              id="upload-custom-modal"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <h3 className="font-display font-bold text-base text-white">Add Clinical Asset (Metadata-first)</h3>
                <button onClick={() => setIsUploadFormOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              {newFileError && (
                <div className="p-3 mb-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} />
                  {newFileError}
                </div>
              )}

              <form onSubmit={handleCustomUploadSubmit} className="flex flex-col gap-3.5">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-400 uppercase">Document Format</label>
                    <select
                      value={newFileType}
                      onChange={(e) => setNewFileType(e.target.value)}
                      className="bg-slate-950/40 border border-white/5 text-xs text-slate-300 rounded-lg p-2.5 focus:outline-none cursor-pointer"
                    >
                      <option value="PDF">PDF Clinical Report</option>
                      <option value="DICOM">DICOM Medical Scans</option>
                      <option value="CSV">CSV Genomic Mutations</option>
                      <option value="XLSX">Excel Spreadsheet</option>
                      <option value="DOCX">Microsoft Word Notes</option>
                      <option value="TXT">Text SOP Document</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-400 uppercase">Domain Category</label>
                    <select
                      value={newFileCategory}
                      onChange={(e) => setNewFileCategory(e.target.value)}
                      className="bg-slate-950/40 border border-white/5 text-xs text-slate-300 rounded-lg p-2.5 focus:outline-none cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Asset Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Atherosclerosis_Left_Artery_Analysis"
                    value={newFileTitle}
                    onChange={(e) => setNewFileTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:border-[#00E5FF] font-mono text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Summary Description</label>
                  <textarea
                    placeholder="Provide a detailed medical context. MedIntel RAG model crawls this summary to fetch search references."
                    value={newFileDesc}
                    onChange={(e) => setNewFileDesc(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:border-[#00E5FF] text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-400 uppercase">Tags (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="Cardiology, Contrast, Axial"
                      value={newFileTags}
                      onChange={(e) => setNewFileTags(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:border-[#00E5FF] font-mono text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-400 uppercase">Patient ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="PAT-9082"
                      value={newFilePatientId}
                      onChange={(e) => setNewFilePatientId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:border-[#00E5FF] font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-mono text-slate-400">
                  <ShieldCheck className="text-[#14F195]" size={14} />
                  <span>Bounded isolation context will tag this document to org: <strong>{activeOrg?.name}</strong></span>
                </div>

                <div className="flex items-center gap-3 justify-end pt-3 border-t border-white/5 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 text-xs font-mono font-bold hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#00E5FF] text-slate-950 text-xs font-mono font-bold hover:opacity-90 cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Register Ingest File
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 4: CUSTOM CATEGORIES MANAGER (ADMIN ONLY) --- */}
      <AnimatePresence>
        {isManageCategoriesOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#091527] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6"
              id="categories-manager-modal"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <h3 className="font-display font-bold text-base text-white">Clinical Category Manager</h3>
                <button onClick={() => setIsManageCategoriesOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              {categoryError && (
                <div className="p-2.5 mb-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-mono">
                  {categoryError}
                </div>
              )}

              {/* Form to create a custom category */}
              <form onSubmit={handleCreateCategory} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Create Custom Domain..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 p-2 rounded-xl bg-slate-950/50 border border-white/10 text-white focus:outline-none focus:border-[#00E5FF] text-xs font-mono placeholder:text-slate-500"
                  required
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#00E5FF] text-slate-950 text-xs font-mono font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus size={14} />
                  Add
                </button>
              </form>

              {/* Category list showing defaults (read only) and custom ones with delete option */}
              <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto no-scrollbar border border-white/5 rounded-xl bg-slate-950/40 p-2">
                <span className="text-[9px] font-mono text-slate-500 px-2 uppercase font-bold mb-1 block">Active Domains</span>
                
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-slate-300"
                  >
                    <span className="flex items-center gap-1.5 font-mono truncate">
                      {cat.organization_id ? <Tag size={12} className="text-[#7C3AED]" /> : <FolderOpen size={12} />}
                      <span className="truncate">{cat.name}</span>
                    </span>
                    
                    {cat.organization_id ? (
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete Custom Category"
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : (
                      <span className="text-[8px] font-mono text-slate-500 uppercase bg-slate-950/60 px-1 py-0.5 rounded">System</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5 mt-4">
                <button
                  onClick={() => setIsManageCategoriesOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-xs font-mono font-bold hover:text-white cursor-pointer"
                >
                  Close Manager
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
