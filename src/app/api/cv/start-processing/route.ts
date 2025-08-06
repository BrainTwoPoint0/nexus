import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

/**
 * CV Background Processing Start Endpoint
 *
 * Creates a job record and triggers Lambda asynchronously
 * Returns immediately with job ID for client polling
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Please upload TXT, PDF, DOCX, or image files (JPG, PNG, WEBP, GIF).',
        },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Please upload files smaller than 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to base64 for storage
    const fileBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(fileBuffer).toString('base64');

    // Create job record in database (matching existing schema)
    const { data: job, error: jobError } = await supabase
      .from('cv_processing_jobs')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending',
        progress: 0,
        result: {
          fileData: {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64Data,
          },
          progressMessage: 'File uploaded, preparing for processing...',
        },
      })
      .select('id')
      .single();

    if (jobError || !job) {
      console.error('Failed to create job record:', jobError);
      return NextResponse.json(
        { error: 'Failed to create processing job' },
        { status: 500 }
      );
    }

    console.log('Created CV processing job', {
      jobId: job.id,
      userId: user.id,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    // Trigger Lambda function asynchronously (fire-and-forget)
    if (process.env.LAMBDA_CV_PARSER_URL) {
      // Don't await - let it run in background
      triggerLambdaProcessing(job.id, {
        fileBuffer: base64Data,
        fileName: file.name,
        mimeType: file.type,
      }).catch((error) => {
        console.error('Failed to trigger Lambda processing:', error);
        // Update job status to failed if Lambda trigger fails
        supabase
          .from('cv_processing_jobs')
          .update({
            status: 'failed',
            error: `Failed to start processing: ${error.message}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id)
          .then(() => {
            console.log(
              'Updated job status to failed after Lambda trigger failure'
            );
          });
      });
    } else {
      console.error('LAMBDA_CV_PARSER_URL not configured');
      await supabase
        .from('cv_processing_jobs')
        .update({
          status: 'failed',
          error: 'CV processing service not configured',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return NextResponse.json(
        { error: 'CV processing service not available' },
        { status: 503 }
      );
    }

    // Return immediately with job ID
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'pending',
      message:
        'CV processing started. You can check progress using the job ID.',
    });
  } catch (error: any) {
    console.error('CV processing start error:', error);
    return NextResponse.json(
      { error: 'Failed to start CV processing' },
      { status: 500 }
    );
  }
}

/**
 * Trigger Lambda function for background processing
 */
async function triggerLambdaProcessing(
  jobId: string,
  fileData: {
    fileBuffer: string;
    fileName: string;
    mimeType: string;
  }
) {
  const lambdaUrl = process.env.LAMBDA_CV_PARSER_URL!;

  console.log('Triggering Lambda processing', {
    jobId,
    fileName: fileData.fileName,
    lambdaUrl: lambdaUrl.substring(0, 50) + '...',
  });

  const response = await fetch(lambdaUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobId, // Pass job ID to Lambda
      fileBuffer: fileData.fileBuffer,
      fileName: fileData.fileName,
      mimeType: fileData.mimeType,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Lambda invocation failed: ${response.status} ${errorText}`
    );
  }

  const result = await response.json();
  console.log('Lambda triggered successfully', {
    jobId,
    lambdaResponse: result.success ? 'Success' : 'Failed',
  });

  return result;
}
