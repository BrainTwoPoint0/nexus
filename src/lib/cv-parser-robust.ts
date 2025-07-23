/**
 * Robust CV/Resume Parsing Service
 * Uses multiple proven libraries for reliable text extraction
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CVParsingResult {
  success: boolean;
  data?: ExtractedCVData;
  confidence?: number;
  error?: string;
}

export interface ExtractedCVData {
  // Personal Information
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedInUrl?: string;
  website?: string;

  // Professional Summary
  title?: string;
  summary?: string;

  // Work Experience
  workExperience?: WorkExperience[];

  // Education
  education?: Education[];

  // Skills
  skills?: string[];

  // Additional Info
  languages?: string[];
  certifications?: string[];
  achievements?: string[];
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string; // null if current
  location?: string;
  description?: string;
  achievements?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  achievements?: string[];
}

/**
 * Extract text from different file types using robust libraries
 */
export async function extractTextFromFile(
  file: File
): Promise<{ text?: string; error?: string }> {
  try {
    console.log(
      '🔍 Starting robust text extraction for:',
      file.name,
      'type:',
      file.type,
      'size:',
      file.size
    );

    // Handle plain text files
    if (file.type === 'text/plain') {
      const text = await file.text();
      console.log('✅ Text file extracted, length:', text.length);
      return { text };
    }

    // Handle PDF files with improved pdf-parse
    if (file.type === 'application/pdf') {
      return await extractTextFromPDFRobust(file);
    }

    // Handle Word documents with officeParser
    if (
      file.type.includes('word') ||
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await extractTextFromWordRobust(file);
    }

    // Try office-text-extractor as universal fallback
    return await extractTextWithUniversalExtractor(file);
  } catch (error) {
    console.error('❌ File extraction error:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to extract text from file',
    };
  }
}

/**
 * Extract text from PDF using improved pdf-parse configuration
 */
async function extractTextFromPDFRobust(
  file: File
): Promise<{ text?: string; error?: string }> {
  try {
    console.log('📄 Extracting text from PDF:', file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Try pdf-parse with better configuration
      const pdfParse = await import('pdf-parse');

      // Configure pdf-parse options for better text extraction
      const options = {
        // Use standard pdf-parse options only
      };

      const data = await pdfParse.default(buffer, options);

      console.log('📄 PDF extraction result:', {
        hasText: !!data.text,
        length: data.text?.length || 0,
        numPages: data.numpages,
        info: data.info,
      });

      if (data.text && data.text.trim().length > 20) {
        console.log(
          '✅ PDF text extracted successfully, length:',
          data.text.length
        );
        // Clean up the extracted text
        const cleanText = data.text
          .replace(/\\s+/g, ' ') // Multiple spaces to single space
          .replace(/\\n\\s*\\n/g, '\\n') // Multiple newlines to single
          .trim();
        return { text: cleanText };
      }

      console.log(
        '⚠️ PDF contained minimal text, trying universal extractor...'
      );
      return await extractTextWithUniversalExtractor(file);
    } catch (pdfError) {
      console.error('❌ PDF parsing failed:', pdfError);
      return await extractTextWithUniversalExtractor(file);
    }
  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    return {
      error:
        'Failed to process PDF file. The file may be corrupted, password-protected, or scanned. Please try converting to Word (.docx) or text (.txt) format.',
    };
  }
}

/**
 * Extract text from Word document using officeParser
 */
