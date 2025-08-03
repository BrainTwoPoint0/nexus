import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { mapCVDataToProfile } from '@/lib/cv-parser-robust';
import { generateProfessionalBio, type ProfileData } from '@/lib/bio-generator';
import { logger } from '@/lib/logger';

// Helper function to parse dates and handle "Present"
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;

  // Handle "Present" case - current positions should have null end_date
  if (
    dateString.toLowerCase() === 'present' ||
    dateString.toLowerCase() === 'current'
  ) {
    return null;
  }

  // Try to parse the date
  try {
    // Handle various date formats
    const dateStr = dateString.trim();

    // Handle year-only format (e.g., "2023")
    if (/^\d{4}$/.test(dateStr)) {
      return `${dateStr}-01-01`;
    }

    // Handle YYYY-MM format
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      return `${dateStr}-01`;
    }

    // Handle month year format (e.g., "March 2023", "Mar 2023")
    const monthYearMatch = dateStr.match(/^(\w+)\s+(\d{4})$/);
    if (monthYearMatch) {
      const [, month, year] = monthYearMatch;
      const date = new Date(`${month} 1, ${year}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    // Try standard Date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }

    logger.warn('Could not parse date', { dateString }, 'API');
    // Return null for unparseable dates - let the caller decide if a fallback is needed
    return null;
  } catch (error) {
    logger.warn('Date parsing error', { dateString, error }, 'API');
    return null; // Let caller handle missing dates
  }
}

// Helper function to truncate filename to fit database constraints
function truncateFilename(filename: string, maxLength: number = 45): string {
  if (filename.length <= maxLength) return filename;

  const extension = filename.split('.').pop() || '';
  const nameWithoutExtension = filename.substring(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExtension.substring(
    0,
    maxLength - extension.length - 1
  );

  return `${truncatedName}.${extension}`;
}

// Helper function to create a safe document title within database constraints
function createDocumentTitle(filename: string, maxLength: number = 45): string {
  const prefix = 'CV - ';
  const maxFilenameLength = maxLength - prefix.length;

  if (filename.length <= maxFilenameLength) {
    return `${prefix}${filename}`;
  }

  // Truncate filename to fit within the title limit
  const extension = filename.split('.').pop() || '';
  const nameWithoutExtension = filename.includes('.')
    ? filename.substring(0, filename.lastIndexOf('.'))
    : filename;

  const availableLength =
    maxFilenameLength - (extension ? extension.length + 1 : 0);
  const truncatedName = nameWithoutExtension.substring(
    0,
    Math.max(0, availableLength)
  );

  return extension
    ? `${prefix}${truncatedName}.${extension}`.substring(0, maxLength)
    : `${prefix}${truncatedName}`.substring(0, maxLength);
}

export async function POST(request: NextRequest) {
  logger.info('apply-cv-data API called', {}, 'API');

  try {
    // Authentication check
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Input validation
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      logger.error('Invalid JSON in request body', error, 'API');
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { parsedData, originalFileData } = requestBody;

    // Validate required fields
    if (!parsedData) {
      logger.warn('No CV data provided in request', {}, 'API');
      return NextResponse.json(
        { error: 'No CV data provided' },
        { status: 400 }
      );
    }

    // Validate file data if provided
    if (
      originalFileData &&
      (!originalFileData.name || !originalFileData.type)
    ) {
      logger.warn('Invalid file data structure', { originalFileData }, 'API');
      return NextResponse.json(
        { error: 'Invalid file data format' },
        { status: 400 }
      );
    }

    logger.debug(
      'Received data structure',
      {
        parsedDataKeys: parsedData ? Object.keys(parsedData) : null,
        workExperienceLength: parsedData?.workExperience?.length || 0,
        boardExperienceLength: parsedData?.boardExperience?.length || 0,
      },
      'API'
    );
    logger.debug(
      'Processing CV data',
      {
        workHistoryLength: parsedData?.workHistory?.length || 0,
        educationLength: parsedData?.education?.length || 0,
        hasOriginalFile: !!originalFileData,
        fileName: originalFileData?.name,
      },
      'API'
    );

    // Get current profile
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Map CV data to profile fields
    const profileData = mapCVDataToProfile(parsedData);

    // Extract skills from CV data
    let skillsToAdd: string[] = [];
    if (parsedData.skills && Array.isArray(parsedData.skills)) {
      skillsToAdd = parsedData.skills;
      console.log('📊 Skills extracted from CV:', skillsToAdd);
    }

    // Extract languages from CV data
    let languagesToAdd: string[] = [];
    if (parsedData.languages && Array.isArray(parsedData.languages)) {
      languagesToAdd = parsedData.languages;
      console.log('🌍 Languages extracted from CV:', languagesToAdd);
    }

    // Only update fields that are empty or not set
    const profileUpdates: Record<string, unknown> = {};

    Object.keys(profileData).forEach((key) => {
      const currentValue = currentProfile?.[key];
      const newValue = profileData[key];

      if (!currentValue && newValue) {
        profileUpdates[key] = newValue;
      }
    });

    // Add skills to profile updates if they exist
    if (skillsToAdd.length > 0) {
      // Merge with existing skills if any
      const existingSkills = currentProfile?.skills || [];
      const allSkills = [...existingSkills, ...skillsToAdd];
      // Remove duplicates
      const uniqueSkills = [...new Set(allSkills)];
      profileUpdates['skills'] = uniqueSkills;
      console.log('🎯 Final skills to save:', uniqueSkills);
    }

    // Add languages to profile updates if they exist
    if (languagesToAdd.length > 0) {
      // If we have languages from CV, use them and merge with existing non-default languages
      const existingLanguages = currentProfile?.languages || [];

      // If the existing languages are just the default ['English'], replace with CV languages
      // Otherwise, merge with existing languages
      let finalLanguages: string[];
      if (
        existingLanguages.length === 1 &&
        existingLanguages[0] === 'English'
      ) {
        // Replace default with CV languages (but keep English if it's in the CV)
        finalLanguages = languagesToAdd;
      } else {
        // Merge with existing non-default languages
        const allLanguages = [...existingLanguages, ...languagesToAdd];
        finalLanguages = [...new Set(allLanguages)];
      }

      profileUpdates['languages'] = finalLanguages;
      console.log('🌍 Final languages to save:', finalLanguages);
    }

    // Initialize updatedProfile
    let updatedProfile = currentProfile;

    // Mark onboarding as completed
    profileUpdates.onboarding_completed = true;

    // Update profile if there are changes
    if (Object.keys(profileUpdates).length > 0) {
      const { data: profileData, error: updateError } = await supabase
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
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      updatedProfile = profileData;
      console.log(
        '✅ Profile updated with fields:',
        Object.keys(profileUpdates)
      );
    } else {
      console.log(
        'ℹ️ No profile field updates needed - proceeding with work experience...'
      );
    }

    console.log('🔄 Starting work experience processing...');

    // Insert board experience first (if available)
    if (parsedData.boardExperience && parsedData.boardExperience.length > 0) {
      console.log('Inserting board experience:', parsedData.boardExperience);
      const boardExperienceData = parsedData.boardExperience.map(
        (exp: Record<string, unknown>) => {
          console.log('🔍 Processing board experience item:', exp);
          console.log(
            '- startDate:',
            exp.startDate,
            'type:',
            typeof exp.startDate
          );
          console.log('- endDate:', exp.endDate, 'type:', typeof exp.endDate);
          console.log('- isCurrent:', exp.isCurrent);

          const startDate = parseDate(exp.startDate as string);

          // Skip this entry if we don't have required fields
          if (!exp.organization || !exp.role || !startDate) {
            console.warn(
              'Skipping board experience entry due to missing required fields:',
              {
                organization: exp.organization,
                role: exp.role,
                startDate: startDate,
              }
            );
            return null;
          }

          return {
            profile_id: user.id,
            organization: exp.organization,
            role: exp.role,
            sector: exp.sector || null,
            start_date: startDate,
            end_date: exp.isCurrent ? null : parseDate(exp.endDate as string),
            is_current: exp.isCurrent || false,
            organization_size: exp.organizationSize || null,
            key_contributions: exp.keyContributions || null,
            compensation_disclosed: exp.compensationDisclosed || false,
            annual_fee: exp.annualFee || null,
          };
        }
      );

      // Filter out null entries (skipped due to missing required fields)
      const validBoardExperienceData = boardExperienceData.filter(
        (item: any) => item !== null
      );

      console.log('Board experience data to insert:', validBoardExperienceData);

      if (validBoardExperienceData.length > 0) {
        const { data: insertedBoard, error: boardError } = await supabase
          .from('board_experience')
          .insert(validBoardExperienceData)
          .select();

        if (boardError) {
          console.error('Board experience insert error:', boardError);
        } else {
          console.log('Board experience inserted successfully:', insertedBoard);
        }
      } else {
        console.log('No valid board experience data to insert');
      }
    } else {
      console.log('No board experience data found in parsedData');
    }

    // Insert regular work history (if available)
    if (parsedData.workHistory && parsedData.workHistory.length > 0) {
      console.log('Inserting work history:', parsedData.workHistory);
      const workHistoryData = parsedData.workHistory.map(
        (exp: Record<string, unknown>) => {
          console.log('🔍 Processing work history item:', exp);
          console.log(
            '- startDate:',
            exp.startDate,
            'type:',
            typeof exp.startDate
          );
          console.log('- endDate:', exp.endDate, 'type:', typeof exp.endDate);
          console.log('- isCurrent:', exp.isCurrent);

          const startDate = parseDate(exp.startDate as string);

          // Only skip if the entry is completely empty or meaningless
          // Allow entries with missing data so user can fill in during review
          if (!exp.company && !exp.title && !startDate) {
            console.warn('Skipping completely empty work experience entry');
            return null;
          }

          // Log entries with missing data for review purposes
          if (!exp.company || !exp.title || !startDate) {
            console.log(
              '⚠️ Work experience entry has missing data (will include for review):',
              {
                company: exp.company || '[Missing]',
                title: exp.title || '[Missing]',
                startDate: startDate || '[Missing]',
              }
            );
          }

          return {
            profile_id: user.id,
            company: exp.company,
            title: exp.title,
            start_date: startDate,
            end_date: exp.isCurrent ? null : parseDate(exp.endDate as string),
            is_current: exp.isCurrent || false,
            description: exp.description || null,
            key_achievements: exp.keyAchievements || null,
            company_size: exp.companySize || null,
            location: exp.location || null,
          };
        }
      );

      // Filter out null entries (skipped due to missing required fields)
      const validWorkHistoryData = workHistoryData.filter(
        (item: any) => item !== null
      );

      console.log('Work history data to insert:', validWorkHistoryData);

      if (validWorkHistoryData.length > 0) {
        const { data: insertedWorkHistory, error: workHistoryError } =
          await supabase
            .from('work_experience')
            .insert(validWorkHistoryData)
            .select();

        if (workHistoryError) {
          console.error('Work history insert error:', workHistoryError);
        } else {
          console.log(
            'Work history inserted successfully:',
            insertedWorkHistory
          );
        }
      } else {
        console.log('No valid work history data to insert');
      }
    } else {
      console.log('No work history data found in parsedData');
    }

    // Insert work experience with proper date handling (fallback for legacy data)
    if (parsedData.workExperience && parsedData.workExperience.length > 0) {
      console.log('Inserting work experience:', parsedData.workExperience);
      const workExperienceData = parsedData.workExperience.map(
        (exp: Record<string, unknown>) => {
          const startDate = parseDate(exp.startDate as string);
          const endDate = parseDate(exp.endDate as string);

          // Debug logging for responsibilities mapping
          console.log(`Mapping work experience for ${exp.company}:`);
          console.log(
            '  - startDate input:',
            exp.startDate,
            '-> parsed:',
            startDate
          );
          console.log('  - endDate input:', exp.endDate, '-> parsed:', endDate);
          console.log('  - responsibilities:', exp.responsibilities);
          console.log('  - achievements:', exp.achievements);

          // Map responsibilities to key_achievements
          let keyAchievements: string[] = [];
          if (exp.responsibilities) {
            keyAchievements = Array.isArray(exp.responsibilities)
              ? (exp.responsibilities as string[])
              : [exp.responsibilities as string];
          } else if (exp.achievements) {
            keyAchievements = Array.isArray(exp.achievements)
              ? (exp.achievements as string[])
              : [exp.achievements as string];
          }

          console.log('  - final key_achievements:', keyAchievements);

          return {
            profile_id: user.id,
            company: exp.company,
            title: exp.position,
            start_date: startDate,
            end_date: endDate,
            is_current: !endDate, // If no end date, it's current
            description: exp.description,
            key_achievements: keyAchievements,
            location: exp.location,
          };
        }
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

    // Store the original CV file in the documents bucket if provided
    let cvFileUrl = null;
    if (originalFileData) {
      try {
        console.log('Storing CV file:', originalFileData.name);

        // Convert base64 back to file buffer
        const fileBuffer = Uint8Array.from(atob(originalFileData.data), (c) =>
          c.charCodeAt(0)
        );

        // Create a unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const truncatedName = truncateFilename(originalFileData.name);
        const fileName = `cvs/${user.id}/${timestamp}-${truncatedName}`;

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

          // Store document record in documents table with truncated filename
          const truncatedOriginalName = truncateFilename(
            originalFileData.name,
            45
          );
          const truncatedStoredName = truncateFilename(fileName, 45);

          const { error: docError } = await supabase.from('documents').insert({
            profile_id: user.id,
            original_filename: truncatedOriginalName,
            stored_filename: truncatedStoredName,
            file_path: uploadData.path.substring(0, 255), // Ensure file_path doesn't exceed limit
            file_size: originalFileData.size || 0,
            file_type: (originalFileData.type || '').substring(0, 50), // Truncate file_type
            mime_type: (originalFileData.type || '').substring(0, 50), // Truncate mime_type
            document_category: 'resume',
            title: createDocumentTitle(originalFileData.name),
            version_number: 1,
            is_primary: true,
            is_current_version: true,
            password_protected: false,
            access_level: 'private',
            download_count: 0,
            tags: ['CV', 'Resume', 'Uploaded via Onboarding'],
            upload_user_agent: 'Nexus System', // Shortened to avoid any potential length issues
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

    // Use pre-generated bio from CV parsing or generate fallback
    let finalBio = null;
    try {
      if (parsedData.professionalBio) {
        console.log('✅ Using pre-generated bio from CV parsing');
        finalBio = parsedData.professionalBio;

        // Update the profile with the bio from CV parsing
        const { error: bioUpdateError } = await supabase
          .from('profiles')
          .update({ bio: finalBio })
          .eq('id', user.id);

        if (bioUpdateError) {
          console.error('Error updating bio:', bioUpdateError);
        } else {
          console.log('✅ Pre-generated bio saved to profile');
        }
      } else {
        console.log(
          '⚠️ No bio found in CV parsing, generating fallback bio...'
        );

        const bioData: ProfileData = {
          personalInfo: {
            name: `${updatedProfile?.first_name || ''} ${updatedProfile?.last_name || ''}`.trim(),
            title: updatedProfile?.title || undefined,
            location: updatedProfile?.location || undefined,
            email: updatedProfile?.email || undefined,
          },
          workExperience:
            parsedData.workExperience?.map(
              (exp: {
                company: string;
                position: string;
                startDate: string;
                endDate?: string;
                responsibilities?: string[];
                achievements?: string[];
                description?: string;
              }) => ({
                company: exp.company,
                title: exp.position,
                startDate: exp.startDate,
                endDate: exp.endDate,
                isCurrentRole:
                  !exp.endDate || exp.endDate.toLowerCase() === 'present',
                keyAchievements: exp.responsibilities || exp.achievements || [],
                description: exp.description,
              })
            ) || [],
          education:
            parsedData.education?.map(
              (edu: {
                institution: string;
                degree: string;
                endDate?: string;
                achievements?: string[] | string;
              }) => ({
                institution: edu.institution,
                degree: edu.degree,
                graduationYear: edu.endDate
                  ? parseInt(String(edu.endDate))
                  : undefined,
                honors: edu.achievements
                  ? Array.isArray(edu.achievements)
                    ? edu.achievements
                    : [edu.achievements]
                  : [],
              })
            ) || [],
          skills: parsedData.skills || [],
          certifications: parsedData.certifications || [],
          boardExperience: [], // Will be populated after AI categorization
        };

        finalBio = await generateProfessionalBio(bioData);

        if (finalBio && updatedProfile) {
          // Update the profile with the generated bio
          const { error: bioUpdateError } = await supabase
            .from('profiles')
            .update({ bio: finalBio })
            .eq('id', user.id);

          if (bioUpdateError) {
            console.error('Error updating fallback bio:', bioUpdateError);
          } else {
            console.log('✅ Fallback bio generated and saved');
          }
        }
      }
    } catch (bioError) {
      console.error('Error handling bio:', bioError);
      // Don't fail the entire process if bio handling fails
    }

    return NextResponse.json({
      message: 'CV data applied successfully',
      profile: updatedProfile,
      updated_fields: Object.keys(profileUpdates),
      cv_file_url: cvFileUrl,
      generated_bio: finalBio,
    });
  } catch (error) {
    console.error('CV data application error:', error);
    return NextResponse.json(
      { error: 'Failed to apply CV data' },
      { status: 500 }
    );
  }
}
