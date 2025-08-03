'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { CheckCircle, Upload, User } from 'lucide-react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { CVUploadWithProgress } from '@/components/ui/cv-upload-with-progress';
import { CVDataPreview } from '@/components/ui/cv-data-preview';
import { CVDataReviewEditable } from '@/components/ui/cv-data-review-editable';
import { logger } from '@/lib/logger';

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [, setUserId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<
    'cv' | 'cv-preview' | 'review' | 'complete'
  >('cv');
  const [cvData, setCvData] = useState<any>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
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

  const handleCVComplete = ({
    data,
    confidence,
    filename,
    originalFile,
    completenessAnalysis,
  }: {
    data: any;
    confidence: number;
    filename: string;
    originalFile?: File;
    completenessAnalysis?: any;
  }) => {
    logger.debug(
      'CV processing completed',
      {
        filename,
        confidence,
        completeness: completenessAnalysis?.overallCompleteness,
      },
      'ONBOARDING'
    );

    setCvData({
      ...data,
      completenessAnalysis,
    });

    if (originalFile) {
      setOriginalFile(originalFile);
    }
    setCurrentStep('cv-preview');
  };

  const handleCVPreviewContinue = () => {
    setCurrentStep('review');
  };

  const handleCVError = (error: string) => {
    logger.error('CV processing error', { error }, 'ONBOARDING');
  };

  const [finalProfileData, setFinalProfileData] = useState<any>(null);

  const handleReviewSave = async (updatedData: any) => {
    setFinalProfileData(updatedData);
    await handleProfileSubmit(updatedData);
  };

  const handleReviewCancel = () => {
    setCurrentStep('cv-preview');
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
            <h1 className="text-3xl font-bold text-foreground">
              Build Your Executive Profile
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Upload your CV to build your executive profile
            </p>
          </div>

          {/* Steps Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Simple 2-Step Process</CardTitle>
              <p className="text-sm text-muted-foreground">
                Get your executive profile ready in minutes
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Step 1: CV Upload */}
                <div
                  className={`flex items-start gap-4 rounded-lg border p-4 ${
                    currentStep === 'cv' || currentStep === 'cv-preview'
                      ? 'border-primary bg-primary/5'
                      : cvData
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      currentStep === 'cv' || currentStep === 'cv-preview'
                        ? 'bg-primary text-white'
                        : cvData
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                    }`}
                  >
                    <Upload
                      className={`h-4 w-4 ${
                        currentStep === 'cv' || currentStep === 'cv-preview'
                          ? 'text-white'
                          : cvData
                            ? 'text-green-600'
                            : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="flex items-center gap-2 font-semibold">
                      Upload & Review CV Data
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                        Smart
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {currentStep === 'cv-preview'
                        ? 'Review extracted data from your CV'
                        : 'Upload your CV for AI-powered data extraction'}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {currentStep === 'cv' ? (
                      <span className="text-primary">Uploading</span>
                    ) : currentStep === 'cv-preview' ? (
                      <span className="text-primary">Reviewing</span>
                    ) : cvData ? (
                      <span className="text-green-600">✓ Complete</span>
                    ) : (
                      <span className="text-gray-500">Ready</span>
                    )}
                  </div>
                </div>

                {/* Step 2: Review & Submit */}
                <div
                  className={`flex items-start gap-4 rounded-lg border p-4 ${
                    currentStep === 'review'
                      ? 'border-primary bg-primary/5'
                      : currentStep === 'complete'
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      currentStep === 'review'
                        ? 'bg-primary text-white'
                        : currentStep === 'complete'
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                    }`}
                  >
                    <CheckCircle
                      className={`h-4 w-4 ${
                        currentStep === 'review'
                          ? 'text-white'
                          : currentStep === 'complete'
                            ? 'text-green-600'
                            : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="flex items-center gap-2 font-semibold">
                      {currentStep === 'complete'
                        ? 'Profile Complete'
                        : 'Review & Submit'}
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          currentStep === 'complete'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {currentStep === 'complete' ? 'Done' : 'Final'}
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {currentStep === 'complete'
                        ? 'Your board-ready profile has been successfully created'
                        : 'Review your complete profile before submission'}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {currentStep === 'complete' ? (
                      <span className="text-green-600">✓ Complete</span>
                    ) : currentStep === 'review' ? (
                      <span className="text-primary">Active</span>
                    ) : cvData ? (
                      <span className="text-gray-500">Ready</span>
                    ) : (
                      <span className="text-gray-400">Waiting</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Step Content */}
              {currentStep === 'cv' && (
                <div className="mt-6">
                  <CVUploadWithProgress
                    onComplete={handleCVComplete}
                    onError={handleCVError}
                    disabled={false}
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

              {currentStep === 'review' && (
                <div className="mt-6">
                  <CVDataReviewEditable
                    cvData={cvData}
                    onSave={handleReviewSave}
                    onCancel={handleReviewCancel}
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