async function extractTextFromWordRobust(
  file: File
): Promise<{ text?: string; error?: string }> {
  try {
    console.log('📝 Extracting text from Word document:', file.name);

    const arrayBuffer = await file.arrayBuffer();

    try {
      // Try officeParser - more robust than mammoth
      const officeParser = await import('officeparser');

      console.log('🔧 Using officeParser for DOCX extraction...');

      // officeParser expects a buffer
      const buffer = Buffer.from(arrayBuffer);

      // Extract text using officeParser
      const data = await officeParser.parseOfficeAsync(buffer);

      console.log('📝 OfficeParser extraction result:', {
        hasData: !!data,
        length: data?.length || 0,
        preview: data?.substring(0, 100) || 'No preview available',
      });

      if (data && data.trim().length > 20) {
        console.log(
          '✅ Word document text extracted successfully with officeParser, length:',
          data.length
        );
        return { text: data.trim() };
      }

      console.log(
        '⚠️ OfficeParser extracted minimal text, trying universal extractor...'
      );
      return await extractTextWithUniversalExtractor(file);
    } catch (officeParserError) {
      console.error('❌ OfficeParser failed:', officeParserError);

      // Fallback to mammoth if officeParser fails
      try {
        console.log('🔄 Fallback: trying mammoth...');
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer });

        if (result.value && result.value.trim().length > 20) {
          console.log(
            '✅ Word document text extracted with mammoth fallback, length:',
            result.value.length
          );
          return { text: result.value.trim() };
        }

        console.log(
          '⚠️ Mammoth also extracted minimal text, trying universal extractor...'
        );
        return await extractTextWithUniversalExtractor(file);
      } catch (mammothError) {
        console.error('❌ Mammoth fallback also failed:', mammothError);
        return await extractTextWithUniversalExtractor(file);
      }
    }
  } catch (error) {
    console.error('❌ Word document extraction error:', error);
    return {
      error:
        'Failed to process Word document. Please try saving as a newer .docx format, converting to PDF, or using text (.txt) format.',
    };
  }
}

/**
 * Universal text extractor using office-text-extractor
 */
async function extractTextWithUniversalExtractor(
  file: File
): Promise<{ text?: string; error?: string }> {
  try {
    console.log('🌐 Using universal text extractor for:', file.type);

    const textExtractor = await import('office-text-extractor');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get file extension from filename or mime type
    const extension =
      file.name.split('.').pop()?.toLowerCase() ||
      (file.type.includes('pdf')
        ? 'pdf'
        : file.type.includes('word')
          ? 'docx'
          : 'txt');

    console.log(
      '🔧 Attempting universal extraction with extension:',
      extension
    );

    // Use the universal extractor
    const extractor = textExtractor.getTextExtractor();
    const text = await extractor.extractText({ input: buffer, type: 'buffer' });

    console.log('🌐 Universal extractor result:', {
      hasText: !!text,
      length: text?.length || 0,
      preview: text?.substring(0, 100) || 'No preview',
    });

    if (text && text.trim().length > 20) {
      console.log('✅ Universal extractor succeeded, length:', text.length);
      return { text: text.trim() };
    }

    // Last resort: try OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      console.log('🤖 Last resort: trying OpenAI extraction...');
      return await extractTextWithOpenAI(file);
    }

    return {
      error:
        'Could not extract sufficient text from the document. Please try: 1) Save as a simpler format, 2) Copy text to a .txt file, 3) Check if the file contains readable text (not just images).',
    };
  } catch (error) {
    console.error('❌ Universal extractor failed:', error);

    // Final fallback to OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      console.log('🤖 Final fallback: trying OpenAI extraction...');
      return await extractTextWithOpenAI(file);
    }

    return {
      error:
        'Text extraction failed with all methods. Please try converting your CV to a plain text file (.txt) for the most reliable processing.',
    };
  }
}

/**
 * OpenAI-based text extraction as final fallback
 */
