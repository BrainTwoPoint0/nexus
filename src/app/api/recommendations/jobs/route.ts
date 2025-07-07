import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { MatchingService } from '@/lib/matching-service';

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
    const candidateId = searchParams.get('candidateId') || user.id;
    const limit = parseInt(searchParams.get('limit') || '10');
    const minScore = parseInt(searchParams.get('minScore') || '50');
    const forceRecalculate = searchParams.get('refresh') === 'true';

    // Verify user has access to this candidate profile
    if (candidateId !== user.id) {
      // Check if user is admin or has permission to view this candidate
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', candidateId)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Candidate not found or access denied' },
          { status: 403 }
        );
      }
    }

    // Get job recommendations using server-side authenticated client
    const matchingService = new MatchingService(supabase);
    const recommendations = await matchingService.getJobRecommendations(
      candidateId,
      {
        minScore,
        maxResults: limit,
        forceRecalculate,
      }
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      meta: {
        total: recommendations.length,
        candidateId,
        minScore,
        limit,
      },
    });
  } catch (error) {
    console.error('Error getting job recommendations:', error);
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
    const { candidateId = user.id, forceRecalculate = false } = body;

    // Verify user has access to this candidate profile
    if (candidateId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Refresh scores for this candidate
    if (forceRecalculate) {
      const matchingService = new MatchingService(supabase);
      await matchingService.updateCandidateScores(candidateId);
    }

    return NextResponse.json({
      success: true,
      message: 'Job recommendations refreshed',
      candidateId,
    });
  } catch (error) {
    console.error('Error refreshing job recommendations:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
