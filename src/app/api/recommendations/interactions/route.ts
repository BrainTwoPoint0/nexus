import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

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
    const { jobId, interactionType, interactionData = {}, sessionId } = body;

    // Validate required fields
    if (!jobId || !interactionType) {
      return NextResponse.json(
        { error: 'Job ID and interaction type are required' },
        { status: 400 }
      );
    }

    // Validate interaction type
    const validInteractionTypes = [
      'recommendation_view',
      'recommendation_click',
      'recommendation_like',
      'recommendation_dislike',
      'job_application',
      'job_view',
      'job_save',
      'search_query',
      'filter_applied',
      'profile_update',
    ];

    if (!validInteractionTypes.includes(interactionType)) {
      return NextResponse.json(
        { error: 'Invalid interaction type' },
        { status: 400 }
      );
    }

    // Store the interaction
    const { data: interaction, error: insertError } = await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        job_id: jobId,
        interaction_type: interactionType,
        interaction_data: interactionData,
        session_id: sessionId || null,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: interaction,
      message: 'Interaction recorded successfully',
    });
  } catch (error) {
    console.error('Error recording interaction:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

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
    const interactionType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (interactionType) {
      query = query.eq('interaction_type', interactionType);
    }

    const { data: interactions, error: selectError } = await query;

    if (selectError) {
      throw selectError;
    }

    return NextResponse.json({
      success: true,
      data: interactions,
      meta: {
        total: interactions.length,
        offset,
        limit,
      },
    });
  } catch (error) {
    console.error('Error getting interactions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
