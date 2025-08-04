import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { mapCVDataToProfile } from '@/lib/cv-parser';
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

    // Add detailed logging of the actual data structure received
    console.log(
      '🔍 FULL PARSED DATA STRUCTURE:',
      JSON.stringify(parsedData, null, 2)
    );
    console.log('📊 DATA ANALYSIS:');
    console.log(
      '  - Has workHistory:',
      !!parsedData?.workHistory,
      'Length:',
      parsedData?.workHistory?.length || 0
    );
    console.log(
      '  - Has workExperience:',
      !!parsedData?.workExperience,
      'Length:',
      parsedData?.workExperience?.length || 0
    );
    console.log(
      '  - Has boardExperience:',
      !!parsedData?.boardExperience,
      'Length:',
      parsedData?.boardExperience?.length || 0
    );
    console.log(
      '  - Has education:',
      !!parsedData?.education,
      'Length:',
      parsedData?.education?.length || 0
    );
    console.log(
      '  - Has skills:',
      !!parsedData?.skills,
      'Length:',
      parsedData?.skills?.length || 0
    );
    console.log(
      '  - Has languages:',
      !!parsedData?.languages,
      'Length:',
      parsedData?.languages?.length || 0
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
      console.log(
        '🏢 Inserting board experience:',
        JSON.stringify(parsedData.boardExperience, null, 2)
      );
      const boardExperienceData = parsedData.boardExperience.map(
        (exp: Record<string, unknown>) => {
          console.log(
            '🔍 Processing board experience item:',
            JSON.stringify(exp, null, 2)
          );
          console.log(
            '- startDate:',
            exp.startDate || exp.start_date,
            'type:',
            typeof (exp.startDate || exp.start_date)
          );
          console.log(
            '- endDate:',
            exp.endDate || exp.end_date,
            'type:',
            typeof (exp.endDate || exp.end_date)
          );
          console.log('- isCurrent:', exp.isCurrent || exp.is_current);

          // Try multiple field name variations
          const startDate = parseDate(
            (exp.startDate || exp.start_date) as string
          );
          const organization = exp.organization || exp.company;
          const role = exp.role || exp.title || exp.position;

          // Be more lenient - only skip if completely empty
          if (!organization && !role) {
            console.warn(
              '⚠️ Skipping board experience entry - completely empty:',
              {
                organization,
                role,
                startDate,
                originalData: exp,
              }
            );
            return null;
          }

          // Log what we're actually going to insert
          console.log('✅ Board experience entry to insert:', {
            organization,
            role,
            startDate,
            endDate:
              exp.isCurrent || exp.is_current
                ? null
                : parseDate((exp.endDate || exp.end_date) as string),
            isCurrent: exp.isCurrent || exp.is_current,
          });

          // Validate organization_size against allowed values
          const validOrgSizes = [
            'startup',
            'small',
            'medium',
            'large',
            'public',
          ];
          let orgSize = exp.organizationSize || exp.organization_size;
          if (orgSize && !validOrgSizes.includes(orgSize as string)) {
            console.warn(
              `Invalid organization_size: ${orgSize}, setting to null`
            );
            orgSize = null;
          }

          const boardEntry = {
            profile_id: user.id,
            organization: organization || 'Not specified',
            role: role || 'Board Member',
            sector: exp.sector || null,
            start_date: startDate || '2020-01-01', // Fallback date if parsing fails
            end_date:
              exp.isCurrent || exp.is_current
                ? null
                : parseDate((exp.endDate || exp.end_date) as string),
            is_current: exp.isCurrent || exp.is_current || false,
            organization_size: orgSize || null,
            key_contributions:
              exp.keyContributions || exp.key_contributions || null,
            compensation_disclosed: exp.compensationDisclosed || false,
            annual_fee: exp.annualFee || null,
          };

          console.log(
            '📝 Final board entry for database:',
            JSON.stringify(boardEntry, null, 2)
          );
          return boardEntry;
        }
      );

      // Filter out null entries (skipped due to missing required fields)
      const validBoardExperienceData = boardExperienceData.filter(
        (item: any) => item !== null
      );

      console.log(
        '🚀 Board experience data to insert:',
        JSON.stringify(validBoardExperienceData, null, 2)
      );

      if (validBoardExperienceData.length > 0) {
        console.log(
          `🔄 Attempting to insert ${validBoardExperienceData.length} board experience entries...`
        );

        const { data: insertedBoard, error: boardError } = await supabase
          .from('board_experience')
          .insert(validBoardExperienceData)
          .select();

        if (boardError) {
          console.error('❌ Board experience insert error:', {
            error: boardError,
            message: boardError.message,
            details: boardError.details,
            hint: boardError.hint,
            code: boardError.code,
          });
          // Don't fail the entire process, just log the error
        } else {
          console.log(
            '✅ Board experience inserted successfully:',
            insertedBoard
          );
          console.log(
            `✅ Successfully inserted ${insertedBoard?.length || 0} board experience entries`
          );
        }
      } else {
        console.log('ℹ️ No valid board experience data to insert');
      }
    } else {
      console.log('No board experience data found in parsedData');
    }

    // Insert regular work history (if available)
    if (parsedData.workHistory && parsedData.workHistory.length > 0) {
      console.log(
        '💼 Inserting work history:',
        JSON.stringify(parsedData.workHistory, null, 2)
      );
      const workHistoryData = parsedData.workHistory.map(
        (exp: Record<string, unknown>) => {
          console.log(
            '🔍 Processing work history item:',
            JSON.stringify(exp, null, 2)
          );
          console.log(
            '- startDate:',
            exp.startDate || exp.start_date,
            'type:',
            typeof (exp.startDate || exp.start_date)
          );
          console.log(
            '- endDate:',
            exp.endDate || exp.end_date,
            'type:',
            typeof (exp.endDate || exp.end_date)
          );
          console.log('- isCurrent:', exp.isCurrent || exp.is_current);

          // Try multiple field name variations
          const startDate = parseDate(
            (exp.startDate || exp.start_date) as string
          );
          const company = exp.company || exp.organization;
          const title = exp.title || exp.role || exp.position;

          // Only skip if the entry is completely empty
          if (!company && !title) {
            console.warn(
              '⚠️ Skipping completely empty work experience entry:',
              exp
            );
            return null;
          }

          // Log what we're actually going to insert
          console.log('✅ Work experience entry to insert:', {
            company,
            title,
            startDate,
            endDate:
              exp.isCurrent || exp.is_current
                ? null
                : parseDate((exp.endDate || exp.end_date) as string),
            isCurrent: exp.isCurrent || exp.is_current,
          });

          // Validate company_size against allowed values
          const validCompanySizes = [
            'startup',
            'small',
            'medium',
            'large',
            'enterprise',
          ];
          let compSize = exp.companySize || exp.company_size;
          if (compSize && !validCompanySizes.includes(compSize as string)) {
            console.warn(`Invalid company_size: ${compSize}, setting to null`);
            compSize = null;
          }

          const workEntry = {
            profile_id: user.id,
            company: company || 'Not specified',
            title: title || 'Not specified',
            start_date: startDate || '2020-01-01', // Fallback date if parsing fails
            end_date:
              exp.isCurrent || exp.is_current
                ? null
                : parseDate((exp.endDate || exp.end_date) as string),
            is_current: exp.isCurrent || exp.is_current || false,
            description: exp.description || null,
            key_achievements:
              exp.keyAchievements || exp.key_achievements || null,
            company_size: compSize || null,
            location: exp.location || null,
          };

          console.log(
            '📝 Final work entry for database:',
            JSON.stringify(workEntry, null, 2)
          );
          return workEntry;
        }
      );

      // Filter out null entries (skipped due to missing required fields)
      const validWorkHistoryData = workHistoryData.filter(
        (item: any) => item !== null
      );

      console.log(
        '🚀 Work history data to insert:',
        JSON.stringify(validWorkHistoryData, null, 2)
      );

      if (validWorkHistoryData.length > 0) {
        console.log(
          `🔄 Attempting to insert ${validWorkHistoryData.length} work history entries...`
        );

        const { data: insertedWorkHistory, error: workHistoryError } =
          await supabase
            .from('work_experience')
            .insert(validWorkHistoryData)
            .select();

        if (workHistoryError) {
          console.error('❌ Work history insert error:', {
            error: workHistoryError,
            message: workHistoryError.message,
            details: workHistoryError.details,
            hint: workHistoryError.hint,
            code: workHistoryError.code,
          });
          // Don't fail the entire process, just log the error
        } else {
          console.log(
            '✅ Work history inserted successfully:',
            insertedWorkHistory
          );
          console.log(
            `✅ Successfully inserted ${insertedWorkHistory?.length || 0} work history entries`
          );
        }
      } else {
        console.log('ℹ️ No valid work history data to insert');
      }
    } else {
      console.log('No work history data found in parsedData');
    }

    // Insert work experience with proper date handling (fallback for legacy data)
    if (parsedData.workExperience && parsedData.workExperience.length > 0) {
      console.log(
        '📋 Inserting legacy work experience:',
        JSON.stringify(parsedData.workExperience, null, 2)
      );
      const workExperienceData = parsedData.workExperience.map(
        (exp: Record<string, unknown>) => {
          const startDate = parseDate(
            (exp.startDate || exp.start_date) as string
          );
          const endDate = parseDate((exp.endDate || exp.end_date) as string);

          // Debug logging for responsibilities mapping
          console.log(
            `🔍 Mapping work experience for ${exp.company || exp.organization}:`
          );
          console.log(
            '  - startDate input:',
            exp.startDate || exp.start_date,
            '-> parsed:',
            startDate
          );
          console.log(
            '  - endDate input:',
            exp.endDate || exp.end_date,
            '-> parsed:',
            endDate
          );
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

          const company = exp.company || exp.organization;
          const title = exp.position || exp.title || exp.role;

          // Validate company_size for legacy data too
          const validCompanySizes = [
            'startup',
            'small',
            'medium',
            'large',
            'enterprise',
          ];
          let compSize = exp.companySize || exp.company_size;
          if (compSize && !validCompanySizes.includes(compSize as string)) {
            console.warn(
              `Invalid company_size in legacy data: ${compSize}, setting to null`
            );
            compSize = null;
          }

          const legacyWorkEntry = {
            profile_id: user.id,
            company: company || 'Not specified',
            title: title || 'Not specified',
            start_date: startDate || '2020-01-01', // Fallback date
            end_date: endDate,
            is_current: !endDate, // If no end date, it's current
            description: exp.description || null,
            key_achievements:
              keyAchievements.length > 0 ? keyAchievements : null,
            company_size: compSize || null,
            location: exp.location || null,
          };

          console.log(
            '📝 Final legacy work entry for database:',
            JSON.stringify(legacyWorkEntry, null, 2)
          );
          return legacyWorkEntry;
        }
      );

      console.log(
        '🚀 Legacy work experience data to insert:',
        JSON.stringify(workExperienceData, null, 2)
      );
      console.log(
        `🔄 Attempting to insert ${workExperienceData.length} legacy work experience entries...`
      );

      const { data: insertedWork, error: workError } = await supabase
        .from('work_experience')
        .insert(workExperienceData)
        .select();

      if (workError) {
        console.error('❌ Legacy work experience insert error:', {
          error: workError,
          message: workError.message,
          details: workError.details,
          hint: workError.hint,
          code: workError.code,
        });
        // Don't fail the entire process, just log the error
      } else {
        console.log(
          '✅ Legacy work experience inserted successfully:',
          insertedWork
        );
        console.log(
          `✅ Successfully inserted ${insertedWork?.length || 0} legacy work experience entries`
        );
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
