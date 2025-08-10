import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabaseServer';
import {
  parseAvailabilityFromText,
  parseRemoteWorkFromText,
  isValidAvailabilityStatus,
  isValidRemoteWorkPreference,
  AVAILABILITY_STATUS_VALUES,
  REMOTE_WORK_VALUES,
} from '@/lib/enums';
import { generateSmartProfile } from '@/lib/profile-intelligence';

/**
 * Detect if the user's response was unclear, stuttered, or contained no useful information
 */
function checkForUnclearResponse(
  transcript: string,
  extractedData: any
): boolean {
  const lowerTranscript = transcript.toLowerCase().trim();

  // Check if transcript is very short (likely just stutters or unclear sounds)
  if (lowerTranscript.length < 10) {
    return true;
  }

  // Check for common unclear response patterns
  const unclearPatterns = [
    /^(um|uh|er|ah|hmm|well)\s*$/i,
    /^(i don't know|not sure|unclear)\s*$/i,
    /^(what|huh|sorry)\s*$/i,
    /^(um|uh|er)\s+(um|uh|er)\s*$/i, // Multiple stutters
  ];

  const hasUnclearPattern = unclearPatterns.some((pattern) =>
    pattern.test(lowerTranscript)
  );

  // Check if no meaningful data was extracted (empty object or only system fields)
  const meaningfulFields = Object.keys(extractedData).filter(
    (key) =>
      !key.startsWith('_') &&
      extractedData[key] !== null &&
      extractedData[key] !== ''
  );
  const hasNoMeaningfulData = meaningfulFields.length === 0;

  // Return true if it looks like an unclear response
  return (
    hasUnclearPattern || (hasNoMeaningfulData && lowerTranscript.length < 50)
  );
}

/**
 * Validates and corrects enum values in extracted data
 * Uses natural language parsing as fallback for invalid enum values
 */
function validateAndFixEnumValues(extractedData: any, transcript: string): any {
  const validated = { ...extractedData };

  // Validate availability_status
  if (validated.availability_status) {
    if (!isValidAvailabilityStatus(validated.availability_status)) {
      logger.warn(
        'Invalid availability_status from AI, attempting natural language parsing',
        {
          originalValue: validated.availability_status,
          validOptions: AVAILABILITY_STATUS_VALUES,
        },
        'VOICE_API'
      );

      // Try to parse from the original transcript
      const parsedAvailability = parseAvailabilityFromText(transcript);
      if (parsedAvailability) {
        validated.availability_status = parsedAvailability;
        logger.info(
          'Successfully fixed availability_status using natural language parsing',
          {
            original: extractedData.availability_status,
            fixed: parsedAvailability,
          },
          'VOICE_API'
        );
      } else {
        // Remove invalid value rather than keeping it
        delete validated.availability_status;
        logger.warn(
          'Could not parse availability_status, removing from extracted data',
          { originalValue: extractedData.availability_status },
          'VOICE_API'
        );
      }
    }
  }

  // Validate remote_work_preference
  if (validated.remote_work_preference) {
    if (!isValidRemoteWorkPreference(validated.remote_work_preference)) {
      logger.warn(
        'Invalid remote_work_preference from AI, attempting natural language parsing',
        {
          originalValue: validated.remote_work_preference,
          validOptions: REMOTE_WORK_VALUES,
        },
        'VOICE_API'
      );

      // Try to parse from the original transcript
      const parsedRemoteWork = parseRemoteWorkFromText(transcript);
      if (parsedRemoteWork) {
        validated.remote_work_preference = parsedRemoteWork;
        logger.info(
          'Successfully fixed remote_work_preference using natural language parsing',
          {
            original: extractedData.remote_work_preference,
            fixed: parsedRemoteWork,
          },
          'VOICE_API'
        );
      } else {
        // Remove invalid value rather than keeping it
        delete validated.remote_work_preference;
        logger.warn(
          'Could not parse remote_work_preference, removing from extracted data',
          { originalValue: extractedData.remote_work_preference },
          'VOICE_API'
        );
      }
    }
  }

  return validated;
}

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript, cvData } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    logger.info(
      'Extracting data from voice transcript',
      {
        userId: user.id,
        transcriptLength: transcript.length,
      },
      'VOICE_API'
    );

    // Use OpenAI to extract structured data from the conversation
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at transforming casual interview conversations into professional profile data.

