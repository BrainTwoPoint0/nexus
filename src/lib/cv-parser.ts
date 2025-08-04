/**
 * Optimized CV/Resume Parsing Service
 * OpenAI-first approach with integrated completeness analysis
 * Analyzes data completeness for profile quality assessment
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as mammoth from 'mammoth';
import { logger } from './logger';

export interface CVParsingResult {
  success: boolean;
  data?: ExtractedCVData;
  completenessAnalysis?: CompletenessAnalysis;
  error?: string;
}

export interface CompletenessAnalysis {
  presentFields: string[];
  missingCriticalFields: string[];
  missingHighValueFields: string[];
  missingEnhancedFields: string[];
  overallCompleteness: number; // 0-100
}

export interface ExtractedCVData {
  // Personal Information
  firstName?: string;
  lastName?: string;
  fullName?: string; // Computed from firstName + lastName
  email?: string;
  phone?: string;
  location?: string;
  linkedInUrl?: string;
  website?: string;

  // Professional Summary
  title?: string;
  currentRole?: string; // Computed from current work history
  currentCompany?: string; // Computed from current work history
  additionalCurrentRoles?: string[]; // Additional current roles for multi-role executives
  summary?: string;
  professionalBio?: string;

  // Legacy work experience (for backwards compatibility)
  workExperience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    location?: string;
    description?: string;
    achievements?: string[];
  }>;

  // Education
  education?: Education[];

  // Skills
  skills?: string[];

  // Additional Info
  languages?: string[];
  certifications?: string[];
  achievements?: string[];
  professionalMemberships?: Array<{
    organization_name: string;
    membership_type?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
  }>;

  // Categorized Experience (processed from workExperience)
  boardExperience?: BoardExperience[];
  workHistory?: WorkHistory[];
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  graduation_year?: number;
  gpa?: string;
  honors?: string[];
  description?: string;
  achievements?: string[];
}

export interface BoardExperience {
  id: string;
  organization: string;
  role: string;
  sector: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  organization_size: string | null;
  key_contributions: string | null;
  compensation_disclosed: boolean;
  annual_fee: number | null;
}

export interface WorkHistory {
  id: string;
  company: string;
  title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  key_achievements: string[] | null;
  company_size: string | null;
  location: string | null;
}

/**
 * Extract text from DOCX file using mammoth
 */
async function extractTextFromDocx(docxBuffer: Buffer): Promise<string | null> {
  try {
    logger.debug('Extracting text from DOCX using mammoth', {}, 'CV_PARSER');

    // Extract raw text from DOCX buffer
    const result = await mammoth.extractRawText({ buffer: docxBuffer });

    if (result.messages && result.messages.length > 0) {
      logger.warn(
        'Mammoth conversion messages',
        { messages: result.messages },
        'CV_PARSER'
      );
    }

    const extractedText = result.value;

    if (!extractedText || extractedText.trim().length < 50) {
      logger.error(
        'Insufficient text extracted from DOCX',
        { length: extractedText?.length },
        'CV_PARSER'
      );
      return null;
    }

    logger.debug(
      'Text extracted from DOCX successfully',
      { length: extractedText.length },
      'CV_PARSER'
    );
    return extractedText.trim();
  } catch (error) {
    logger.error('Mammoth text extraction error', error, 'CV_PARSER');
    return null;
  }
}

/**
 * Unified document processing using OpenAI API only
 * Supports all file types through OpenAI's chat completion API
 */
