import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

/**
 * CV Job Status Polling Endpoint
 *
 * GET /api/cv/job-status/[jobId]
 * Returns current status and progress for a CV processing job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch job status (RLS will ensure user can only see their own jobs)
    const { data: job, error: jobError } = await supabase
      .from('cv_processing_jobs')
      .select(
        `
        id,
        filename,
        file_size,
        mime_type,
        status,
        progress,
        result,
        error,
        created_at,
        started_at,
        completed_at,
        updated_at
      `
      )
      .eq('id', jobId)
      .eq('user_id', user.id) // Extra safety check
      .single();

    if (jobError || !job) {
      console.error('Job not found or access denied:', jobError);
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    // Extract progress message from result if available
    const progressMessage =
      job.result?.progressMessage ||
      getDefaultProgressMessage(job.status, job.progress);

    // Calculate processing time
    const processingTime =
      job.started_at && job.completed_at
        ? Math.round(
            (new Date(job.completed_at).getTime() -
              new Date(job.started_at).getTime()) /
              1000
          )
        : job.started_at
          ? Math.round((Date.now() - new Date(job.started_at).getTime()) / 1000)
          : 0;

    // Return job status with additional computed fields
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        filename: job.filename,
        fileSize: job.file_size,
        mimeType: job.mime_type,
        status: job.status,
        progress: job.progress || 0,
        progressMessage,
        error: job.error,

        // Parsed CV data (only when completed)
        data: job.status === 'completed' ? job.result?.data : null,
        completenessAnalysis:
          job.status === 'completed' ? job.result?.completenessAnalysis : null,

        // Timestamps
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        updatedAt: job.updated_at,

        // Computed fields
        processingTimeSeconds: processingTime,
        isComplete: job.status === 'completed',
        isFailed: job.status === 'failed',
        isProcessing: job.status === 'processing',

        // Estimated time remaining (rough estimate)
        estimatedTimeRemainingSeconds:
          job.status === 'processing' ? Math.max(0, 40 - processingTime) : 0,
      },
    });
  } catch (error: any) {
    console.error('Job status polling error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}

/**
 * Get default progress message based on status and progress
 */
function getDefaultProgressMessage(status: string, progress?: number): string {
  if (status === 'pending') {
    return 'Waiting to start processing...';
  }

  if (status === 'processing') {
    if (!progress || progress < 10) {
      return 'Initializing CV processing...';
    } else if (progress < 30) {
      return 'Extracting text from your document...';
    } else if (progress < 70) {
      return 'Analyzing your professional experience with AI...';
    } else if (progress < 90) {
      return 'Generating your professional bio...';
    } else {
      return 'Finalizing your profile data...';
    }
  }

  if (status === 'completed') {
    return 'CV processing completed successfully!';
  }

  if (status === 'failed') {
    return 'CV processing failed. Please try again.';
  }

  return 'Processing status unknown';
}
