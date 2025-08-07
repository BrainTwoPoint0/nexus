import { createClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user has LinkedIn identity
    const identities = user.identities || [];
    const hasLinkedInIdentity = identities.some(
      (identity) => identity.provider === 'linkedin_oidc'
    );

    if (!hasLinkedInIdentity) {
      return NextResponse.json(
        { error: 'User did not sign up via LinkedIn' },
        { status: 400 }
      );
    }

    // Update the profile to set is_verified = true
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating verification status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile verified successfully',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