export async function processDocumentWithOpenAI(
  file: File
): Promise<{ text?: string; error?: string }> {
  try {
    logger.debug(
      'Processing with OpenAI-only approach',
      { fileName: file.name, fileType: file.type, fileSize: file.size },
      'CV_PARSER'
    );

    if (!process.env.OPENAI_API_KEY) {
      logger.error('OPENAI_API_KEY is not configured', {}, 'CV_PARSER');
      return {
        error:
          'AI parsing service not available. Please upload a plain text version of your CV.',
      };
    }

    // Handle plain text files directly - no AI needed
    if (file.type === 'text/plain') {
      const text = await file.text();
      logger.debug(
        'Text file processed directly',
        { length: text.length },
        'CV_PARSER'
      );
      return { text };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // File size limit
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
      return {
        error:
          'File too large for processing. Please use a file smaller than 10MB.',
      };
    }

    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';

    logger.debug('File type detected', { mimeType }, 'CV_PARSER');

    // Handle DOCX files by extracting text with mammoth
    if (
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      logger.debug('Processing DOCX file with mammoth', {}, 'CV_PARSER');

      try {
        // Extract text from DOCX using mammoth
        const extractedText = await extractTextFromDocx(buffer);

        if (!extractedText) {
          return {
            error:
              'Could not extract text from DOCX file. Please try converting to PDF or text format.',
          };
        }

        logger.debug(
          'DOCX text extracted successfully',
          { length: extractedText.length },
          'CV_PARSER'
        );
        return { text: extractedText };
      } catch (error) {
        logger.error('DOCX processing error', error, 'CV_PARSER');
        return {
          error:
            'DOCX processing failed. Please try converting to PDF or text format.',
        };
      }
    }

    // Handle different document types using correct OpenAI API format
    let requestBody;

    if (file.type === 'application/pdf') {
      // Use native PDF support with correct API format (Base64-encoded files)
      logger.debug(
        'Sending PDF to OpenAI with native PDF support',
        {},
        'CV_PARSER'
      );
      requestBody = {
        model: 'gpt-4o', // PDF support requires gpt-4o, gpt-4o-mini, or o1
        input: [
          {
            role: 'system',
            content:
              'You are a professional CV/resume text extraction service. Extract ALL readable text from the PDF, preserving structure and formatting. Pay special attention to sections like LANGUAGES, CERTIFICATIONS, SKILLS, and ACHIEVEMENTS. Return the complete text with proper section headers.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                filename: file.name,
                file_data: `data:application/pdf;base64,${base64}`,
              },
              {
                type: 'input_text',
                text: 'Extract all text content from this PDF CV/resume. Make sure to include ALL sections including languages, certifications, skills, and achievements:',
              },
            ],
          },
        ],
      };
    } else if (mimeType.startsWith('image/')) {
      // Use Vision API for image files
      logger.debug('Sending image to OpenAI Vision API', {}, 'CV_PARSER');
      requestBody = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional CV/resume text extraction service. Extract ALL readable text from the image, preserving structure and formatting. Return only the extracted text - no commentary.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text content from this CV/resume image. Return the complete text with proper formatting:',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0,
      };
    } else {
      // For all other file types - use OpenAI to process
      logger.debug(
        'Processing file with OpenAI',
        { fileType: file.type },
        'CV_PARSER'
      );

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content:
                  'You are a professional CV/resume text extraction service. Extract ALL readable text from the provided file data, preserving structure and formatting. Return only the extracted text - no commentary.',
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Extract all text content from this ${file.type} file. The file is base64 encoded. Return the complete text with proper formatting.`,
                  },
                  {
                    type: 'text',
                    text: `File type: ${file.type}\nFile name: ${file.name}\nBase64 data: ${base64}`,
                  },
                ],
              },
            ],
            max_tokens: 4000,
            temperature: 0,
          }),
        }
      );

      logger.debug(
        'OpenAI file processing response status',
        { status: response.status },
        'CV_PARSER'
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          'OpenAI file processing error',
          { status: response.status, errorText },
          'CV_PARSER'
        );
        return {
          error: 'File processing failed. Please try again.',
        };
      }

      const data = await response.json();
      const extractedText = data.choices[0]?.message?.content;

      if (!extractedText || extractedText.trim().length < 50) {
        return {
          error:
            'Could not extract sufficient text from the file. Please try a different format.',
        };
      }

      logger.debug(
        'File processed successfully with OpenAI',
        { length: extractedText.length },
        'CV_PARSER'
      );
      return { text: extractedText.trim() };
    }

    // Use different endpoint for PDF files vs regular Vision API
    const endpoint =
      file.type === 'application/pdf'
        ? 'https://api.openai.com/v1/responses'
        : 'https://api.openai.com/v1/chat/completions';

    logger.debug('Using endpoint', { endpoint }, 'CV_PARSER');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    logger.debug(
      'OpenAI API response status',
      { status: response.status },
      'CV_PARSER'
    );
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        'OpenAI API error',
        { status: response.status, statusText: response.statusText, errorText },
        'CV_PARSER'
      );

      // Provide more specific error messages
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message?.includes('Invalid MIME type')) {
            return {
              error: `File format not supported: ${mimeType}. Please convert to text format.`,
            };
          }
          if (errorData.error?.message?.includes('endpoint')) {
            return {
              error:
                'PDF processing endpoint not available. Please convert your PDF to text format.',
            };
          }
        } catch (parseError) {
          // If we can't parse the error, use a generic message
        }
      }

      return {
        error:
          'Document processing failed. Please try converting to text format.',
      };
    }

    const data = await response.json();
    logger.debug(
      'OpenAI response data structure',
      { keys: Object.keys(data) },
      'CV_PARSER'
    );

    // Handle different response formats for different endpoints
    let extractedText;
    if (file.type === 'application/pdf') {
      // Response from /v1/responses endpoint has nested structure
      // data.output[0].content[0].text contains the extracted text
      logger.debug('Parsing PDF response structure', {}, 'CV_PARSER');

      if (
        data.output &&
        data.output[0] &&
        data.output[0].content &&
        data.output[0].content[0]
      ) {
        extractedText = data.output[0].content[0].text;
        logger.debug(
          'Found text in data.output[0].content[0].text',
          {},
          'CV_PARSER'
        );
      } else {
        logger.error(
          'Unexpected PDF response structure',
          {
            hasOutput: !!data.output,
            outputLength: data.output?.length,
            firstOutput: data.output?.[0],
            hasContent: !!data.output?.[0]?.content,
            contentLength: data.output?.[0]?.content?.length,
          },
          'CV_PARSER'
        );
        return {
          error:
            'Unexpected response format from PDF processing. Please try converting to text format.',
        };
      }
    } else {
      // Response from /v1/chat/completions endpoint
      extractedText = data.choices[0]?.message?.content;
    }

    // Ensure extractedText is a string
    if (typeof extractedText !== 'string') {
      logger.error(
        'extractedText is not a string',
        { type: typeof extractedText, extractedText },
        'CV_PARSER'
      );
      return {
        error:
          'Invalid response format from document processing. Please try converting to text format.',
      };
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return {
        error:
          'Could not extract sufficient text from the document. Please try converting to text format.',
      };
    }

    logger.debug(
      'OpenAI API extraction succeeded',
      { length: extractedText.length },
      'CV_PARSER'
    );
    return { text: extractedText.trim() };
  } catch (error) {
    logger.error('Document processing error', error, 'CV_PARSER');
    return {
      error:
        'Document processing failed. Please try converting your CV to a plain text file (.txt).',
    };
  }
}

/**
 * Analyze CV data completeness
 */
export function analyzeCompleteness(
  data: ExtractedCVData
): CompletenessAnalysis {
  // Define field requirements and priorities
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
      'availability_status',
      'compensation_expectations',
    ],
    enhanced: [
      'certifications',
      'achievements',
      'linkedInUrl',
      'website',
      'sectors',
      'travel_willingness',
      'remote_work_preference',
    ],
  };

  // Analyze present vs missing fields
  const presentFields: string[] = [];
  const missingCriticalFields: string[] = [];
  const missingHighValueFields: string[] = [];
  const missingEnhancedFields: string[] = [];

  // Check critical fields
  fieldRequirements.critical.forEach((field) => {
    const value = getFieldValue(data, field);
    if (value && value !== '' && value !== null && value !== undefined) {
      presentFields.push(field);
    } else {
      missingCriticalFields.push(field);
    }
  });

  // Check high value fields
  fieldRequirements.highValue.forEach((field) => {
    const value = getFieldValue(data, field);
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
    const value = getFieldValue(data, field);
    if (
      value &&
      (Array.isArray(value) ? value.length > 0 : value !== '' && value !== null)
    ) {
      presentFields.push(field);
    } else {
      missingEnhancedFields.push(field);
    }
  });

  // Calculate completeness score
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

/**
 * Get field value with flexible key mapping
 */
function getFieldValue(data: ExtractedCVData, field: string): any {
  const fieldMappings: Record<string, string[]> = {
    firstName: ['firstName', 'first_name'],
    lastName: ['lastName', 'last_name'],
    email: ['email'],
    phone: ['phone', 'phoneNumber'],
    location: ['location'],
    currentRole: ['currentRole', 'title', 'professional_headline'],
    currentCompany: ['currentCompany', 'company'],
    professionalBio: ['professionalBio', 'bio', 'summary'],
    workHistory: ['workHistory', 'workExperience', 'work_history'],
    boardExperience: ['boardExperience', 'board_experience'],
    education: ['education'],
    skills: ['skills'],
    languages: ['languages'],
    certifications: ['certifications'],
    achievements: ['achievements'],
    linkedInUrl: ['linkedInUrl', 'linkedin_url'],
    website: ['website'],
  };

  const possibleKeys = fieldMappings[field] || [field];

  for (const key of possibleKeys) {
    const value = (data as any)[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return null;
}

/**
 * Parse CV text using OpenAI
 */
export async function parseCVWithOpenAI(
  cvText: string
): Promise<CVParsingResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: 'AI parsing service not available',
      };
    }

    // Truncate CV text if too long to prevent token limit issues
    const maxCVLength = 6000; // Increased to capture complete CV including languages/certifications
    const truncatedCVText =
      cvText.length > maxCVLength
        ? cvText.substring(0, maxCVLength) +
          '\n[... content truncated for processing ...]'
        : cvText;

    logger.debug(
      'CV text processing',
      {
        originalLength: cvText.length,
        truncatedLength: truncatedCVText.length,
        preview: truncatedCVText.substring(0, 300),
      },
      'CV_PARSER'
    );

    // Debug: Check if important sections are in the text
    const hasLanguagesSection = truncatedCVText
      .toUpperCase()
      .includes('LANGUAGE');
    const hasCertificationsSection =
      truncatedCVText.toUpperCase().includes('CERTIF') ||
      truncatedCVText.toUpperCase().includes('AWS');
    const hasSkillsSection =
      truncatedCVText.toUpperCase().includes('SKILL') ||
      truncatedCVText.toUpperCase().includes('COMPETENC') ||
      truncatedCVText.toUpperCase().includes('TECHNICAL');
    const hasEducationSection =
      truncatedCVText.toUpperCase().includes('EDUCATION') ||
      truncatedCVText.toUpperCase().includes('UNIVERSITY') ||
      truncatedCVText.toUpperCase().includes('DEGREE');

    logger.debug(
      'Text analysis',
      {
        hasLanguagesSection,
        hasCertificationsSection,
        hasSkillsSection,
        hasEducationSection,
        textLength: truncatedCVText.length,
        wasTruncated: cvText.length > maxCVLength,
        lastChars: truncatedCVText.slice(-200),
      },
      'CV_PARSER'
    );

    // Check if we have meaningful text content
    if (truncatedCVText.length < 100) {
      logger.warn(
        'CV text is very short - document processing may have failed',
        { length: truncatedCVText.length },
        'CV_PARSER'
      );
    }

    if (
      !truncatedCVText.includes('@') &&
      !truncatedCVText.toLowerCase().includes('experience')
    ) {
      logger.warn(
        'CV text does not contain expected CV content - may be corrupted',
        {},
        'CV_PARSER'
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use mini model for better token efficiency
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
        max_tokens: 4000, // Increased to ensure complete extraction
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: `AI parsing failed: ${errorData.error?.message || 'Unknown error'}`,
      };
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: 'No response from AI parsing service',
      };
    }

    // Parse the JSON response with robust error handling
    let parsedData: ExtractedCVData;
    try {
      logger.debug(
        'Raw OpenAI response',
        { preview: content.substring(0, 500) },
        'CV_PARSER'
      );

      // Clean the response more thoroughly
      let cleanContent = content.trim();

      // Remove markdown code blocks
      cleanContent = cleanContent.replace(/```json\s*|\s*```/g, '');

      // Remove any text before the first { and after the last }
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      }

      logger.debug(
        'Cleaned content for parsing',
        { preview: cleanContent.substring(0, 200) + '...' },
        'CV_PARSER'
      );

      parsedData = JSON.parse(cleanContent);

      // Validate that we have a reasonable data structure
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Parsed data is not a valid object');
      }

      logger.debug(
        'Successfully parsed CV data',
        {
          keys: Object.keys(parsedData),
          languages: parsedData.languages,
          languagesCount: parsedData.languages?.length || 0,
          certifications: parsedData.certifications,
          certificationsCount: parsedData.certifications?.length || 0,
          skills: parsedData.skills,
          skillsCount: parsedData.skills?.length || 0,
          skillsRaw: JSON.stringify(parsedData.skills),
          achievements: parsedData.achievements?.slice(0, 3),
          achievementsCount: parsedData.achievements?.length || 0,
          workHistoryCount: parsedData.workHistory?.length || 0,
          boardExperienceCount: parsedData.boardExperience?.length || 0,
          educationCount: parsedData.education?.length || 0,
        },
        'CV_PARSER'
      );
    } catch (parseError) {
      logger.error(
        'JSON parsing failed',
        { parseError, rawContent: content },
        'CV_PARSER'
      );

      return {
        success: false,
        error:
          'Failed to parse AI response as JSON. Please try again or use a different file format.',
      };
    }

    return {
      success: true,
      data: parsedData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'CV parsing failed',
    };
  }
}

/**
 * Process CV file with OpenAI-first approach and completeness analysis
 */
export async function processCVInMemory(file: File): Promise<CVParsingResult> {
  try {
    logger.info(
      'Processing CV with OpenAI-first approach',
      { fileName: file.name, fileType: file.type },
      'CV_PARSER'
    );

    // Extract text using OpenAI Vision API
    const textResult = await processDocumentWithOpenAI(file);

    if (textResult.error || !textResult.text) {
      return {
        success: false,
        error: textResult.error || 'No text could be extracted from the file',
      };
    }

    logger.debug(
      'Text extracted successfully, parsing with AI',
      { textLength: textResult.text.length },
      'CV_PARSER'
    );

    // Parse the extracted text into structured data
    const parseResult = await parseCVWithOpenAI(textResult.text);

    if (!parseResult.success || !parseResult.data) {
      return parseResult;
    }

    // Enhance parsed data with computed fields and auto-generate bio
    const enhancedData = await enhanceParsedData(parseResult.data);

    // Analyze completeness
    const completenessAnalysis = analyzeCompleteness(enhancedData);

    logger.info(
      'CV processed with completeness analysis',
      {
        overallCompleteness: completenessAnalysis.overallCompleteness,
        boardExperienceCount: enhancedData.boardExperience?.length || 0,
        workHistoryCount: enhancedData.workHistory?.length || 0,
        educationCount: enhancedData.education?.length || 0,
        skillsCount: enhancedData.skills?.length || 0,
        missingCriticalFields: completenessAnalysis.missingCriticalFields,
      },
      'CV_PARSER'
    );

    if (enhancedData.boardExperience?.length) {
      logger.debug(
        'Detected board experience',
        {
          experiences: enhancedData.boardExperience.map(
            (exp) => `${exp.role} at ${exp.organization}`
          ),
        },
        'CV_PARSER'
      );
    }

    if (enhancedData.currentRole && enhancedData.currentCompany) {
      logger.debug(
        'Current role detected',
        {
          role: enhancedData.currentRole,
          company: enhancedData.currentCompany,
        },
        'CV_PARSER'
      );
    }

    return {
      success: true,
      data: enhancedData,
      completenessAnalysis,
    };
  } catch (error) {
    logger.error('CV processing error', error, 'CV_PARSER');
    return {
      success: false,
      error: `Failed to process CV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Enhance parsed CV data with computed fields and auto-generated bio
 */
async function enhanceParsedData(
  data: ExtractedCVData
): Promise<ExtractedCVData> {
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
      enhanced.workHistory?.filter((job) => job.is_current) || [];
    allCurrentRoles.push(
      ...currentWorkRoles.map((job) => ({
        role: job.title,
        company: job.company,
        type: 'work',
      }))
    );

    // Add current board experience roles
    const currentBoardRoles =
      enhanced.boardExperience?.filter((exp) => exp.is_current) || [];
    allCurrentRoles.push(
      ...currentBoardRoles.map((exp) => ({
        role: exp.role,
        company: exp.organization,
        type: 'board',
      }))
    );

    if (allCurrentRoles.length > 0) {
      // For primary role, prioritize full-time work over board positions
      const primaryRole =
        allCurrentRoles.find((r) => r.type === 'work') || allCurrentRoles[0];

      if (!enhanced.currentRole && primaryRole.role) {
        enhanced.currentRole = primaryRole.role;
      }
      if (!enhanced.currentCompany && primaryRole.company) {
        enhanced.currentCompany = primaryRole.company;
      }

      // Store additional current roles for completeness analysis
      if (allCurrentRoles.length > 1) {
        enhanced.additionalCurrentRoles = allCurrentRoles
          .slice(1)
          .map((r) => `${r.role} at ${r.company}`);
        logger.debug(
          'Multiple current roles detected',
          { count: allCurrentRoles.length },
          'CV_PARSER'
        );
      }
    }

    // Fallback to title field for current role
    if (!enhanced.currentRole && enhanced.title) {
      enhanced.currentRole = enhanced.title;
    }
  }

  // Auto-generate professional bio if not present
  if (!enhanced.professionalBio && process.env.OPENAI_API_KEY) {
    try {
      enhanced.professionalBio = await generateProfessionalBio(enhanced);
      logger.debug('Auto-generated professional bio', {}, 'CV_PARSER');
    } catch (error) {
      logger.warn('Failed to auto-generate bio', error, 'CV_PARSER');
    }
  }

  return enhanced;
}

