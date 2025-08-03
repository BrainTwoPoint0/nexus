'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { useSupabase } from '@/components/providers/supabase-provider';
import { ExtractedCVData } from '@/lib/cv-parser';
import { useToast } from '@/hooks/use-toast';

interface CVUploadData {
  content_extracted: string;
  file_path: string;
  original_filename: string;
}

function CVReviewContent() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const filePath = searchParams.get('filePath'); // Keep for backwards compatibility
  const supabase = useSupabase();
  const { toast } = useToast();

  useEffect(() => {
    const autoApplyCVData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/sign-in');
          return;
        }

        let parsedData: ExtractedCVData | null = null;
        let originalFileData: Record<string, unknown> | null = null;

        // First try to load from enhanced onboarding data
        const onboardingData = sessionStorage.getItem('onboardingProfileData');
        if (onboardingData) {
          try {
            const profileData = JSON.parse(onboardingData);

            // Check if data is still fresh (within 1 hour)
            const isDataFresh =
              Date.now() - profileData.timestamp < 60 * 60 * 1000;

            if (isDataFresh && profileData.data) {
              console.log('Auto-applying merged profile data from enhanced onboarding');
              parsedData = profileData.data;
              originalFileData = profileData.dataSources || null;
            }
          } catch (parseError) {
            console.error('Error parsing onboarding data:', parseError);
          }
        }

        // Try legacy sessionStorage format if no onboarding data
        if (!parsedData) {
          const sessionData = sessionStorage.getItem('cvReviewData');
          if (sessionData) {
            try {
              const reviewData = JSON.parse(sessionData);

              // Check if data is still fresh (within 1 hour)
              const isDataFresh =
                Date.now() - reviewData.timestamp < 60 * 60 * 1000;

              if (isDataFresh && reviewData.data) {
                console.log('Auto-applying CV data from sessionStorage');
                parsedData = reviewData.data;
                originalFileData = reviewData.originalFileData || null;
              }
            } catch (parseError) {
              console.error('Error parsing sessionStorage data:', parseError);
            }
          }
        }

        // Fallback to old system if filePath is provided
        if (!parsedData && filePath) {
          console.log('Auto-applying CV data from database lookup for filePath:', filePath);

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
            setIsProcessing(false);
            return;
          }

          // Parse the content_extracted field
          try {
            const extractedContent = JSON.parse(
              cvUpload.content_extracted || '{}'
            );

            if (extractedContent.status === 'failed') {
              setError(extractedContent.error || 'CV parsing failed');
              setIsProcessing(false);
              return;
            }

            if (
              extractedContent.status !== 'completed' ||
              !extractedContent.parsed_data
            ) {
              setError('CV parsing is not yet complete. Please wait and try again.');
              setIsProcessing(false);
              return;
            }

            parsedData = extractedContent.parsed_data;
          } catch (parseError) {
            console.error('Error parsing CV data:', parseError);
            setError('Invalid CV data format');
            setIsProcessing(false);
            return;
          }
        }

        if (!parsedData) {
          setError('No CV data found. Please go back and upload your CV again.');
          setIsProcessing(false);
          return;
        }

        // Automatically apply the CV data
        console.log('Automatically applying CV data to profile...');
        
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
            description: result.message || 'Successfully applied CV data to your profile.',
          });

          // Clean up sessionStorage since data has been applied
          sessionStorage.removeItem('cvReviewData');
          sessionStorage.removeItem('onboardingProfileData');

          // Redirect to dashboard since onboarding is now complete
          router.push('/dashboard');
        } else {
          setError(result.error || 'Failed to apply CV data to profile');
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Error auto-applying CV data:', error);
        setError('Failed to apply CV data to profile');
        setIsProcessing(false);
      }
    };

    autoApplyCVData();
  }, [filePath, supabase, router, toast]);

  if (isProcessing) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="space-y-4 text-center">
            <LoadingSpinner size="lg" />
            <h1 className="text-2xl font-bold text-foreground">
              Applying CV Data
            </h1>
            <p className="text-muted-foreground">
              We're automatically applying your CV data to your profile...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Error Applying CV Data
            </h1>
            <p className="text-muted-foreground">
              {error}
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

  // This should never be reached since we either redirect or show error
  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
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