async function extractTextWithOpenAI(
  file: File
): Promise<{ text?: string; error?: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        error:
          'Advanced text extraction not available. Please try converting your CV to a plain text file (.txt).',
      };
    }

    console.log('🤖 Using OpenAI for text extraction from:', file.type);

    // Convert file to base64 with size limit
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Limit file size for OpenAI (avoid token limits)
    const maxSize = 1024 * 1024; // 1MB limit
    if (buffer.length > maxSize) {
      return {
        error:
          'File too large for advanced processing. Please try a smaller file or convert to text format.',
      };
    }

    const base64 = buffer.toString('base64');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional CV/resume text extraction service. Extract ALL readable text from the document, preserving structure and formatting. Include names, contact details, work experience, education, skills, etc. Return only the extracted text - no commentary.',
          },
          {
            role: 'user',
            content: `Extract all text from this CV/resume file (${getFileTypeDescription(file.type)}). Return the complete text content:\\n\\nFile data (base64): ${base64.substring(0, 2000)}...`,
          },
        ],
        max_tokens: 4000,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.error(
        '🤖 OpenAI API error:',
        response.status,
        response.statusText
      );
      return {
        error:
          'Advanced text extraction failed. Please try converting your CV to a plain text file (.txt).',
      };
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content;

    if (!extractedText || extractedText.trim().length < 50) {
      return {
        error:
          'Could not extract sufficient text. Please try converting your CV to a plain text file (.txt) for the most reliable processing.',
      };
    }

    console.log(
      '✅ OpenAI extraction succeeded, length:',
      extractedText.length
    );
    return { text: extractedText.trim() };
  } catch (error) {
    console.error('❌ OpenAI extraction error:', error);
    return {
      error:
        'Text extraction failed. Please try converting your CV to a plain text file (.txt) for the most reliable processing.',
    };
  }
}

/**
 * Get human-readable file type description
 */
function getFileTypeDescription(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf':
      return 'PDF';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'Word (DOCX)';
    case 'application/msword':
      return 'Word (DOC)';
    case 'text/plain':
      return 'text';
    default:
      return 'document';
  }
}

/**
 * Fallback regex extraction when JSON parsing fails
 */
