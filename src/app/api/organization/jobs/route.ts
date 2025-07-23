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

    if (membershipError) {
      return NextResponse.json(
        { error: 'Organization membership not found' },
        { status: 404 }
      );
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch jobs for the organization
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(
        `
        *,
        applications!inner(
          id,
          status,
          applied_at,
          candidate:profile_id(
            id,
            first_name,
            last_name,
            title,
            avatar_url
          )
        )
      `
      )
      .eq('organization_id', membership.organization_id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobsError) {
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    // Get job statistics
    const { data: stats } = await supabase
      .from('jobs')
      .select('status, applications_count')
      .eq('organization_id', membership.organization_id);

    const jobStats =
      stats?.reduce(
        (acc, job) => {
          acc[job.status] = (acc[job.status] || 0) + 1;
          acc.total_applications =
            (acc.total_applications || 0) + (job.applications_count || 0);
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    return NextResponse.json({
      jobs: jobs || [],
      stats: jobStats,
      pagination: {
        limit,
        offset,
        total: jobs?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching organization jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (membershipError || !membership.can_post_jobs) {
      return NextResponse.json(
        { error: 'Insufficient permissions to post jobs' },
        { status: 403 }
      );
    }

    const jobData = await request.json();

    // Create job slug from title
    const slug = jobData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create new job
    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert({
        organization_id: membership.organization_id,
        posted_by: user.id,
        slug,
        status: 'draft',
        ...jobData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }

    return NextResponse.json({ job: newJob }, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
