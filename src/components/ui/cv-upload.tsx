'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/components/providers/supabase-provider';
import {
  uploadCV,
  validateFile,
  formatFileSize,
  CVUploadResult,
} from '@/lib/cv-storage';

interface CVUploadProps {
  onUploadComplete?: (result: CVUploadResult) => void;
  onUploadStart?: () => void;
  disabled?: boolean;
  className?: string;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  file?: File;
  result?: CVUploadResult;
  error?: string;
}

export function CVUpload({
  onUploadComplete,
  onUploadStart,
  disabled = false,
  className = '',
}: CVUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const supabase = useSupabase();

  const handleFileSelect = useCallback(
    async (file: File) => {
      console.log('CVUpload: File selected:', file.name, file.size, file.type);

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        console.log('CVUpload: File validation failed:', validation.error);
        setUploadState({
          status: 'error',
          progress: 0,
          error: validation.error,
        });
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: validation.error,
        });
        return;
      }

      console.log('CVUpload: File validation passed, starting upload');

      // Start upload
      setUploadState({
        status: 'uploading',
        progress: 10,
        file,
      });

      onUploadStart?.();

      try {
        // Get current user
        console.log('CVUpload: Getting current user');
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }
        console.log('CVUpload: User authenticated:', user.id);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 80),
          }));
        }, 300);

        // Upload file
        console.log('CVUpload: Calling uploadCV function');
        const result = await uploadCV(supabase, user.id, file);
        console.log('CVUpload: Upload result:', result);

        clearInterval(progressInterval);

        if (result.success) {
          console.log(
            'CVUpload: Upload successful, file path:',
            result.filePath
          );
          setUploadState({
            status: 'success',
            progress: 100,
            file,
            result,
          });

          toast({
            title: 'Upload Successful',
            description: `${file.name} has been uploaded and is being processed.`,
          });

          // Automatically trigger parsing
          if (result.filePath) {
            try {
              const parseResponse = await fetch('/api/profile/parse-cv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: result.filePath }),
              });

              if (parseResponse.ok) {
                const parseResult = await parseResponse.json();
                toast({
                  title: 'CV Parsed Successfully',
                  description: `Profile data extracted with ${(parseResult.confidence * 100).toFixed(1)}% confidence`,
                });
              }
            } catch (parseError) {
              console.error('CV parsing failed:', parseError);
            }
          }

          onUploadComplete?.(result);
        } else {
          setUploadState({
            status: 'error',
            progress: 0,
            file,
            error: result.error,
          });

          toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: result.error,
          });
        }
      } catch (error) {
        setUploadState({
          status: 'error',
          progress: 0,
          file,
          error: error instanceof Error ? error.message : 'Upload failed',
        });

        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        });
      }
    },
    [supabase, onUploadStart, onUploadComplete, toast]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
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

      if (disabled || uploadState.status === 'uploading') return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, uploadState.status, handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('CVUpload: File input change detected');
      const files = e.target.files;
      console.log('CVUpload: Files:', files ? files.length : 'null');
      if (files && files.length > 0) {
        console.log('CVUpload: Selected file:', files[0].name);
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    console.log(
      'CVUpload: Click detected, disabled:',
      disabled,
      'status:',
      uploadState.status
    );
    if (disabled || uploadState.status === 'uploading') return;
    console.log('CVUpload: Triggering file input click');
    fileInputRef.current?.click();
  }, [disabled, uploadState.status]);

  const handleReset = useCallback(() => {
    setUploadState({
      status: 'idle',
      progress: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'uploading':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Upload className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (uploadState.status) {
      case 'uploading':
        return 'Uploading your CV...';
      case 'success':
        return `${uploadState.file?.name} uploaded successfully!`;
      case 'error':
        return uploadState.error || 'Upload failed';
      default:
        return 'Drop your CV here or click to browse';
    }
  };

  const getStatusSubtext = () => {
    switch (uploadState.status) {
      case 'uploading':
        return 'Please wait while we process your file';
      case 'success':
        return 'Your CV is being parsed for profile information';
      case 'error':
        return 'Please try again or contact support if the problem persists';
      default:
        return 'Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)';
    }
  };

  return (
    <Card className={`relative ${className}`}>
      <CardContent className="p-6">
        <div
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${uploadState.status === 'error' ? 'border-red-500 bg-red-50' : ''} ${uploadState.status === 'success' ? 'border-green-500 bg-green-50' : ''} `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || uploadState.status === 'uploading'}
          />

          <motion.div
            key={uploadState.status}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Icon */}
            <div className="flex justify-center">{getStatusIcon()}</div>

            {/* Main text */}
            <div>
              <p className="text-lg font-medium text-foreground">
                {getStatusText()}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {getStatusSubtext()}
              </p>
            </div>

            {/* File details */}
            {uploadState.file && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <File className="h-4 w-4" />
                <span>{uploadState.file.name}</span>
                <span>•</span>
                <span>{formatFileSize(uploadState.file.size)}</span>
              </div>
            )}

            {/* Progress bar */}
            {uploadState.status === 'uploading' && (
              <div className="mx-auto max-w-xs">
                <Progress value={uploadState.progress} className="h-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {uploadState.progress}% complete
                </p>
              </div>
            )}

            {/* Action buttons */}
            {uploadState.status !== 'idle' &&
              uploadState.status !== 'uploading' && (
                <div className="mt-4 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>

                  {uploadState.status === 'error' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (uploadState.file) {
                          handleFileSelect(uploadState.file);
                        }
                      }}
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              )}
          </motion.div>
        </div>

        {/* Help text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Your CV will be parsed to extract work experience, education, and
            skills. All data remains private and secure.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