Your task is to extract information from the conversation and transform it into polished, professional profile content.

IMPORTANT GUIDELINES:
1. Transform casual/informal responses into professional language
2. Expand abbreviations and clean up grammar
3. For phone numbers: Extract the actual phone number mentioned, including country code (e.g., "+447717624003")
   - If user declines to provide phone, omit the field entirely (don't return empty string)
   - Only include phone if a valid number was provided
4. For skills: Extract and properly format technical and soft skills mentioned
5. For sectors: Identify industries from company names, roles, or context
6. For compensation: Extract numbers even if mentioned casually (e.g., "around 150k" → 150000)
7. For achievements: Transform casual mentions into professional bullet points
8. For comprehensive career data: If user provides full work history, education, or career overview, structure it properly
9. For name extraction: Extract first_name, last_name separately if full name provided
10. For location: Format as "City, Country" (e.g., "London, UK")

CRITICAL ENUM FIELD HANDLING:
For availability_status field, you MUST use ONLY these exact values:
- "immediately_available" (can start right now/very soon)
- "available_3_months" (can start in about 3 months)
- "available_6_months" (can start in about 6 months)
- "not_available" (not looking to change roles)
- "by_arrangement" (flexible timing)

For remote_work_preference field, you MUST use ONLY these exact values:
- "no" (prefer office-based work only)
- "hybrid" (mix of remote and office work)
- "full" (work from home/anywhere)
- "occasional" (mostly office but some remote)

Example transformations:
- User says: "My name is John Smith" → first_name: "John", last_name: "Smith"
- User says: "I'm based in London" → location: "London, UK"
- User says: "I'm a Senior Software Engineer" → professional_headline: "Senior Software Engineer"
- User says: "I mostly do Python stuff and manage teams" → skills: ["Python", "Team Leadership", "Project Management"]
- User says: "I'm free to start whenever really" → availability_status: "immediately_available"
- User says: "I can start in a few months" → availability_status: "available_3_months"
- User says: "I like going to the office couple days a week" → remote_work_preference: "hybrid"
- User says: "I prefer working from home" → remote_work_preference: "full"
- User says: "I've worked in tech and banking" → sectors: ["Technology", "Financial Services"]
- User says: "Looking for around 120-150k" → compensation_expectation_min: 120000, compensation_expectation_max: 150000
- User provides work history → work_experience: [structured work experience array]
- User provides education → education: [structured education array]

Expected JSON format (comprehensive profile capture):
{
  "first_name": "John",
  "last_name": "Smith", 
  "location": "London, UK",
  "phone": "+447123456789",
  "professional_headline": "Senior Software Engineer",
  "bio": "Experienced software engineer with expertise in...",
  "website": "https://example.com",
  "skills": ["Python", "Team Leadership", "Data Analysis"],
  "languages": ["English", "Spanish"],
  "sectors": ["Technology", "Financial Services"],
  "availability_status": "immediately_available",
  "remote_work_preference": "hybrid",
  "compensation_expectation_min": 120000,
  "compensation_expectation_max": 150000,
  "work_experience": [
    {
      "company": "Amazon",
      "position": "Senior Software Engineer",
      "start_date": "2020-01-01",
      "end_date": null,
      "is_current": true,
      "description": "Lead software development...",
      "key_achievements": ["Led team of 10 engineers", "Reduced costs by 25%"]
    }
  ],
  "education": [
    {
      "institution": "University of Cambridge",
      "degree": "Bachelor of Science",
      "field_of_study": "Computer Science",
      "graduation_year": 2018
    }
  ],
  "board_experience": [
    {
      "organization": "TechCorp Ltd",
      "role": "Non-Executive Director",
      "start_date": "2022-01-01",
      "end_date": null,
      "is_current": true,
      "key_contributions": ["Strategic planning", "Technology oversight"]
    }
  ],
  "work_experience_enhancements": [
    {
      "company": "Amazon",
      "key_achievements": ["Led team of 10 engineers", "Reduced costs by 25%"]
    }
  ]
}

Transform the casual conversation into professional profile data. Be intelligent about interpreting informal language.

CRITICAL RULES:
- NEVER return empty strings ("") for any field
- If a field wasn't answered or user declined, omit it entirely from the response
- Only include fields where actual data was provided
- For enum fields (availability_status, remote_work_preference), use ONLY the exact values listed above
- Return empty object {} if no professional information was extracted`,
          },
          {
            role: 'user',
            content: `Please extract professional data from this interview transcript:\n\n${transcript}`,
          },
        ],
        temperature: 0.3, // Slightly higher for better interpretation
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(
        'OpenAI API error',
        { error, status: response.status },
        'VOICE_API'
      );
      return NextResponse.json(
        { error: 'Failed to process transcript' },
        { status: response.status }
      );
    }

    const data = await response.json();
    let extractedData: any = {};

    try {
      const content = data.choices[0]?.message?.content?.trim();
      if (content) {
        // Clean up the response to ensure it's valid JSON
        const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
        extractedData = JSON.parse(cleanContent);

        // Check if this was an unclear/stuttered response that yielded no useful data
        const isUnclearResponse = checkForUnclearResponse(
          transcript,
          extractedData
        );
        if (isUnclearResponse) {
          logger.info(
            'Detected unclear response from user',
            {
              transcriptLength: transcript.length,
              extractedFields: Object.keys(extractedData).length,
            },
            'VOICE_API'
          );
          // Return minimal data to indicate the response was unclear
          extractedData._unclear_response = true;
        }

        // Validate and fix enum values using natural language parsing
        extractedData = validateAndFixEnumValues(extractedData, transcript);

        // Add auto-generated professional headline and bio if not extracted
        if (cvData) {
          const smartProfile = generateSmartProfile(cvData);

          // Add professional headline if not in extracted data
          if (
            !extractedData.professional_headline &&
            smartProfile.professional_headline
          ) {
            extractedData.professional_headline =
              smartProfile.professional_headline;
            logger.info(
              'Added auto-generated professional headline',
              { headline: smartProfile.professional_headline },
              'VOICE_API'
            );
          }

          // If user accepted the generated bio (check transcript for acceptance)
          if (!extractedData.bio && smartProfile.bio) {
            // Check if user accepted the bio recommendation in the conversation
            const bioAccepted =
              transcript.toLowerCase().includes('yes') &&
              (transcript.toLowerCase().includes('use this') ||
                transcript.toLowerCase().includes('sounds good') ||
                transcript.toLowerCase().includes('that works') ||
                transcript.toLowerCase().includes('perfect'));

            if (bioAccepted) {
              extractedData.bio = smartProfile.bio;
              logger.info(
                'User accepted auto-generated bio',
                { bioLength: smartProfile.bio.length },
                'VOICE_API'
              );
            }
          }

          // Add recommended skills if mentioned positively
          if (
            !extractedData.skills &&
            smartProfile.skills_recommendation &&
            smartProfile.skills_recommendation.length > 0
          ) {
            extractedData.skills = smartProfile.skills_recommendation;
          }

          // Add recommended sectors
          if (
            !extractedData.sectors &&
            smartProfile.sectors_recommendation &&
            smartProfile.sectors_recommendation.length > 0
          ) {
            extractedData.sectors = smartProfile.sectors_recommendation;
          }
        }
      }
    } catch (parseError) {
      logger.error('Failed to parse extracted data', parseError, 'VOICE_API');
      // Return empty object if parsing fails
      extractedData = {};
    }

    logger.info(
      'Data extraction completed',
      {
        userId: user.id,
        fieldsExtracted: Object.keys(extractedData).length,
        extractedData: extractedData,
        transcriptPreview: transcript.substring(0, 200) + '...',
      },
      'VOICE_API'
    );

    return NextResponse.json({
      success: true,
      extractedData,
      transcript,
    });
  } catch (error) {
    logger.error('Error in voice data extraction', error, 'VOICE_API');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
