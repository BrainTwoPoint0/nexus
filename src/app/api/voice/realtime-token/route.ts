import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabaseServer';

// Simple in-memory cache for tokens
const tokenCache = new Map<string, { token: string; expires: number }>();

export async function POST() {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = `realtime_token_${user.id}`;
    const cached = tokenCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      logger.debug(
        'Returning cached ephemeral token',
        { userId: user.id },
        'VOICE_API'
      );
      return NextResponse.json({
        client_secret: {
          value: cached.token,
        },
        cached: true,
      });
    }

    // Generate new ephemeral token from OpenAI
    logger.info(
      'Generating new ephemeral token',
      { userId: user.id },
      'VOICE_API'
    );

    const response = await fetch(
      'https://api.openai.com/v1/realtime/sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'alloy', // Using alloy voice as default
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error(
        'Failed to generate ephemeral token',
        { error, status: response.status },
        'VOICE_API'
      );
      return NextResponse.json(
        { error: 'Failed to generate token' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Cache the token for 45 seconds (expires after 60 seconds)
    tokenCache.set(cacheKey, {
      token: data.client_secret.value,
      expires: Date.now() + 45000,
    });

    // Clean up expired tokens periodically
    for (const [key, value] of tokenCache.entries()) {
      if (value.expires < Date.now()) {
        tokenCache.delete(key);
      }
    }

    logger.info(
      'Ephemeral token generated successfully',
      { userId: user.id },
      'VOICE_API'
    );

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error in realtime token generation', error, 'VOICE_API');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
