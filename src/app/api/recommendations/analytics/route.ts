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
    const type = searchParams.get('type'); // 'candidate' or 'job'
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      );
    }

    let analytics;

    if (type === 'candidate') {
      // Verify user has access to this candidate
      if (id !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      analytics = await matchingService.getCandidateAnalytics(id);
    } else if (type === 'job') {
      // Verify user has access to this job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id, organization_id')
        .eq('id', id)
        .single();

      if (jobError || !job) {
        return NextResponse.json(
          { error: 'Job not found or access denied' },
          { status: 403 }
        );
      }

      analytics = await matchingService.getJobAnalytics(id);
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "candidate" or "job"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        type,
        id,
      },
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Get platform-wide analytics (admin only)
export async function POST() {
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

    // Check if user is admin (you'll need to implement this check)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get platform analytics from the view
    const { data: analytics, error: analyticsError } = await supabase
      .from('enhanced_matching_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    if (analyticsError) {
      throw analyticsError;
    }

    // Get summary statistics
    const { data: summaryData, error: summaryError } = await supabase
      .from('nexus_scores')
      .select('overall_score, calculated_at')
      .gte(
        'calculated_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (summaryError) {
      throw summaryError;
    }

    const summary = {
      totalScores: summaryData.length,
      averageScore:
        summaryData.reduce((sum, s) => sum + s.overall_score, 0) /
        summaryData.length,
      highQualityMatches: summaryData.filter((s) => s.overall_score >= 80)
        .length,
      goodMatches: summaryData.filter((s) => s.overall_score >= 60).length,
      improvementTrend: 'stable', // Could calculate actual trend
    };

    return NextResponse.json({
      success: true,
      data: {
        dailyAnalytics: analytics,
        summary,
      },
      meta: {
        period: '30 days',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
