import { createClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { generateBioFromProfile } from '@/lib/bio-generator';

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('🤖 Generating bio for user:', user.id);

    // Get current profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get all related data for bio generation
    const [
      workHistoryResult,
      boardExperienceResult,
      educationResult,
      certificationsResult,
    ] = await Promise.all([
      supabase
        .from('work_experience')
        .select('*')
        .eq('profile_id', user.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('board_experience')
        .select('*')
        .eq('profile_id', user.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('education')
        .select('*')
        .eq('profile_id', user.id)
        .order('graduation_year', { ascending: false }),
      supabase
        .from('certifications')
        .select('*')
        .eq('profile_id', user.id)
        .order('issue_date', { ascending: false }),
    ]);

    const workHistory = workHistoryResult.data || [];
    const boardExperience = boardExperienceResult.data || [];
    const education = educationResult.data || [];
    const certifications = certificationsResult.data || [];

    console.log('Profile data summary:', {
      workHistory: workHistory.length,
      boardExperience: boardExperience.length,
      education: education.length,
      certifications: certifications.length,
      skills: profile.skills?.length || 0,
    });

    // Generate the bio
    const generatedBio = await generateBioFromProfile(
      profile,
      workHistory,
      boardExperience,
      education,
      certifications
    );

    // Save the generated bio to the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ bio: generatedBio })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile with bio:', updateError);
      return NextResponse.json(
        { error: 'Failed to save bio' },
        { status: 500 }
      );
    }

    console.log('✅ Bio generated and saved successfully');

    return NextResponse.json({
      message: 'Bio generated successfully',
      bio: generatedBio,
    });
  } catch (error) {
    console.error('Bio generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate bio' },
      { status: 500 }
    );
  }
}
