import { NextResponse } from 'next/server';
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

    const organizationId = membership.organization_id;

    // Get active roles count
    const { count: activeRolesCount } = await supabase
      .from('jobs')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    // Get job IDs for this organization
    const { data: jobIds } = await supabase
      .from('jobs')
      .select('id')
      .eq('organization_id', organizationId);

    const jobIdArray = jobIds?.map((job) => job.id) || [];

    // Get total applications count
    const { count: totalApplicationsCount } = await supabase
      .from('applications')
      .select('id', { count: 'exact' })
      .in('job_id', jobIdArray);

    // Get interviews scheduled count
    const { count: interviewsCount } = await supabase
      .from('applications')
      .select('id', { count: 'exact' })
      .eq('status', 'interviewing')
      .in('job_id', jobIdArray);

    // Get recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentApplicationsCount } = await supabase
      .from('applications')
      .select('id', { count: 'exact' })
      .gte('applied_at', sevenDaysAgo.toISOString())
      .in('job_id', jobIdArray);

    // Get shortlisted candidates count
    const { count: shortlistedCount } = await supabase
      .from('applications')
      .select('id', { count: 'exact' })
      .eq('status', 'shortlisted')
      .in('job_id', jobIdArray);

    // Get job statistics by status
    const { data: jobStats } = await supabase
      .from('jobs')
      .select('status, applications_count, views_count')
      .eq('organization_id', organizationId);

    const jobStatusStats =
      jobStats?.reduce(
        (acc, job) => {
          acc[job.status] = (acc[job.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    // Get application statistics by status
    const { data: applicationStats } = await supabase
      .from('applications')
      .select('status')
      .in('job_id', jobIdArray);

    const applicationStatusStats =
      applicationStats?.reduce(
        (acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('applications')
      .select(
        `
        id,
        status,
        applied_at,
        updated_at,
        job:job_id(
          id,
          title
        ),
        candidate:profile_id(
          id,
          first_name,
          last_name
        )
      `
      )
      .in('job_id', jobIdArray)
      .order('updated_at', { ascending: false })
      .limit(10);

    // Calculate profile views (mock data for now)
    const profileViews =
      jobStats?.reduce((acc, job) => acc + (job.views_count || 0), 0) || 0;

    const stats = {
      overview: {
        active_roles: activeRolesCount || 0,
        total_applications: totalApplicationsCount || 0,
        interviews_scheduled: interviewsCount || 0,
        profile_views: profileViews,
        recent_applications: recentApplicationsCount || 0,
        shortlisted_candidates: shortlistedCount || 0,
      },
      job_status: jobStatusStats,
      application_status: applicationStatusStats,
      recent_activity: recentActivity || [],
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
