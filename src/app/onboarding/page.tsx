'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { CheckCircle, Upload, MessageCircle, User } from 'lucide-react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { CVUploadWithProgress } from '@/components/ui/cv-upload-with-progress';

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [, setUserProfile] = useState<Record<string, unknown> | null>(null);
  const [currentStep, setCurrentStep] = useState<
    'cv' | 'voice' | 'review' | 'complete'
  >('cv');
  const [cvData, setCvData] = useState<any>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [voiceEnhancedData, setVoiceEnhancedData] = useState<any>(null);
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

        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading profile:', error);
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
  }: {
    data: any;
    confidence: number;
    filename: string;
    originalFile?: File;
  }) => {
    console.log('CV processing completed:', { filename, confidence });
    setCvData(data);
    if (originalFile) {
      setOriginalFile(originalFile);
    }
    setCurrentStep('voice');
  };

  const handleCVError = (error: string) => {
    console.error('CV processing error:', error);
  };

  // const handleVoiceComplete = (enhancedData: any) => {
  //   console.log('Voice AI completion:', enhancedData);
  //   setVoiceEnhancedData(enhancedData);
  //   setCurrentStep('review');
  // };

  const handleSkipVoice = () => {
    // Use just CV data if voice is skipped
    setVoiceEnhancedData(cvData);
    setCurrentStep('review');
  };

  const handleProfileSubmit = async () => {
    // Store final profile data and redirect to review
    const finalData = voiceEnhancedData || cvData;
    const profileData = {
      data: finalData,
      confidence: 0.95,
      filename: voiceEnhancedData ? 'cv-voice-enhanced' : 'cv-only',
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

    sessionStorage.setItem('cvReviewData', JSON.stringify(profileDataWithFile));
    router.push('/profile/cv-review');
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
              Upload your CV and enhance it with AI-powered voice conversation
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
              <div className="space-y-4">
                {/* Step 1: CV Upload */}
                <div
                  className={`flex items-start gap-4 rounded-lg border p-4 ${currentStep === 'cv' ? 'border-primary bg-primary/5' : cvData ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${currentStep === 'cv' ? 'bg-primary text-white' : cvData ? 'bg-green-100' : 'bg-gray-100'}`}
                  >
                    <Upload
                      className={`h-4 w-4 ${currentStep === 'cv' ? 'text-white' : cvData ? 'text-green-600' : 'text-gray-400'}`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="flex items-center gap-2 font-semibold">
                      Upload CV/Resume
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                        Smart
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Upload your CV for AI-powered data extraction
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {currentStep === 'cv' ? (
                      <span className="text-primary">Active</span>
                    ) : cvData ? (
                      <span className="text-green-600">✓ Complete</span>
                    ) : (
                      <span className="text-gray-500">Ready</span>
                    )}
                  </div>
                </div>

                {/* Step 2: AI Voice Interview */}
                <div
                  className={`flex items-start gap-4 rounded-lg border p-4 ${currentStep === 'voice' ? 'border-primary bg-primary/5' : voiceEnhancedData ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${currentStep === 'voice' ? 'bg-primary text-white' : voiceEnhancedData ? 'bg-green-100' : 'bg-gray-100'}`}
                  >
                    <MessageCircle
                      className={`h-4 w-4 ${currentStep === 'voice' ? 'text-white' : voiceEnhancedData ? 'text-green-600' : 'text-gray-400'}`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="flex items-center gap-2 font-semibold">
                      AI Voice Interview
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
                        Interactive
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Enhance your profile through natural conversation
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {currentStep === 'voice' ? (
                      <span className="text-primary">Active</span>
                    ) : voiceEnhancedData ? (
                      <span className="text-green-600">✓ Complete</span>
                    ) : cvData ? (
                      <span className="text-gray-500">Ready</span>
                    ) : (
                      <span className="text-gray-400">Waiting</span>
                    )}
                  </div>
                </div>

                {/* Step 3: Review & Submit */}
                <div
                  className={`flex items-start gap-4 rounded-lg border p-4 ${currentStep === 'review' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${currentStep === 'review' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                  >
                    <CheckCircle
                      className={`h-4 w-4 ${currentStep === 'review' ? 'text-white' : 'text-gray-400'}`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="flex items-center gap-2 font-semibold">
                      Review & Submit
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                        Final
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Review your complete profile before submission
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {currentStep === 'review' ? (
                      <span className="text-primary">Active</span>
                    ) : voiceEnhancedData ||
                      (cvData && currentStep !== 'voice') ? (
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

              {currentStep === 'voice' && (
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Voice Interview</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Have a natural conversation to complete missing details
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="py-8 text-center">
                        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
                        <p className="mb-2 text-lg font-medium">
                          Voice AI Coming Soon
                        </p>
                        <p className="mb-4 text-sm text-muted-foreground">
                          We&apos;ll add natural conversation to fill profile
                          gaps
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={handleSkipVoice} className="flex-1">
                          Continue with CV Data
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep('cv')}
                        >
                          Back to CV
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 'review' && (
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Complete!</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Your profile data is ready for review and submission
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="py-8 text-center">
                        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                        <p className="mb-2 text-lg font-medium">
                          Ready to Review
                        </p>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Your profile has been processed and is ready for final
                          review
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleProfileSubmit}
                          className="flex-1"
                        >
                          Review & Submit Profile
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setCurrentStep(voiceEnhancedData ? 'voice' : 'cv')
                          }
                        >
                          Go Back
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
