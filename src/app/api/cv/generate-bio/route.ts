import { NextRequest, NextResponse } from 'next/server';

// Generate professional bio from CV data (exact copy from Lambda)
async function generateProfessionalBio(data: any) {
  const bioPrompt = `Create a professional biography based on the following CV data. Write in third person, 2-3 sentences, focusing on current role, key achievements, and board experience if applicable.

Name: ${data.firstName} ${data.lastName}
Current Role: ${data.currentRole} at ${data.currentCompany}
Work Experience: ${data.workHistory?.length || 0} positions
Board Experience: ${data.boardExperience?.length || 0} roles
Education: ${data.education?.map((e: any) => `${e.degree} from ${e.institution}`).join(', ') || 'Not specified'}

Write a concise, professional bio suitable for an executive profile.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional biography writer. Create concise, impactful executive bios.',
        },
        {
          role: 'user',
          content: bioPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate bio');
  }

  const result = await response.json();
  return result.choices[0]?.message?.content?.trim() || '';
}

// Enhanced data processing (exact copy from Lambda)
async function enhanceParsedData(data: any) {
  const enhanced = { ...data };

  // Compute fullName from firstName and lastName
  if (!enhanced.fullName && (enhanced.firstName || enhanced.lastName)) {
    if (enhanced.firstName && enhanced.lastName) {
      enhanced.fullName = `${enhanced.firstName} ${enhanced.lastName}`;
    } else {
      enhanced.fullName = enhanced.firstName || enhanced.lastName;
    }
  }

  // Handle multiple current roles (common for executives and board members)
  if (!enhanced.currentRole || !enhanced.currentCompany) {
    // Find all current positions (board experience + work history)
    const allCurrentRoles = [];

    // Add current work history roles
    const currentWorkRoles =
      enhanced.workHistory?.filter((job: any) => job.is_current) || [];
    allCurrentRoles.push(
      ...currentWorkRoles.map((job: any) => ({
        role: job.title,
        company: job.company,
        type: 'work',
      }))
    );

    // Add current board experience roles
    const currentBoardRoles =
      enhanced.boardExperience?.filter((exp: any) => exp.is_current) || [];
    allCurrentRoles.push(
      ...currentBoardRoles.map((exp: any) => ({
        role: exp.role,
        company: exp.organization,
        type: 'board',
      }))
    );

    // Prioritize operational roles for currentRole/currentCompany
    const operationalRole = allCurrentRoles.find(
      (role) => role.type === 'work'
    );
    if (operationalRole) {
      if (!enhanced.currentRole) enhanced.currentRole = operationalRole.role;
      if (!enhanced.currentCompany)
        enhanced.currentCompany = operationalRole.company;
    } else if (allCurrentRoles.length > 0) {
      // Use board role if no operational role
      if (!enhanced.currentRole) enhanced.currentRole = allCurrentRoles[0].role;
      if (!enhanced.currentCompany)
        enhanced.currentCompany = allCurrentRoles[0].company;
    }

    // Fallback to title field for current role
    if (!enhanced.currentRole && enhanced.title) {
      enhanced.currentRole = enhanced.title;
    }
  }

  console.log('Generating professional bio...');

  // Auto-generate professional bio if not present
  if (!enhanced.professionalBio && process.env.OPENAI_API_KEY) {
    try {
      enhanced.professionalBio = await generateProfessionalBio(enhanced);
      console.log('Auto-generated professional bio');
    } catch (error) {
      console.warn('Failed to auto-generate bio', error);
    }
  }

  return enhanced;
}

// Completeness analysis (exact copy from Lambda)
function analyzeCompleteness(data: any) {
  const fieldRequirements = {
    critical: [
      'firstName',
      'lastName',
      'email',
      'phone',
      'location',
      'currentRole',
      'currentCompany',
      'professionalBio',
    ],
    highValue: [
      'workHistory',
      'boardExperience',
      'education',
      'skills',
      'languages',
    ],
    enhanced: [
      'certifications',
      'achievements',
      'linkedInUrl',
      'professionalMemberships',
    ],
  };

  const presentFields: string[] = [];
  const missingCriticalFields: string[] = [];
  const missingHighValueFields: string[] = [];
  const missingEnhancedFields: string[] = [];

  // Check critical fields
  fieldRequirements.critical.forEach((field) => {
    const value = data[field];
    if (value && value !== '' && value !== null && value !== undefined) {
      presentFields.push(field);
    } else {
      missingCriticalFields.push(field);
    }
  });

  // Check high value fields
  fieldRequirements.highValue.forEach((field) => {
    const value = data[field];
    if (
      value &&
      (Array.isArray(value) ? value.length > 0 : value !== '' && value !== null)
    ) {
      presentFields.push(field);
    } else {
      missingHighValueFields.push(field);
    }
  });

  // Check enhanced fields
  fieldRequirements.enhanced.forEach((field) => {
    const value = data[field];
    if (
      value &&
      (Array.isArray(value) ? value.length > 0 : value !== '' && value !== null)
    ) {
      presentFields.push(field);
    } else {
      missingEnhancedFields.push(field);
    }
  });

  const totalFields =
    fieldRequirements.critical.length +
    fieldRequirements.highValue.length +
    fieldRequirements.enhanced.length;
  const presentCount = presentFields.length;
  const overallCompleteness = Math.round((presentCount / totalFields) * 100);

  return {
    presentFields,
    missingCriticalFields,
    missingHighValueFields,
    missingEnhancedFields,
    overallCompleteness,
  };
}

export async function POST(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    const requestData = await request.json();
    const { data } = requestData;

    if (!data) {
      return NextResponse.json(
        { error: 'Missing CV data to enhance' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Starting bio generation and data enhancement', {
      hasFirstName: !!data.firstName,
      hasLastName: !!data.lastName,
      workExperienceCount: data.workHistory?.length || 0,
      boardExperienceCount: data.boardExperience?.length || 0,
    });

    // Enhance parsed data with computed fields and bio
    const enhancedData = await enhanceParsedData(data);

    console.log('Finalizing CV processing...');

    // Analyze completeness
    const completenessAnalysis = analyzeCompleteness(enhancedData);

    console.log('Bio generation and enhancement completed successfully', {
      overallCompleteness: completenessAnalysis.overallCompleteness,
      workExperienceCount: enhancedData.workExperience?.length || 0,
      educationCount: enhancedData.education?.length || 0,
      skillsCount: enhancedData.skills?.length || 0,
      hasBio: !!enhancedData.professionalBio,
    });

    return NextResponse.json(
      {
        success: true,
        data: enhancedData,
        completenessAnalysis,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Bio generation error', error);

    return NextResponse.json(
      { error: `Failed to generate bio: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse('', {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}
