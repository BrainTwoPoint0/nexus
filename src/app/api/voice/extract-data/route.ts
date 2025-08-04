import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabaseServer';

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

    const { transcript } = await request.json();

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
6. For availability: Convert casual responses like "yeah, I'm looking now" to "immediately_available"
7. For remote preference: Map responses like "I prefer working from home mostly" to "hybrid" or "full"
8. For compensation: Extract numbers even if mentioned casually (e.g., "around 150k" → 150000)
9. For achievements: Transform casual mentions into professional bullet points

Example transformations:
- User says: "I mostly do Python stuff and manage teams" → skills: ["Python", "Team Leadership", "Project Management"]
- User says: "I'm free to start whenever really" → availability_status: "immediately_available"
- User says: "I like going to the office couple days a week" → remote_work_preference: "hybrid"
- User says: "I've worked in tech and banking" → sectors: ["Technology", "Financial Services"]
- User says: "Looking for around 120-150k" → compensation_expectation_min: 120000, compensation_expectation_max: 150000

Expected JSON format:
{
  "phone": "+447123456789",
  "website": "https://example.com",
  "skills": ["Python", "Team Leadership", "Data Analysis"],
  "sectors": ["Technology", "Financial Services"],
  "availability_status": "immediately_available",
  "remote_work_preference": "hybrid",
  "compensation_expectation_min": 120000,
  "compensation_expectation_max": 150000,
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
    let extractedData = {};

    try {
      const content = data.choices[0]?.message?.content?.trim();
      if (content) {
        // Clean up the response to ensure it's valid JSON
        const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
        extractedData = JSON.parse(cleanContent);
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
