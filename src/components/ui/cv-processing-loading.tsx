'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Brain,
  User,
  CheckCircle,
  AlertCircle,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-react';

interface CVProcessingLoadingProps {
  jobId: string;
  filename: string;
  onComplete: (data: any, completenessAnalysis: any) => void;
  onError: (error: string) => void;
}

interface JobStatus {
  id: string;
  filename: string;
  status: string;
  progress: number;
  progressMessage: string;
  error?: string;
  data?: any;
  completenessAnalysis?: any;
  processingTimeSeconds: number;
  estimatedTimeRemainingSeconds: number;
  isComplete: boolean;
  isFailed: boolean;
}

export function CVProcessingLoading({
  jobId,
  filename,
  onComplete,
  onError,
}: CVProcessingLoadingProps) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Professional tips to show during processing
  const processingTips = [
    {
      icon: <Target className="h-5 w-5" />,
      title: 'Profile Optimization',
      description:
        "We're analyzing your experience to highlight key achievements and board-ready qualifications.",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Executive Presence',
      description:
        'Your professional bio is being crafted to showcase leadership experience and strategic impact.',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Board Readiness',
      description:
        'We identify governance experience and skills that make you an attractive board candidate.',
    },
    {
      icon: <Brain className="h-5 w-5" />,
      title: 'AI Enhancement',
      description:
        'Advanced AI ensures no important detail is missed while organizing your professional story.',
    },
  ];

  // Poll job status every 2 seconds
  useEffect(() => {
    if (!isPolling || !jobId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/cv/job-status/${jobId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch job status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success && result.job) {
          setJobStatus(result.job);

          // Handle completion
          if (result.job.isComplete && result.job.data) {
            setIsPolling(false);
            onComplete(result.job.data, result.job.completenessAnalysis);
          }

          // Handle failure
          if (result.job.isFailed) {
            setIsPolling(false);
            onError(result.job.error || 'CV processing failed');
          }
        }
      } catch (error: any) {
        console.error('Error polling job status:', error);
        setIsPolling(false);
        onError(`Failed to check processing status: ${error.message}`);
      }
    };

    // Poll immediately, then every 2 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [isPolling, jobId, onComplete, onError]);

  // Rotate tips every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % processingTips.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [processingTips.length]);

  const getProgressIcon = (progress: number) => {
    if (progress < 30) return <FileText className="h-6 w-6 sm:h-8 sm:w-8" />;
    if (progress < 70) return <Brain className="h-6 w-6 sm:h-8 sm:w-8" />;
    return <User className="h-6 w-6 sm:h-8 sm:w-8" />;
  };

  const currentTip = processingTips[currentTipIndex];

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardContent className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10"
          >
            {getProgressIcon(jobStatus?.progress || 0)}
          </motion.div>

          <h2 className="mb-2 text-xl sm:text-2xl font-bold text-foreground">
            Processing Your CV
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Extracting and enhancing your professional profile
          </p>
        </div>

        {/* Progress Section */}
        <div className="space-y-4 sm:space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                {jobStatus?.progressMessage || 'Initializing...'}
              </span>
              <span className="text-sm text-muted-foreground">
                {jobStatus?.progress || 0}%
              </span>
            </div>
            <Progress value={jobStatus?.progress || 0} className="h-3" />
          </div>

          {/* File Info */}
          <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-medium truncate max-w-[200px] sm:max-w-none">{filename}</span>
          </div>

          {/* Processing Tips */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTipIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 rounded-lg bg-blue-100 p-1.5 sm:p-2 text-blue-600">
                  <div className="h-4 w-4 sm:h-5 sm:w-5">{currentTip.icon}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 text-sm sm:text-base font-semibold text-gray-900">
                    {currentTip.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {currentTip.description}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Processing Steps Visualization */}
          <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
            <div
              className={`rounded-lg p-2 sm:p-3 text-center transition-all ${
                (jobStatus?.progress || 0) >= 30
                  ? 'border border-green-200 bg-green-50'
                  : (jobStatus?.progress || 0) >= 10
                    ? 'border border-primary/20 bg-primary/5'
                    : 'border border-gray-200 bg-gray-50'
              }`}
            >
              <div
                className={`mx-auto mb-1 sm:mb-2 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full ${
                  (jobStatus?.progress || 0) >= 30
                    ? 'bg-green-100 text-green-600'
                    : (jobStatus?.progress || 0) >= 10
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {(jobStatus?.progress || 0) >= 30 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </div>
              <p className="text-[10px] sm:text-xs font-medium">Extract</p>
            </div>

            <div
              className={`rounded-lg p-2 sm:p-3 text-center transition-all ${
                (jobStatus?.progress || 0) >= 70
                  ? 'border border-green-200 bg-green-50'
                  : (jobStatus?.progress || 0) >= 30
                    ? 'border border-primary/20 bg-primary/5'
                    : 'border border-gray-200 bg-gray-50'
              }`}
            >
              <div
                className={`mx-auto mb-1 sm:mb-2 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full ${
                  (jobStatus?.progress || 0) >= 70
                    ? 'bg-green-100 text-green-600'
                    : (jobStatus?.progress || 0) >= 30
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {(jobStatus?.progress || 0) >= 70 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </div>
              <p className="text-[10px] sm:text-xs font-medium">Analyze</p>
            </div>

            <div
              className={`rounded-lg p-2 sm:p-3 text-center transition-all ${
                (jobStatus?.progress || 0) >= 95
                  ? 'border border-green-200 bg-green-50'
                  : (jobStatus?.progress || 0) >= 70
                    ? 'border border-primary/20 bg-primary/5'
                    : 'border border-gray-200 bg-gray-50'
              }`}
            >
              <div
                className={`mx-auto mb-1 sm:mb-2 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full ${
                  (jobStatus?.progress || 0) >= 95
                    ? 'bg-green-100 text-green-600'
                    : (jobStatus?.progress || 0) >= 70
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {(jobStatus?.progress || 0) >= 95 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </div>
              <p className="text-[10px] sm:text-xs font-medium">Enhance</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 border-t pt-4 sm:pt-6 text-center">
          <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-muted-foreground px-2">
            Your data is processed securely and never shared with third parties
          </p>

          {/* Cancel option (if needed for UX) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsPolling(false);
              onError('Processing cancelled by user');
            }}
            className="text-xs h-8 px-3"
          >
            Cancel Processing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
