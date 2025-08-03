'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { CVDataReview } from '@/components/ui/cv-data-review';
import { useSupabase } from '@/components/providers/supabase-provider';
import { ExtractedCVData } from '@/lib/cv-parser-robust';
import { useToast } from '@/hooks/use-toast';

interface CVUploadData {
  content_extracted: string;
  file_path: string;
  original_filename: string;
}

function CVReviewContent() {
  const [cvData, setCVData] = useState<CVUploadData | null>(null);
  const [parsedData, setParsedData] = useState<ExtractedCVData | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalFileData, setOriginalFileData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const filePath = searchParams.get('filePath'); // Keep for backwards compatibility
  const supabase = useSupabase();
  const { toast } = useToast();

  useEffect(() => {
    const loadCVData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/sign-in');
          return;
        }

        // First try to load from enhanced onboarding data
        const onboardingData = sessionStorage.getItem('onboardingProfileData');
        if (onboardingData) {
          try {
            const profileData = JSON.parse(onboardingData);

            // Check if data is still fresh (within 1 hour)
            const isDataFresh =
              Date.now() - profileData.timestamp < 60 * 60 * 1000;

            if (isDataFresh && profileData.data) {
              console.log(
                'Loading merged profile data from enhanced onboarding'
              );

              // Create a mock CVUploadData for compatibility
              const mockCVData: CVUploadData = {
                content_extracted: JSON.stringify(profileData.data),
                file_path: 'ai-fusion',
                original_filename: 'merged-profile-data',
              };

              setCVData(mockCVData);
              setParsedData(profileData.data);
              setConfidence(
                profileData.data.completeness
                  ? profileData.data.completeness / 100
                  : 0.8
              );
              setOriginalFileData(profileData.dataSources || null);
              setIsLoading(false);
              return;
            }
          } catch (parseError) {
            console.error('Error parsing onboarding data:', parseError);
          }
        }

        // Try legacy sessionStorage format
        const sessionData = sessionStorage.getItem('cvReviewData');
        if (sessionData) {
          try {
            const reviewData = JSON.parse(sessionData);

            // Check if data is still fresh (within 1 hour)
            const isDataFresh =
              Date.now() - reviewData.timestamp < 60 * 60 * 1000;

            if (isDataFresh && reviewData.data) {
              console.log('Loading CV data from sessionStorage');

              // Create a mock CVUploadData for compatibility
              const mockCVData: CVUploadData = {
                content_extracted: JSON.stringify(reviewData.data),
                file_path: 'in-memory',
                original_filename: reviewData.filename || 'uploaded-cv',
              };

              setCVData(mockCVData);
              setParsedData(reviewData.data);
              setConfidence(reviewData.confidence || 0);
              setOriginalFileData(reviewData.originalFileData || null);
              setIsLoading(false);
              return;
            }
          } catch (parseError) {
            console.error('Error parsing sessionStorage data:', parseError);
          }
        }

        // Fallback to old system if filePath is provided
        if (filePath) {
          console.log(
            'Falling back to database lookup for filePath:',
            filePath
          );

          // Get the CV upload data from database (old system)
          const { data: cvUpload, error: cvError } = await supabase
            .from('documents')
            .select('*')
            .eq('profile_id', user.id)
            .eq('file_path', filePath)
            .eq('document_category', 'cv')
            .single();

          if (cvError || !cvUpload) {
            setError('CV data not found or not parsed yet');
            return;
          }

          // Parse the content_extracted field
          try {
            const extractedContent = JSON.parse(
              cvUpload.content_extracted || '{}'
            );

            if (extractedContent.status === 'failed') {
              setError(extractedContent.error || 'CV parsing failed');
              return;
            }

            if (
              extractedContent.status !== 'completed' ||
              !extractedContent.parsed_data
            ) {
              setError(
                'CV parsing is not yet complete. Please wait and try again.'
              );
              return;
            }

            setCVData(cvUpload);
            setParsedData(extractedContent.parsed_data);
            setConfidence(extractedContent.parsing_confidence || 0);
          } catch (parseError) {
            console.error('Error parsing CV data:', parseError);
            setError('Invalid CV data format');
            return;
          }
        } else {
          setError(
            'No CV data found. Please go back and upload your CV again.'
          );
          return;
        }
      } catch (error) {
        console.error('Error loading CV data:', error);
        setError('Failed to load CV data');
      } finally {
        setIsLoading(false);
      }
    };

    loadCVData();
  }, [filePath, supabase, router]);

  const handleApprove = async () => {
    if (!cvData || !parsedData) return;

    setIsApplying(true);
    try {
      const response = await fetch('/api/profile/apply-cv-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parsedData, originalFileData }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Profile Updated',
          description:
            result.message || 'Successfully applied CV data to your profile.',
        });

        // Clean up sessionStorage since data has been applied
        sessionStorage.removeItem('cvReviewData');

        // Redirect to dashboard since onboarding is now complete
        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Update Profile',
          description: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      console.error('Error applying CV data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to apply CV data to profile',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleReject = () => {
    // Redirect back to onboarding or profile
    router.push('/onboarding');
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

  if (error || !cvData) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {error || 'CV Data Not Found'}
            </h1>
            <p className="text-muted-foreground">
              The CV data could not be loaded. Please try uploading your CV
              again.
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="text-primary hover:underline"
            >
              Back to Onboarding
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Review Your CV Data
          </h1>
          <p className="text-muted-foreground">
            We&apos;ve extracted information from your CV. Review the details
            below and apply them to your profile.
          </p>
        </div>

        {parsedData && (
          <CVDataReview
            cvData={parsedData}
            confidence={confidence}
            filePath={cvData.file_path}
            onApprove={handleApprove}
            onReject={handleReject}
            isApplying={isApplying}
          />
        )}
      </div>
    </MainLayout>
  );
}

export default function CVReviewPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CVReviewContent />
    </Suspense>
  );
}
