import { NextRequest, NextResponse } from 'next/server';
import {
  debugLinkedInAccess,
  checkLinkedInProfileAccess,
} from '@/lib/linkedin-debug';

export async function POST(request: NextRequest) {
  try {
    const { profileUrl } = await request.json();

    if (!profileUrl) {
      return NextResponse.json(
        {
          error: 'LinkedIn profile URL is required',
        },
        { status: 400 }
      );
    }

    console.log('🔍 Debugging LinkedIn access for:', profileUrl);

    // Run accessibility check
    const accessCheck = await checkLinkedInProfileAccess(profileUrl);

    // Run detailed debug tests
    const debugResults = await debugLinkedInAccess(profileUrl);

    return NextResponse.json({
      profileUrl,
      accessCheck,
      debugResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ LinkedIn debug error:', error);
    return NextResponse.json(
      { error: 'Failed to debug LinkedIn profile access' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'LinkedIn Debug API - Use POST with profileUrl',
  });
}
