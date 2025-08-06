import { NextRequest, NextResponse } from 'next/server';

// CV parsing function from Lambda (exact copy)
async function parseCVWithOpenAI(cvText: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('AI parsing service not available');
  }

  console.log('Starting CV data parsing...');

  // Truncate CV text if too long to prevent token limit issues
  const maxCVLength = 6000;
  const truncatedCVText =
    cvText.length > maxCVLength
      ? cvText.substring(0, maxCVLength) +
        '\n[... content truncated for processing ...]'
      : cvText;

  console.log('CV text processing', {
    originalLength: cvText.length,
    truncatedLength: truncatedCVText.length,
  });

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
            'You are a precise CV data extractor. Extract ONLY information that appears in the provided CV text. If information is not present, use null or empty arrays. Never invent or generate fake data.',
        },
        {
          role: 'user',
          content: `Extract data from this CV and return as JSON. IMPORTANT: Only extract what is actually written in the CV text below.

Required JSON structure (use null if not found, empty arrays if no items):
{
  "firstName": null,
  "lastName": null,
  "email": null,
  "phone": null,
  "location": null,
  "linkedInUrl": null,
  "title": null,
  "professionalBio": null,
  "boardExperience": [],
  "workHistory": [],
  "education": [],
  "skills": [],
  "languages": [], // Extract as: ["English (Native)", "French (Fluent)", "Spanish (Conversational)"]
  "certifications": [], // Extract as: ["AWS Certified Solutions Architect - Associate", "PMP Certification"]
  "achievements": [],
  "professionalMemberships": []
}

LANGUAGE EXTRACTION EXAMPLES:
Input: "LANGUAGES\nEnglish (Native) | French (Native) | Arabic (Native)"
Output: "languages": ["English (Native)", "French (Native)", "Arabic (Native)"]

Input: "Fluent in Spanish and Portuguese, conversational German"
Output: "languages": ["Spanish (Fluent)", "Portuguese (Fluent)", "German (Conversational)"]

CERTIFICATION EXTRACTION EXAMPLES:
Input: "AWS Certified Solutions Architect - Associate | June 2024"
Output: "certifications": ["AWS Certified Solutions Architect - Associate"]

Input: "Professional certifications include PMP (2023) and Six Sigma Black Belt (2022)"
Output: "certifications": ["PMP", "Six Sigma Black Belt"]

For work experience, extract actual job entries with these fields:
- company: Company name from CV
- title: Job title from CV
- start_date: Extract start date in any format mentioned (e.g., "March 2023", "2023", "Mar 2023", "03/2023")
- end_date: Extract end date if mentioned (null if current/present)
- is_current: true if position is current/present (look for "Present", "Current", "Now", or ongoing indicators)
- description: Extract the COMPLETE job description, responsibilities, and role details. Include ALL bullet points, paragraphs, and details provided for each position. Never leave this empty if any information exists.
- key_achievements: List of specific achievements, accomplishments, metrics, or quantifiable results mentioned

IMPORTANT FOR DATES: Look for date patterns like:
- "March 2023 - Present" 
- "2022 - 2024"
- "Jan 2020 - Mar 2023"
- "2019 - Current"
- Single dates like "Since 2022"
- Academic years like "2018-2021"

For board experience:
- organization: Organization name
- role: Board role/title (e.g., Director, Non-Executive Director, Board Member)
- start_date: Extract start date in any format mentioned (same patterns as work experience)
- end_date: Extract end date if mentioned (null if current/present)
- is_current: true if position is current/present (look for "Present", "Current", "Now")
- key_contributions: Major contributions or achievements in board role (never leave empty if any details exist)

For education, include:
- degree: Degree name
- institution: Institution name
- field: Field of study
- endDate: Graduation year/date if mentioned
- honors: Honors, distinctions, or GPA if mentioned

For achievements, extract:
- Awards, honors, recognitions
- Publications or patents
- Speaking engagements
- Notable accomplishments

For languages, extract ALL language skills mentioned. Look for:
- Section headers: "LANGUAGES", "Language Skills", "Language Proficiency"
- Formats: "English (Native)", "French (Fluent)", "Spanish - Conversational"
- Inline mentions: "Fluent in German", "Native speaker of Italian"
- Proficiency indicators: Native, Fluent, Conversational, Basic, Professional
- Multiple languages on same line separated by | or ,

For certifications, extract ALL professional certifications, licenses, and credentials. Look for:
- Section headers: "CERTIFICATIONS", "Professional Certifications", "Licenses", "Credentials"
- Format patterns: "AWS Certified Solutions Architect - Associate | June 2024"
- Components: Certification name, issuing organization, date obtained
- Keywords: "Certified", "Licensed", "Credential", "Certificate"
- Extract the full certification name including level/type (e.g., "Associate", "Professional")

For skills, extract ALL technical skills, professional skills, and competencies mentioned. Look for:
- Section headers: "SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES", "KEY SKILLS"
- Technology skills: Programming languages, frameworks, tools, platforms
- Professional skills: Management, leadership, strategy, analysis
- Industry skills: Domain expertise, specialized knowledge
- Soft skills: Communication, teamwork, problem-solving

For professional memberships, extract all memberships in professional organizations, associations, clubs, or institutes.

IMPORTANT: Extract ALL work experience entries - do not truncate or skip any positions.
IMPORTANT: Extract ALL education entries - including degrees, schools, dates, honors.
IMPORTANT: Extract ALL achievements, awards, speaking engagements, and recognitions.
IMPORTANT: Extract ALL skills mentioned anywhere in the CV - technical and professional.
IMPORTANT: For descriptions - NEVER leave description fields empty if ANY information exists about the role, even brief mentions.
IMPORTANT: For dates - Look carefully for ANY date indicators, including partial dates like years only.

CRITICAL CATEGORIZATION RULES:

**Board Experience ONLY includes governance/oversight roles:**
- Non-Executive Director, Independent Director, Board Chair, Board Member
- Advisory Board Member, Board Observer, Board Advisor
- Trustee, Board of Trustees member
- Key indicators: "Board", "Non-Executive", "Independent", "Advisory", "Trustee"

**Work Experience includes ALL operational roles (even if senior):**
- CEO, CFO, CTO, COO, President, VP, Director (when operational)
- Founder, Co-Founder, Managing Director, General Manager
- Any role where the person is running/managing the business day-to-day
- Key indicators: "Founder", "CEO", "President", "Managing", operational responsibilities

**Rule of thumb:** If someone is employed by and running the company = workHistory. If someone is governing/advising the company from outside = boardExperience.

SECTION RECOGNITION: Pay special attention to section headers written in ALL CAPS or with clear formatting:
- LANGUAGES, LANGUAGE SKILLS, LANGUAGE PROFICIENCY
- CERTIFICATIONS, PROFESSIONAL CERTIFICATIONS, LICENSES, CREDENTIALS
- Look for content immediately following these headers
- Handle both dedicated sections and inline mentions throughout the CV

CV TEXT TO EXTRACT FROM:
${truncatedCVText}

REMEMBER: Only extract actual information from the above CV text. Do not add any information that is not explicitly stated.`,
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `AI parsing failed: ${errorData.error?.message || 'Unknown error'}`
    );
  }

  const result = await response.json();
  const content = result.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from AI parsing service');
  }

  // Parse the JSON response with robust error handling
  let parsedData;
  try {
    console.log('Raw OpenAI response', { preview: content.substring(0, 500) });

    // Clean the response
    let cleanContent = content.trim();
    cleanContent = cleanContent.replace(/```json\s*|\s*```/g, '');

    const firstBrace = cleanContent.indexOf('{');
    const lastBrace = cleanContent.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
    }

    parsedData = JSON.parse(cleanContent);

    if (!parsedData || typeof parsedData !== 'object') {
      throw new Error('Parsed data is not a valid object');
    }

    console.log('Successfully parsed CV data', {
      keys: Object.keys(parsedData),
      workExperienceCount: parsedData.workExperience?.length || 0,
      educationCount: parsedData.education?.length || 0,
    });
  } catch (parseError: any) {
    console.error('JSON parsing failed', { parseError, rawContent: content });
    throw new Error(
      'Failed to parse AI response as JSON. Please try again or use a different file format.'
    );
  }

  console.log('CV data parsing completed');

  return parsedData;
}

export async function POST(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    const requestData = await request.json();
    const { text } = requestData;

    if (!text) {
      return NextResponse.json(
        { error: 'Missing CV text to parse' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Starting CV parsing', {
      textLength: text.length,
    });

    // Parse the extracted text into structured data
    const parsedData = await parseCVWithOpenAI(text);

    console.log('CV parsing completed successfully', {
      workExperienceCount: parsedData.workHistory?.length || 0,
      educationCount: parsedData.education?.length || 0,
      skillsCount: parsedData.skills?.length || 0,
    });

    return NextResponse.json(
      {
        success: true,
        data: parsedData,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('CV parsing error', error);

    return NextResponse.json(
      { error: `Failed to parse CV: ${error.message}` },
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