function extractDataWithRegex(text: string): ExtractedCVData {
  const data: ExtractedCVData = {};

  // Extract email
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  );
  if (emailMatch) data.email = emailMatch[0];

  // Extract phone
  const phoneMatch = text.match(
    /[\+]?[1-9]?[\-\s\(\)]?[(]?[0-9]{3}[)]?[\-\s\.]?[0-9]{3}[\-\s\.]?[0-9]{4,6}/g
  );
  if (phoneMatch) data.phone = phoneMatch[0];

  // Extract basic name patterns (very simple)
  const nameMatch = text.match(
    /(?:firstName|first_name|First Name)[":\s]*([A-Za-z]+)/i
  );
  if (nameMatch) data.firstName = nameMatch[1];

  const lastNameMatch = text.match(
    /(?:lastName|last_name|Last Name)[":\s]*([A-Za-z]+)/i
  );
  if (lastNameMatch) data.lastName = lastNameMatch[1];

  // Extract skills (look for skills section)
  const skillsSection = text.match(/(?:skills|Skills)[":\s]*\[([^\]]+)\]/i);
  if (skillsSection) {
    const skills = skillsSection[1]
      .split(',')
      .map((s) => s.trim().replace(/"/g, ''));
    data.skills = skills;
  }

  return data;
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

    const prompt = `You are a CV/Resume parser. Extract information from the following CV text and return ONLY a valid JSON object with this exact structure:

{
  "firstName": "string or null",
  "lastName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "linkedInUrl": "string or null",
  "website": "string or null",
  "title": "string or null",
  "summary": "string or null",
  "workExperience": [],
  "education": [],
  "skills": [],
  "languages": [],
  "certifications": [],
  "achievements": []
}

IMPORTANT: 
- Return ONLY the JSON object, no other text
- Use null for missing string fields
- Use empty arrays [] for missing array fields
- Ensure the JSON is valid and parseable

CV Text:
${cvText}

JSON:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a CV/Resume parser. You MUST return only valid JSON with no additional text, explanations, or markdown. The JSON must be parseable by JSON.parse().',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
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
      console.log('Raw OpenAI response:', content.substring(0, 500));

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

      console.log(
        'Cleaned content for parsing:',
        cleanContent.substring(0, 200) + '...'
      );

      parsedData = JSON.parse(cleanContent);

      // Validate that we have a reasonable data structure
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Parsed data is not a valid object');
      }

      console.log('Successfully parsed CV data:', Object.keys(parsedData));
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Raw content:', content);

      // Try to extract at least basic info using regex if JSON parsing fails
      try {
        const fallbackData = extractDataWithRegex(content);
        if (fallbackData && Object.keys(fallbackData).length > 0) {
          console.log('Fallback regex extraction succeeded');
          parsedData = fallbackData;
        } else {
          return {
            success: false,
            error:
              'Failed to parse AI response as JSON and regex fallback found no data',
          };
        }
      } catch (regexError) {
        return {
          success: false,
          error:
            'Failed to parse AI response as JSON and regex fallback also failed',
        };
      }
    }

    // Calculate confidence score based on how much data was extracted
    const confidence = calculateConfidenceScore(parsedData);

    return {
      success: true,
      data: parsedData,
      confidence,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'CV parsing failed',
    };
  }
}

/**
 * Calculate confidence score based on extracted data completeness
 */
function calculateConfidenceScore(data: ExtractedCVData): number {
  let score = 0;
  let maxScore = 0;

  // Basic personal info (30 points)
  maxScore += 30;
  if (data.firstName) score += 5;
  if (data.lastName) score += 5;
  if (data.email) score += 10;
  if (data.phone) score += 5;
  if (data.location) score += 5;

  // Professional info (40 points)
  maxScore += 40;
  if (data.title) score += 10;
  if (data.summary) score += 10;
  if (data.workExperience && data.workExperience.length > 0) {
    score += 20;
  }

  // Education (20 points)
  maxScore += 20;
  if (data.education && data.education.length > 0) {
    score += 20;
  }

  // Skills and extras (10 points)
  maxScore += 10;
  if (data.skills && data.skills.length > 0) score += 5;
  if (data.languages && data.languages.length > 0) score += 2;
  if (data.certifications && data.certifications.length > 0) score += 3;

  return Math.round((score / maxScore) * 100) / 100; // Return as decimal between 0 and 1
}

/**
 * Process CV file completely in-memory during onboarding
 * Extracts text and parses it without storing the file
 */
export async function processCVInMemory(file: File): Promise<{
  success: boolean;
  data?: ExtractedCVData;
  confidence?: number;
  error?: string;
}> {
  try {
    console.log(
      '🚀 Processing CV in-memory with robust extraction:',
      file.name,
      file.type
    );

    // Extract text from file using robust methods
    const textResult = await extractTextFromFile(file);

    if (textResult.error || !textResult.text) {
      return {
        success: false,
        error: textResult.error || 'No text could be extracted from the file',
      };
    }

    console.log(
      '✅ Text extracted successfully, parsing with AI...',
      textResult.text.length,
      'characters'
    );

    // Parse the extracted text into structured data
    const parseResult = await parseCVWithOpenAI(textResult.text);

    return parseResult;
  } catch (error) {
    console.error('❌ CV processing error:', error);
    return {
      success: false,
      error: `Failed to process CV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
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
  if (cvData.title) profileData.title = cvData.title;
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

  // Extract current company from work experience
  if (cvData.workExperience && cvData.workExperience.length > 0) {
    // Find current job (no end date) or most recent job
    const currentJob = cvData.workExperience.find((job) => !job.endDate);
    if (currentJob) {
      profileData.company = currentJob.company;
    } else if (cvData.workExperience.length > 0) {
      profileData.company = cvData.workExperience[0].company;
    }
  }

  // Mark as imported from CV
  profileData.data_sources = {
    cv: {
      imported_at: new Date().toISOString(),
      confidence: calculateConfidenceScore(cvData),
      fields: Object.keys(profileData),
    },
  };

  return profileData;
}
