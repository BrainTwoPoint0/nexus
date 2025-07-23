import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    console.log('Processing CV data for user:', user.id, 'filePath:', filePath);

    // Get the parsed CV data
    const { data: cvUpload, error: cvError } = await supabase
      .from('documents')
      .select('*')
      .eq('profile_id', user.id)
      .eq('file_path', filePath)
      .eq('document_category', 'cv')
      .single();

    if (cvError || !cvUpload || !cvUpload.parsed_data) {
      console.error('CV data not found:', cvError);
      return NextResponse.json(
        { error: 'CV data not found or not parsed yet' },
        { status: 404 }
      );
    }

    console.log('Found CV data:', cvUpload.parsed_data);

    // Get current profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile not found:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const parsedData = cvUpload.parsed_data as Record<string, unknown>;

    // Simple profile updates - only basic fields, no complex data_sources
    const profileUpdates: Record<string, unknown> = {};

    if (parsedData.firstName && !currentProfile.first_name) {
      profileUpdates.first_name = parsedData.firstName;
    }
    if (parsedData.lastName && !currentProfile.last_name) {
      profileUpdates.last_name = parsedData.lastName;
    }
    if (parsedData.email && !currentProfile.email) {
      profileUpdates.email = parsedData.email;
    }
    if (parsedData.phone && !currentProfile.phone) {
      profileUpdates.phone = parsedData.phone;
    }
    if (parsedData.location && !currentProfile.location) {
      profileUpdates.location = parsedData.location;
    }
    if (parsedData.title && !currentProfile.title) {
      profileUpdates.title = parsedData.title;
    }
    if (parsedData.summary && !currentProfile.bio) {
      profileUpdates.bio = parsedData.summary;
    }
    if (parsedData.linkedInUrl && !currentProfile.linkedin_url) {
      profileUpdates.linkedin_url = parsedData.linkedInUrl;
    }
    if (parsedData.website && !currentProfile.website) {
      profileUpdates.website = parsedData.website;
    }

    // Skills (merge with existing)
    if (parsedData.skills && Array.isArray(parsedData.skills)) {
      const existingSkills = currentProfile.skills || [];
      const newSkills = parsedData.skills.filter(
        (skill: string) => !existingSkills.includes(skill)
      );
      if (newSkills.length > 0) {
        profileUpdates.skills = [...existingSkills, ...newSkills];
      }
    }

    // Languages (merge with existing)
    if (parsedData.languages && Array.isArray(parsedData.languages)) {
      const existingLanguages = currentProfile.languages || [];
      const newLanguages = parsedData.languages.filter(
        (lang: string) => !existingLanguages.includes(lang)
      );
      if (newLanguages.length > 0) {
        profileUpdates.languages = [...existingLanguages, ...newLanguages];
      }
    }

    // Extract current company from work experience
    if (parsedData.workExperience && Array.isArray(parsedData.workExperience)) {
      const currentJob = parsedData.workExperience.find(
        (job: Record<string, unknown>) => !job.endDate
      );
      if (currentJob && !currentProfile.company) {
        profileUpdates.company = currentJob.company;
      }
    }

    // Mark onboarding as completed
    profileUpdates.onboarding_completed = true;
    profileUpdates.onboarding_step = 100;
    profileUpdates.updated_at = new Date().toISOString();

    console.log('Profile updates to apply:', profileUpdates);

    // Update profile
    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to update profile',
            details: updateError.message,
            code: updateError.code,
            hint: updateError.hint,
            data: profileUpdates,
          },
          { status: 500 }
        );
      }

      console.log('Profile updated successfully');
    }

    return NextResponse.json({
      success: true,
      message: 'CV data successfully applied to profile (basic fields only)',
      appliedFields: Object.keys(profileUpdates),
      summary: {
        profileFieldsUpdated: Object.keys(profileUpdates).length,
        workHistoryRecords: 0, // Not implemented in simple version
        educationRecords: 0, // Not implemented in simple version
        certificationsAdded: 0, // Not implemented in simple version
      },
    });
  } catch (error) {
    console.error('Unexpected error applying CV data:', error);
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