/**
 * Generate professional bio from CV data using AI
 */
async function generateProfessionalBio(data: ExtractedCVData): Promise<string> {
  const bioPrompt = `Create a professional biography based on the following CV data. Write in third person, 2-3 sentences, focusing on current role, key achievements, and board experience if applicable.

Name: ${data.firstName} ${data.lastName}
Current Role: ${data.currentRole} at ${data.currentCompany}
Work Experience: ${data.workHistory?.length || 0} positions
Board Experience: ${data.boardExperience?.length || 0} roles
Education: ${data.education?.map((e) => `${e.degree} from ${e.institution}`).join(', ') || 'Not specified'}

Key achievements: ${data.achievements?.slice(0, 3).join(', ') || 'Various professional accomplishments'}

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

/**
 * Map extracted CV data to profile fields
 */
export function mapCVDataToProfile(
  cvData: ExtractedCVData
): Record<string, any> {
  const profileData: Record<string, any> = {};

  // Basic information
  if (cvData.firstName) profileData.first_name = cvData.firstName;
  if (cvData.lastName) profileData.last_name = cvData.lastName;
  if (cvData.email) profileData.email = cvData.email;
  if (cvData.phone) profileData.phone = cvData.phone;
  if (cvData.location) profileData.location = cvData.location;
  if (cvData.title) profileData.professional_headline = cvData.title;
  if (cvData.summary) profileData.bio = cvData.summary;
  if (cvData.linkedInUrl) profileData.linkedin_url = cvData.linkedInUrl;
  if (cvData.website) profileData.website = cvData.website;

  // Skills
  if (cvData.skills && cvData.skills.length > 0) {
    profileData.skills = cvData.skills;
  }

  // Languages
  if (cvData.languages && cvData.languages.length > 0) {
    profileData.languages = cvData.languages;
  }

  // Note: Current company info is stored in work_experience table, not profile

  // Mark as imported from CV
  profileData.data_sources = {
    cv: {
      imported_at: new Date().toISOString(),
      fields: Object.keys(profileData),
    },
  };

  return profileData;
}
