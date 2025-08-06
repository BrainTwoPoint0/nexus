'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { CheckCircle, Upload, User, Mic, FileCheck } from 'lucide-react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { CVUploadBackground } from '@/components/ui/cv-upload-background';
import { CVProcessingLoading } from '@/components/ui/cv-processing-loading';
import { CVDataPreview } from '@/components/ui/cv-data-preview';
import { VoiceConversationRealtime } from '@/components/ui/voice-conversation-realtime';
import { ProfileReview } from '@/components/ui/profile-review';
import { logger } from '@/lib/logger';

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [, setUserId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<
    | 'cv'
    | 'cv-processing'
    | 'cv-preview'
    | 'voice-interview'
    | 'review'
    | 'complete'
  >('cv');
  const [cvData, setCvData] = useState<any>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [processingFilename, setProcessingFilename] = useState<string>('');
  const router = useRouter();
  const supabase = useSupabase();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/sign-in');
          return;
        }

        // Skip profile loading entirely - onboarding will create the profile
        logger.debug(
          'User authenticated, starting onboarding',
          { userId: user.id },
          'ONBOARDING'
        );
        setUserId(user.id);
        setUserProfile(null); // No profile yet, onboarding will create it
        setIsLoading(false);
      } catch (error) {
        logger.error('Error loading user', error, 'ONBOARDING');
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [supabase, router]);

  // Handle background processing start
  const handleUploadStart = (jobId: string, filename: string) => {
    logger.debug(
      'Background CV processing started',
      { jobId, filename },
      'ONBOARDING'
    );

    setProcessingJobId(jobId);
    setProcessingFilename(filename);
    setCurrentStep('cv-processing');
  };

  // Handle background processing completion
  const handleProcessingComplete = (data: any, completenessAnalysis: any) => {
    logger.debug(
      'Background CV processing completed',
      {
        filename: processingFilename,
        completeness: completenessAnalysis?.overallCompleteness,
      },
      'ONBOARDING'
    );

    setCvData({
      ...data,
      completenessAnalysis,
    });

    setCurrentStep('cv-preview');
  };

  const handleCVPreviewContinue = async () => {
    // Move to voice interview step
    if (cvData) {
      setCurrentStep('voice-interview');
    }
  };

  const handleCVError = (error: string) => {
    logger.error('CV processing error', { error }, 'ONBOARDING');
    // Reset to upload state on error
    setCurrentStep('cv');
    setProcessingJobId(null);
    setProcessingFilename('');
  };

  const [finalProfileData, setFinalProfileData] = useState<any>(null);

  const handleVoiceComplete = async (
    transcript: string,
    extractedData: any
  ) => {
    logger.info(
      'Voice interview completed',
      {
        transcriptLength: transcript.length,
        extractedDataKeys: Object.keys(extractedData || {}),
        extractedData: extractedData,
      },
      'ONBOARDING'
    );

    // Merge CV data with voice-extracted data
    const mergedData = { ...cvData, ...extractedData };
    logger.info(
      'Data merged for review',
      {
        cvDataKeys: Object.keys(cvData || {}),
        extractedDataKeys: Object.keys(extractedData || {}),
        mergedDataKeys: Object.keys(mergedData || {}),
        mergedData: mergedData,
      },
      'ONBOARDING'
    );

    setFinalProfileData(mergedData);

    // Save the voice session (but not the profile yet)
    try {
      await fetch('/api/voice/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          extractedData,
          cvData,
        }),
      });
    } catch (error) {
      logger.error('Failed to save voice session', error, 'ONBOARDING');
    }

    // Move to review step instead of auto-saving
    setCurrentStep('review');
  };

  const handleVoiceError = (error: string) => {
    logger.error('Voice interview error', { error }, 'ONBOARDING');
    // Fallback to review step if voice fails
    if (cvData) {
      setFinalProfileData(cvData);
      setCurrentStep('review');
    }
  };

  const handleProfileSubmit = async (profileDataToSubmit?: any) => {
    try {
      setIsLoading(true);

      // Get final data from CV
      const finalData = profileDataToSubmit || finalProfileData || cvData;

      logger.info(
        'Saving profile data to database',
        {
          hasCvData: !!cvData,
          finalDataKeys: finalData ? Object.keys(finalData) : [],
        },
        'ONBOARDING'
      );

      // Prepare original file data if available
      let originalFileData = null;
      if (originalFile) {
        const fileBuffer = await originalFile.arrayBuffer();
        const base64Data = btoa(
          String.fromCharCode(...new Uint8Array(fileBuffer))
        );
        originalFileData = {
          name: originalFile.name,
          type: originalFile.type,
          size: originalFile.size,
          data: base64Data,
        };
      }

      // Save profile data to database via API (match expected API parameters)
      const response = await fetch('/api/profile/apply-cv-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parsedData: finalData,
          originalFileData: originalFileData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile data');
      }

      const result = await response.json();
      logger.info('Profile data saved successfully', result, 'ONBOARDING');

      // Also store in sessionStorage for review page
      const profileData = {
        data: finalData,
        confidence: 0.95,
        filename: 'cv-only',
        timestamp: Date.now(),
      };

      // Store the original file data as base64 if available
      let profileDataWithFile: any = profileData;
      if (originalFile) {
        const fileBuffer = await originalFile.arrayBuffer();
        const base64File = btoa(
          String.fromCharCode(...new Uint8Array(fileBuffer))
        );
        profileDataWithFile = {
          ...profileData,
          originalFileData: {
            name: originalFile.name,
            type: originalFile.type,
            size: originalFile.size,
            data: base64File,
          },
        };
      }

      sessionStorage.setItem(
        'cvReviewData',
        JSON.stringify(profileDataWithFile)
      );
      setCurrentStep('complete');

      // Redirect to dashboard after successful onboarding
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      logger.error('Failed to save profile data', error, 'ONBOARDING');
      alert('Failed to save profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
            >
              <User className="h-8 w-8 text-primary" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Build Your Executive Profile
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground">
              Upload your CV and complete a brief voice interview
            </p>
          </div>

          {/* Steps Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Simple 3-Step Process</CardTitle>
              <p className="text-sm text-muted-foreground">
                Get your executive profile ready in minutes
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                {/* Step 1: CV Upload */}
                <div
                  className={`flex items-center gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 ${currentStep === 'cv' ||
                    currentStep === 'cv-processing' ||
                    currentStep === 'cv-preview'
                    ? 'border-primary bg-primary/5'
                    : cvData
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200'
                    }`}
                >
                  <div
                    className={`flex h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full ${currentStep === 'cv' ||
                      currentStep === 'cv-processing' ||
                      currentStep === 'cv-preview'
                      ? 'bg-primary text-white'
                      : cvData
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                      }`}
                  >
                    <Upload
                      className={`h-5 w-5 sm:h-4 sm:w-4 ${currentStep === 'cv' ||
                        currentStep === 'cv-processing' ||
                        currentStep === 'cv-preview'
                        ? 'text-white'
                        : cvData
                          ? 'text-green-600'
                          : 'text-gray-400'
                        }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <h3 className="font-semibold text-sm">
                        Upload & Process CV
                      </h3>
                      <span className="inline-flex rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] sm:text-xs text-green-700 w-fit">
                        Background AI
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      {currentStep === 'cv-preview'
                        ? 'Review extracted data from your CV'
                        : currentStep === 'cv-processing'
                          ? 'AI is processing your CV in the background'
                          : 'Upload your CV for background AI processing'}
                    </p>
                  </div>
                  <div className="text-xs font-normal flex-shrink-0">
                    {currentStep === 'cv' ? (
                      <span className="text-primary text-xs">Ready</span>
                    ) : currentStep === 'cv-processing' ? (
                      <span className="text-primary text-xs">Processing</span>
                    ) : currentStep === 'cv-preview' ? (
                      <span className="text-primary text-xs">Reviewing</span>
                    ) : cvData ? (
                      <span className="text-green-600 text-xs">✓ Complete</span>
                    ) : (
                      <span className="text-gray-500 text-xs">Ready</span>
                    )}
                  </div>
                </div>

                {/* Step 2: Voice Interview */}
                <div
                  className={`flex items-center gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 ${currentStep === 'voice-interview'
                    ? 'border-primary bg-primary/5'
                    : currentStep === 'complete'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200'
                    }`}
                >
                  <div
                    className={`flex h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full ${currentStep === 'voice-interview'
                      ? 'bg-primary text-white'
                      : currentStep === 'complete'
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                      }`}
                  >
                    <Mic
                      className={`h-5 w-5 sm:h-4 sm:w-4 ${currentStep === 'voice-interview'
                        ? 'text-white'
                        : currentStep === 'complete'
                          ? 'text-green-600'
                          : 'text-gray-400'
                        }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <h3 className="font-semibold text-sm">
                        Voice Interview
                      </h3>
                      <span className="inline-flex rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] sm:text-xs text-purple-700 w-fit">
                        AI-Powered
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      Quick conversation to complete your profile details
                    </p>
                  </div>
                  <div className="text-xs font-normal flex-shrink-0">
                    {currentStep === 'voice-interview' ? (
                      <span className="text-primary text-xs">In Progress</span>
                    ) : currentStep === 'complete' ? (
                      <span className="text-green-600 text-xs">✓ Complete</span>
                    ) : cvData ? (
                      <span className="text-gray-500 text-xs">Ready</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Waiting</span>
                    )}
                  </div>
                </div>


                {/* Step 3: Review & Edit */}
                <div
                  className={`flex items-center gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 ${currentStep === 'review'
                    ? 'border-primary bg-primary/5'
                    : currentStep === 'complete'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200'
                    }`}
                >
                  <div
                    className={`flex h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full ${currentStep === 'review'
                      ? 'bg-primary text-white'
                      : currentStep === 'complete'
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                      }`}
                  >
                    <FileCheck
                      className={`h-5 w-5 sm:h-4 sm:w-4 ${currentStep === 'review'
                        ? 'text-white'
                        : currentStep === 'complete'
                          ? 'text-green-600'
                          : 'text-gray-400'
                        }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <h3 className="font-semibold text-sm">
                        Review & Edit
                      </h3>
                      <span className="inline-flex rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] sm:text-xs text-blue-700 w-fit">
                        Final Step
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      Review your information and save your profile
                    </p>
                  </div>
                  <div className="text-xs font-normal flex-shrink-0">
                    {currentStep === 'review' ? (
                      <span className="text-primary text-xs">In Progress</span>
                    ) : currentStep === 'complete' ? (
                      <span className="text-green-600 text-xs">✓ Complete</span>
                    ) : finalProfileData ? (
                      <span className="text-gray-500 text-xs">Ready</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Waiting</span>
                    )}
                  </div>
                </div>

                {/* Step 4: Create Profile
                <div
                  className={`flex items-start gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 ${currentStep === 'complete'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200'
                    }`}
                >
                  <div
                    className={`flex h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full ${currentStep === 'complete'
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                      }`}
                  >
                    <CheckCircle
                      className={`h-5 w-5 sm:h-4 sm:w-4 ${currentStep === 'complete'
                        ? 'text-green-600'
                        : 'text-gray-400'
                        }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <h3 className="font-semibold text-sm">
                        {currentStep === 'complete'
                          ? 'Profile Complete'
                          : 'Create Profile'}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {currentStep === 'complete'
                        ? 'Your board-ready profile has been successfully created'
                        : ''}
                    </p>
                  </div>
                  <div className="text-xs font-normal flex-shrink-0">
                    {currentStep === 'complete' ? (
                      <span className="text-green-600 text-xs">✓ Complete</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Waiting</span>
                    )}
                  </div>
                </div> */}
              </div>

              {/* Current Step Content */}
              {currentStep === 'cv' && (
                <div className="mt-6">
                  <CVUploadBackground
                    onUploadStart={handleUploadStart}
                    onError={handleCVError}
                    disabled={false}
                  />
                </div>
              )}

              {currentStep === 'cv-processing' && processingJobId && (
                <div className="mt-6">
                  <CVProcessingLoading
                    jobId={processingJobId}
                    filename={processingFilename}
                    onComplete={handleProcessingComplete}
                    onError={handleCVError}
                  />
                </div>
              )}

              {currentStep === 'cv-preview' && cvData && (
                <div className="mt-6">
                  <CVDataPreview
                    cvData={cvData}
                    onContinue={handleCVPreviewContinue}
                  />
                </div>
              )}

              {currentStep === 'voice-interview' && cvData && (
                <div className="mt-6">
                  <VoiceConversationRealtime
                    cvData={cvData}
                    onComplete={handleVoiceComplete}
                    onError={handleVoiceError}
                  />
                </div>
              )}


              {currentStep === 'review' && finalProfileData && (
                <div className="mt-6">
                  <ProfileReview
                    profileData={finalProfileData}
                    onSave={handleProfileSubmit}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {currentStep === 'complete' && (
                <div className="mt-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Profile Created Successfully!
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Your board-ready profile has been saved. You&apos;ll now be
                    redirected to your dashboard to explore opportunities.
                  </p>
                  <div className="mt-4">
                    <LoadingSpinner size="sm" />
                    <p className="mt-2 text-sm text-gray-500">
                      Redirecting to dashboard...
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
