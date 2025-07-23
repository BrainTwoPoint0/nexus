import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { mapCVDataToProfile } from '@/lib/cv-parser';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { parsedData, originalFileData } = await request.json();

    console.log('Received originalFileData:', originalFileData ? 'Yes' : 'No');
    console.log(
      'originalFileData details:',
      originalFileData
        ? { name: originalFileData.name, size: originalFileData.size }
        : 'None'
    );

    if (!parsedData) {
      return NextResponse.json(
        { error: 'No CV data provided' },
        { status: 400 }
      );
    }

    // Get current profile
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Map CV data to profile fields
    const profileData = mapCVDataToProfile(parsedData);

    // Only update fields that are empty or not set
    const profileUpdates: Record<string, unknown> = {};

    Object.keys(profileData).forEach((key) => {
      const currentValue = currentProfile?.[key];
      const newValue = profileData[key];

      if (!currentValue && newValue) {
        profileUpdates[key] = newValue;
      }
    });

    if (Object.keys(profileUpdates).length === 0) {
      return NextResponse.json({ message: 'No new data to update' });
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...profileUpdates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Insert work experience
    if (parsedData.workExperience && parsedData.workExperience.length > 0) {
      console.log('Inserting work experience:', parsedData.workExperience);
      const workExperienceData = parsedData.workExperience.map(
        (exp: Record<string, unknown>) => ({
          profile_id: user.id,
          company: exp.company,
          title: exp.position,
          start_date: exp.startDate,
          end_date: exp.endDate || null,
          is_current: !exp.endDate,
          description: exp.description,
          key_achievements: exp.achievements
            ? Array.isArray(exp.achievements)
              ? exp.achievements
              : [exp.achievements]
            : [],
          location: exp.location,
        })
      );

      console.log('Work experience data to insert:', workExperienceData);

      const { data: insertedWork, error: workError } = await supabase
        .from('work_experience')
        .insert(workExperienceData)
        .select();

      if (workError) {
        console.error('Work experience insert error:', workError);
      } else {
        console.log('Work experience inserted successfully:', insertedWork);
      }
    } else {
      console.log('No work experience data found in parsedData');
    }

    // Insert education
    if (parsedData.education && parsedData.education.length > 0) {
      console.log('Inserting education:', parsedData.education);
      const educationData = parsedData.education.map(
        (edu: Record<string, unknown>) => ({
          profile_id: user.id,
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.field,
          graduation_year: edu.endDate ? parseInt(String(edu.endDate)) : null,
          gpa: edu.gpa,
          honors: edu.achievements
            ? Array.isArray(edu.achievements)
              ? edu.achievements
              : [edu.achievements]
            : [],
        })
      );

      console.log('Education data to insert:', educationData);

      const { data: insertedEducation, error: eduError } = await supabase
        .from('education')
        .insert(educationData)
        .select();

      if (eduError) {
        console.error('Education insert error:', eduError);
      } else {
        console.log('Education inserted successfully:', insertedEducation);
      }
    } else {
      console.log('No education data found in parsedData');
    }

    // Insert certifications
    if (parsedData.certifications && parsedData.certifications.length > 0) {
      console.log('Inserting certifications:', parsedData.certifications);
      const certificationData = parsedData.certifications.map(
        (cert: string) => ({
          profile_id: user.id,
          name: cert,
          issuer: 'Unknown', // Will be parsed better in future
        })
      );

      console.log('Certification data to insert:', certificationData);

      const { data: insertedCertifications, error: certError } = await supabase
        .from('certifications')
        .insert(certificationData)
        .select();

      if (certError) {
        console.error('Certification insert error:', certError);
      } else {
        console.log(
          'Certifications inserted successfully:',
          insertedCertifications
        );
      }
    } else {
      console.log('No certifications data found in parsedData');
    }

    // Store the original CV file in the cv-resumes bucket if provided
    let cvFileUrl = null;
    if (originalFileData) {
      try {
        console.log('Storing CV file:', originalFileData.name);

        // Convert base64 back to file buffer
        const fileBuffer = Uint8Array.from(atob(originalFileData.data), (c) =>
          c.charCodeAt(0)
        );

        // Create a unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `cvs/${user.id}/${timestamp}-${originalFileData.name}`;

        // Upload to documents bucket in cvs folder
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, fileBuffer, {
            contentType: originalFileData.type,
            metadata: {
              originalName: originalFileData.name,
              uploadedAt: new Date().toISOString(),
              userId: user.id,
            },
          });

        if (uploadError) {
          console.error('CV file upload error:', uploadError);
        } else {
          console.log('CV file uploaded successfully:', uploadData.path);
          cvFileUrl = uploadData.path;

          // Store document record in documents table
          const { error: docError } = await supabase.from('documents').insert({
            profile_id: user.id,
            original_filename: originalFileData.name,
            stored_filename: fileName,
            file_path: uploadData.path,
            file_size: originalFileData.size || 0,
            file_type: originalFileData.type,
            mime_type: originalFileData.type,
            document_category: 'resume',
            title: `CV - ${originalFileData.name}`,
            version_number: 1,
            is_primary: true,
            is_current_version: true,
            password_protected: false,
            access_level: 'private',
            download_count: 0,
            tags: ['CV', 'Resume', 'Uploaded via Onboarding'],
            upload_user_agent: 'Nexus Onboarding System',
            upload_date: new Date().toISOString(),
          });

          if (docError) {
            console.error('Document record insert error:', docError);
          } else {
            console.log('Document record created successfully');
          }
        }
      } catch (fileError) {
        console.error('Error processing CV file:', fileError);
      }
    }

    return NextResponse.json({
      message: 'CV data applied successfully',
      profile: updatedProfile,
      updated_fields: Object.keys(profileUpdates),
      cv_file_url: cvFileUrl,
    });
  } catch (error) {
    console.error('CV data application error:', error);
    return NextResponse.json(
      { error: 'Failed to apply CV data' },
      { status: 500 }
    );
  }
}
