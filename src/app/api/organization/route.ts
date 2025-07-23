import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // LinkedIn-style: All users are individuals who can manage organizations
    // Remove user_type check - authorization is now based on organization membership

    // Get organization membership
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError) {
      return NextResponse.json(
        { error: 'Organization membership not found' },
        { status: 404 }
      );
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', membership.organization_id)
      .single();

    if (orgError) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organization,
      membership,
      permissions: {
        can_manage_organization: membership.can_manage_organization,
        can_post_jobs: membership.can_post_jobs,
        can_manage_applications: membership.can_manage_applications,
        can_invite_members: membership.can_invite_members,
      },
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization membership
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership.can_manage_organization) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const updateData = await request.json();

    // Update organization
    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organizations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.organization_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ organization: updatedOrganization });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
