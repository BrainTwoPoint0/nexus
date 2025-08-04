import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript, extractedData, cvData } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    logger.info(
      'Saving voice session',
      {
        userId: user.id,
        transcriptLength: transcript.length,
        hasExtractedData: !!extractedData,
      },
      'VOICE_API'
    );

    // Calculate session duration (estimate based on transcript length)
    const sessionDuration = Math.ceil(transcript.length / 10); // Rough estimate: 10 chars per second

    // Save to voice_sessions table
    const { data: session, error: sessionError } = await supabase
      .from('voice_sessions')
      .insert({
        user_id: user.id,
        transcript,
        profile_updates: extractedData || {},
        session_data: {
          cv_data: cvData,
          timestamp: new Date().toISOString(),
          source: 'onboarding',
        },
        completed: true,
        session_duration: sessionDuration,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      logger.error('Failed to save voice session', sessionError, 'VOICE_API');
      return NextResponse.json(
        { error: 'Failed to save session' },
        { status: 500 }
      );
    }

    logger.info(
      'Voice session saved successfully',
      {
        userId: user.id,
        sessionId: session.id,
      },
      'VOICE_API'
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: 'Session saved successfully',
    });
  } catch (error) {
    logger.error('Error saving voice session', error, 'VOICE_API');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
