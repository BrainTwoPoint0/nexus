import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('supabase-auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

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

    if (membershipError || !membership.can_manage_applications) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const jobId = searchParams.get('job_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get job IDs for this organization first
    const { data: orgJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('organization_id', membership.organization_id);

    const jobIds = orgJobs?.map((job) => job.id) || [];

    if (jobIds.length === 0) {
      return NextResponse.json({
        applications: [],
        stats: {},
        pagination: { limit, offset, total: 0 },
      });
    }

    // Build query
    let query = supabase
      .from('applications')
      .select(
        `
        *,
        job:job_id(
          id,
          title,
          role_type
        ),
        candidate:candidate_id(
          id,
          first_name,
          last_name,
          title,
          company,
          avatar_url,
          linkedin_url,
          location,
          sector_preferences,
          skills
        )
      `
      )
      .in('job_id', jobIds)
      .order('applied_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data: applications, error: applicationsError } = await query;

    if (applicationsError) {
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    // Get application statistics
    const { data: stats } = await supabase
      .from('applications')
      .select('status')
      .in('job_id', jobIds);

    const applicationStats =
      stats?.reduce(
        (acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    return NextResponse.json({
      applications: applications || [],
      stats: applicationStats,
      pagination: {
        limit,
        offset,
        total: applications?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('supabase-auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

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

    if (membershipError || !membership.can_manage_applications) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const {
      application_id,
      status: newStatus,
      recruiter_notes,
      rating,
    } = await request.json();

    // Verify application belongs to organization
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(
        `
        *,
        job:job_id(organization_id)
      `
      )
      .eq('id', application_id)
      .single();

    if (
      appError ||
      application.job.organization_id !== membership.organization_id
    ) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update application
    const updateData: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    if (newStatus) {
      updateData.status = newStatus;
      if (newStatus === 'reviewed') {
        updateData.reviewed_at = new Date().toISOString();
      }
      if (newStatus === 'offered' || newStatus === 'rejected') {
        updateData.decision_made_at = new Date().toISOString();
      }
    }

    if (recruiter_notes) {
      updateData.recruiter_notes = recruiter_notes;
    }

    if (rating) {
      updateData.rating = rating;
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', application_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ application: updatedApplication });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
