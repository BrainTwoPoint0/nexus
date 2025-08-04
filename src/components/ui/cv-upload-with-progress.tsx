'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/components/providers/supabase-provider';
import { validateFile, formatFileSize } from '@/lib/cv-storage';
import { CVHelpModal } from '@/components/ui/cv-help-modal';

interface CVUploadWithProgressProps {
  onComplete: (result: {
    data: Record<string, unknown>;
    confidence: number;
    filename: string;
    originalFile?: File;
    completenessAnalysis?: any;
    voiceAIContext?: any;
  }) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  file?: File;
  error?: string;
  currentStep?: string;
  steps: ProgressStep[];
}

export function CVUploadWithProgress({
  onComplete,
  onError,
  disabled = false,
}: CVUploadWithProgressProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    steps: [
      {
        id: 'extract',
        name: 'AI Processing',
        status: 'pending',
        icon: Brain,
        description: 'Processing document with AI vision technology',
      },
      {
        id: 'parse',
        name: 'Data Analysis',
        status: 'pending',
        icon: FileText,
        description:
          'Analyzing completeness and planning Voice AI conversation',
      },
    ],
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const supabase = useSupabase();

  const updateStep = (stepId: string, status: ProgressStep['status']) => {
    setUploadState((prev) => ({
      ...prev,
      currentStep: stepId,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, status } : step
      ),
    }));
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadState((prev) => ({
          ...prev,
          status: 'error',
          error: validation.error,
        }));
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: validation.error,
        });
        onError?.(validation.error || 'File validation failed');
        return;
      }

      // Start upload process
      setUploadState((prev) => ({
        ...prev,
        status: 'uploading',
        progress: 0,
        file,
        error: undefined,
      }));

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }

        // Step 1: AI Processing with vision technology
        updateStep('extract', 'active');
        setUploadState((prev) => ({ ...prev, progress: 30 }));

        const formData = new FormData();
        formData.append('file', file);

        // Step 2: Completeness analysis and Voice AI planning
        updateStep('parse', 'active');
        setUploadState((prev) => ({ ...prev, progress: 70 }));

        const response = await fetch('/api/onboarding/parse-cv', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          console.error('❌ API Error - Status:', response.status);
          let errorData;
          try {
            errorData = await response.json();
            console.error('❌ API Error Data:', errorData);
          } catch (jsonError) {
            console.error(
              '❌ Failed to parse error response as JSON:',
              jsonError
            );
            throw new Error(
              `Server error (${response.status}): ${response.statusText}`
            );
          }
          throw new Error(errorData.error || 'Processing failed');
        }

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error(
            '❌ Failed to parse success response as JSON:',
            jsonError
          );
          throw new Error('Invalid response from server');
        }

        // Mark steps as completed
        updateStep('extract', 'completed');
        updateStep('parse', 'completed');

        // Complete
        setUploadState((prev) => ({
          ...prev,
          status: 'completed',
          progress: 100,
        }));

        const completenessPercentage =
          result.completenessAnalysis?.overallCompleteness || 0;
        const estimatedTime =
          result.completenessAnalysis?.estimatedConversationTime || 5;

        toast({
          title: 'CV Processing Complete',
          description: `Profile ${completenessPercentage}% complete. Voice interview: ~${estimatedTime} minutes.`,
        });

        // Call completion callback with extracted data and analysis
        onComplete({
          data: result.data,
          confidence: result.confidence,
          filename: result.filename,
          originalFile: file,
          completenessAnalysis: result.completenessAnalysis,
          voiceAIContext: result.voiceAIContext,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Upload failed';

        // Mark current step as error
        if (uploadState.currentStep) {
          updateStep(uploadState.currentStep, 'error');
        }

        setUploadState((prev) => ({
          ...prev,
          status: 'error',
          error: errorMessage,
        }));

        toast({
          variant: 'destructive',
          title: 'CV Processing Failed',
          description: errorMessage,
        });

        onError?.(errorMessage);
      }
    },
    [supabase, toast, onComplete, onError, uploadState.currentStep]
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
    setUploadState({
      status: 'idle',
      progress: 0,
      steps: uploadState.steps.map((step) => ({ ...step, status: 'pending' })),
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadState.steps]);

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
              : 'border-muted-foreground/25'
          } ${disabled || uploadState.status !== 'idle' ? 'cursor-not-allowed opacity-50' : ''} ${uploadState.status === 'error' ? 'border-red-500 bg-red-50' : ''} ${uploadState.status === 'completed' ? 'border-green-500 bg-green-50' : ''} `}
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
              {uploadState.status === 'uploading' ||
              uploadState.status === 'processing' ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : uploadState.status === 'completed' ? (
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
                {uploadState.status === 'uploading' && 'Processing your CV...'}
                {uploadState.status === 'processing' && 'Analyzing with AI...'}
                {uploadState.status === 'completed' &&
                  'CV processed successfully!'}
                {uploadState.status === 'error' && 'Processing failed'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {uploadState.status === 'idle' &&
                  'Supported formats: PDF, DOCX, TXT (Max 10MB) • Processed securely in-memory'}
                {(uploadState.status === 'uploading' ||
                  uploadState.status === 'processing') &&
                  'Extracting your professional information with AI...'}
                {uploadState.status === 'completed' &&
                  'Your profile information has been extracted and is ready to review'}
                {uploadState.status === 'error' &&
                  (uploadState.error ||
                    'Please try again with a different file format')}
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
          </motion.div>
        </div>

        {/* Progress Steps */}
        <AnimatePresence>
          {(uploadState.status === 'uploading' ||
            uploadState.status === 'processing' ||
            uploadState.status === 'completed' ||
            uploadState.status === 'error') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 space-y-4"
            >
              {/* Progress Bar */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {uploadState.progress}%
                  </span>
                </div>
                <Progress value={uploadState.progress} className="h-2" />
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {uploadState.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        step.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : step.status === 'active'
                            ? 'bg-primary/10 text-primary'
                            : step.status === 'error'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-400'
                      } `}
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : step.status === 'active' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : step.status === 'error' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          step.status === 'active'
                            ? 'text-primary'
                            : step.status === 'completed'
                              ? 'text-green-600'
                              : step.status === 'error'
                                ? 'text-red-600'
                                : 'text-muted-foreground'
                        }`}
                      >
                        {step.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
      </CardContent>
    </Card>
  );
}
