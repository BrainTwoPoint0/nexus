import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { matchingService } from '@/lib/matching-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const minScore = parseInt(searchParams.get('minScore') || '50');
    const forceRecalculate = searchParams.get('refresh') === 'true';

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this job (organization check)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(
        'id, organization_id, title, sector, location, organization:organizations(name)'
      )
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get candidate recommendations
    const recommendations = await matchingService.getCandidateRecommendations(
      jobId,
      {
        minScore,
        maxResults: limit,
        forceRecalculate,
      }
    );

    // Add job details to each recommendation
    const enrichedRecommendations = recommendations.map((rec) => ({
      ...rec,
      job: {
        title: job.title || 'Unknown Position',
        organization: job.organization?.[0]?.name || 'Unknown Organization',
        sector: job.sector || 'Unknown',
        location: job.location || 'Unknown',
      },
    }));

    return NextResponse.json({
      success: true,
      data: enrichedRecommendations,
      meta: {
        total: enrichedRecommendations.length,
        jobId,
        minScore,
        limit,
      },
    });
  } catch (error) {
    console.error('Error getting candidate recommendations:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, forceRecalculate = false } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Refresh scores for this job
    if (forceRecalculate) {
      await matchingService.updateJobScores(jobId);
    }

    return NextResponse.json({
      success: true,
      message: 'Candidate recommendations refreshed',
      jobId,
    });
  } catch (error) {
    console.error('Error refreshing candidate recommendations:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
