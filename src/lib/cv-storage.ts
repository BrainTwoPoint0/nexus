/**
 * CV Storage utilities for Supabase
 * Handles secure file uploads and management
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface CVUploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface CVUploadOptions {
  maxFileSize?: number; // in bytes, default 10MB
  allowedTypes?: string[];
}

const DEFAULT_OPTIONS: Required<CVUploadOptions> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
};

/**
 * Upload CV file to Supabase storage
 */
export async function uploadCV(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  options: CVUploadOptions = {}
): Promise<CVUploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Validate file size
    if (file.size > opts.maxFileSize) {
      return {
        success: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${(opts.maxFileSize / 1024 / 1024).toFixed(1)}MB)`,
      };
    }

    // Validate file type
    if (!opts.allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `File type "${file.type}" is not supported. Please upload PDF, DOC, DOCX, or TXT files.`,
      };
    }

    // Generate unique file name
    const timestamp = Date.now();
    const fileExt = getFileExtension(file.name);
    const fileName = `${userId}_${timestamp}.${fileExt}`;
    const filePath = `cvs/${fileName}`;

    // Upload file to Supabase storage
    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Create database record using the documents table
    const { error: dbError } = await supabase.from('documents').insert({
      profile_id: userId,
      original_filename: file.name,
      stored_filename: fileName,
      file_path: filePath,
      file_size: file.size,
      file_type: getFileExtension(file.name),
      mime_type: file.type,
      document_category: 'cv',
      title: 'CV/Resume',
      is_primary: true,
      is_current_version: true,
    });

    if (dbError) {
      console.error('Database insert error:', dbError);

      // Clean up uploaded file if database insert fails
      await supabase.storage.from('documents').remove([filePath]);

      return {
        success: false,
        error: 'Failed to save file information to database',
      };
    }

    return {
      success: true,
      filePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('CV upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Get signed URL for CV file
 */
export async function getCVSignedUrl(
  supabase: SupabaseClient,
  filePath: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate signed URL',
    };
  }
}

/**
 * Delete CV file and database record
 */
export async function deleteCV(
  supabase: SupabaseClient,
  userId: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('profile_id', userId)
      .eq('file_path', filePath);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return { success: false, error: 'Failed to delete file record' };
    }

    return { success: true };
  } catch (error) {
    console.error('CV deletion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deletion failed',
    };
  }
}

/**
 * Get user's CV uploads
 */
export async function getUserCVs(supabase: SupabaseClient, userId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('profile_id', userId)
      .eq('document_category', 'cv')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user CVs:', error);
      return { cvs: [], error: error.message };
    }

    return { cvs: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user CVs:', error);
    return {
      cvs: [],
      error: error instanceof Error ? error.message : 'Failed to fetch CVs',
    };
  }
}

/**
 * Update CV parsing status
 */
export async function updateCVParsingStatus(
  supabase: SupabaseClient,
  userId: string,
  filePath: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  parsedData?: Record<string, unknown>,
  errorMessage?: string
) {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Use content_extracted to store both parsed data and status info
    if (parsedData) {
      updateData.content_extracted = JSON.stringify({
        status: 'completed',
        parsed_data: parsedData,
      });
    } else if (errorMessage) {
      updateData.content_extracted = JSON.stringify({
        status: 'failed',
        error: errorMessage,
      });
      updateData.description = `CV parsing failed: ${errorMessage}`;
    } else {
      updateData.content_extracted = JSON.stringify({
        status: status,
      });
    }

    const { error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('profile_id', userId)
      .eq('file_path', filePath);

    if (error) {
      console.error('Error updating CV parsing status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating CV parsing status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: CVUploadOptions = {}
): { valid: boolean; error?: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (file.size > opts.maxFileSize) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size (${(opts.maxFileSize / 1024 / 1024).toFixed(1)}MB)`,
    };
  }

  if (!opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not supported. Please upload PDF, DOC, DOCX, or TXT files.`,
    };
  }

  return { valid: true };
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length === 1) return 'txt';

  const ext = parts[parts.length - 1].toLowerCase();

  // Map MIME types to extensions
  const extensionMap: Record<string, string> = {
    pdf: 'pdf',
    doc: 'doc',
    docx: 'docx',
    txt: 'txt',
    text: 'txt',
  };

  return extensionMap[ext] || 'txt';
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
