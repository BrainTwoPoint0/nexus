'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { validateFile, formatFileSize } from '@/lib/cv-storage';
import { CVHelpModal } from '@/components/ui/cv-help-modal';
import { useSupabase } from '@/components/providers/supabase-provider';

interface CVUploadBackgroundProps {
  onUploadStart: (jobId: string, filename: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'uploaded' | 'error';
  file?: File;
  error?: string;
  jobId?: string;
}

export function CVUploadBackground({
  onUploadStart,
  onError,
  disabled = false,
}: CVUploadBackgroundProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const supabase = useSupabase();

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadState({
          status: 'error',
          error: validation.error,
        });
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: validation.error,
        });
        onError?.(validation.error || 'File validation failed');
        return;
      }

      // Start upload process
      setUploadState({
        status: 'uploading',
        file,
        error: undefined,
      });

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }

        // Create form data for upload
        const formData = new FormData();
        formData.append('file', file);

        console.log('Starting background CV processing', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        // Upload file and start background processing
        const response = await fetch('/api/cv/start-processing', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start CV processing');
        }

        const result = await response.json();

        if (!result.success || !result.jobId) {
          throw new Error('Failed to create processing job');
        }

        console.log('Background processing started', {
          jobId: result.jobId,
          status: result.status,
        });

        // Update state to uploaded
        setUploadState({
          status: 'uploaded',
          file,
          jobId: result.jobId,
        });

        toast({
          title: 'Upload Successful',
          description:
            'Your CV is now being processed in the background. This will take 30-40 seconds.',
        });

        // Notify parent component to start monitoring
        onUploadStart(result.jobId, file.name);
      } catch (error: any) {
        const errorMessage = error.message || 'Upload failed';

        setUploadState({
          status: 'error',
          error: errorMessage,
          file,
        });

        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: errorMessage,
        });

        onError?.(errorMessage);
      }
    },
    [supabase, toast, onUploadStart, onError]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && uploadState.status === 'idle') {
        setIsDragOver(true);
      }
    },
    [disabled, uploadState.status]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled || uploadState.status !== 'idle') return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, uploadState.status, handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    if (disabled || uploadState.status !== 'idle') return;
    fileInputRef.current?.click();
  }, [disabled, uploadState.status]);

  const handleReset = useCallback(() => {
    setUploadState({ status: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardContent className="p-6">
        {/* Upload Area */}
        <div
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 ${
            uploadState.status === 'idle'
              ? isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
              : uploadState.status === 'uploaded'
                ? 'border-green-500 bg-green-50'
                : uploadState.status === 'error'
                  ? 'border-red-500 bg-red-50'
                  : 'border-primary bg-primary/5'
          } ${
            disabled || uploadState.status !== 'idle'
              ? 'cursor-not-allowed opacity-50'
              : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.gif"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || uploadState.status !== 'idle'}
          />

          <motion.div
            key={uploadState.status}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Icon */}
            <div className="flex justify-center">
              {uploadState.status === 'uploading' ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : uploadState.status === 'uploaded' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : uploadState.status === 'error' ? (
                <AlertCircle className="h-8 w-8 text-red-500" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Main text */}
            <div>
              <p className="text-lg font-medium text-foreground">
                {uploadState.status === 'idle' &&
                  'Drop your CV here or click to browse'}
                {uploadState.status === 'uploading' && 'Uploading your CV...'}
                {uploadState.status === 'uploaded' &&
                  'Upload successful! Processing in background...'}
                {uploadState.status === 'error' && 'Upload failed'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {uploadState.status === 'idle' &&
                  'Supported formats: PDF, DOCX, TXT, Images (Max 10MB) • Background processing eliminates timeouts'}
                {uploadState.status === 'uploading' &&
                  'Creating background processing job...'}
                {uploadState.status === 'uploaded' &&
                  'Your CV will be processed in 30-40 seconds while you wait comfortably'}
                {uploadState.status === 'error' &&
                  (uploadState.error ||
                    'Please try again with a different file')}
              </p>
            </div>

            {/* File details */}
            {uploadState.file && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <File className="h-4 w-4" />
                <span>{uploadState.file.name}</span>
                <span>•</span>
                <span>{formatFileSize(uploadState.file.size)}</span>
                {uploadState.jobId && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-xs">
                      Job: {uploadState.jobId.split('-')[0]}...
                    </span>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Action Buttons */}
        {uploadState.status === 'error' && (
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={handleReset} variant="outline">
              Try Again
            </Button>
            <CVHelpModal />
          </div>
        )}

        {uploadState.status === 'idle' && (
          <div className="mt-4 text-center">
            <CVHelpModal />
          </div>
        )}

        {uploadState.status === 'uploaded' && (
          <div className="mt-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="mb-2 text-sm font-medium text-blue-700">
                🚀 Background Processing Started
              </p>
              <p className="text-sm text-blue-600">
                Your CV is being processed by our AI engine. You'll see
                real-time progress updates in the next screen.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
