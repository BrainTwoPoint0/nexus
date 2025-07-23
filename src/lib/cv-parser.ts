/**
 * CV/Resume Parsing Service
 * Uses OpenAI to extract structured data from CV text
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
 * Unified text extraction from all supported file types
 * Processes files in-memory without storage during onboarding
 */
export async function extractTextFromFile(
  file: File
): Promise<{ text?: string; error?: string }> {
  try {
    console.log(
      'Starting text extraction for:',
      file.name,
      'type:',
      file.type,
      'size:',
      file.size
    );

    // Handle plain text files
    if (file.type === 'text/plain') {
      const text = await file.text();
      console.log('Text file extracted, length:', text.length);
      return { text };
    }

    // Handle PDF files
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    }

    // Handle Word documents
    if (
      file.type.includes('word') ||
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await extractTextFromWordDoc(file);
    }

    return {
      error: 'Unsupported file format. Please upload PDF, DOCX, or TXT files.',
    };
  } catch (error) {
    console.error('File extraction error:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to extract text from file',
    };
  }
}

/**
 * Extract text from PDF with improved error handling
 */
async function extractTextFromPDF(
  file: File
): Promise<{ text?: string; error?: string }> {
  try {
    console.log('Extracting text from PDF:', file.name, 'size:', file.size);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Try pdf-parse library
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer);

      console.log('PDF extraction result:', {
        hasText: !!data.text,
        length: data.text?.length || 0,
        numPages: data.numpages,
        preview: data.text?.substring(0, 100),
      });

      if (data.text && data.text.trim().length > 10) {
        // Lowered threshold
        console.log(
          'PDF text extracted successfully, length:',
          data.text.length
        );
        return { text: data.text.trim() };
      }

      // If we got some text but very little, it might still be useful
      if (data.text && data.text.trim().length > 0) {
        console.log('Got minimal text from PDF:', data.text.length, 'chars');
        return { text: data.text.trim() };
      }

      return {
        error:
          'No readable text found in PDF. This appears to be a scanned or image-based PDF. Please try: 1) Convert to a Word document (.docx), 2) Copy and paste text to a .txt file, or 3) Use a different PDF with selectable text.',
      };
    } catch (pdfError) {
      console.error('PDF parsing failed:', pdfError);

      if (
        pdfError instanceof Error &&
        pdfError.message.includes('Invalid PDF')
      ) {
        return {
          error:
            'Invalid PDF file. Please check that the file is not corrupted and try again.',
        };
      }

      return {
        error:
          'Could not parse PDF file. The file may be corrupted, password-protected, or use an unsupported format. Please try converting to Word (.docx) or text (.txt) format.',
      };
    }
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      error:
        'Failed to process PDF file. Please try uploading your CV as a Word document (.docx) or text file (.txt) instead.',
    };
  }
}

/**
 * Extract text from Word document with improved error handling
 */
async function extractTextFromWordDoc(
  file: File
): Promise<{ text?: string; error?: string }> {
  try {
    console.log(
      'Extracting text from Word document:',
      file.name,
      'size:',
      file.size
    );

    const arrayBuffer = await file.arrayBuffer();

    try {
      // Try mammoth library for DOCX files
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });

      console.log('Mammoth extraction result:', {
        hasValue: !!result.value,
        length: result.value?.length || 0,
        preview: result.value?.substring(0, 100),
      });

      if (result.value && result.value.trim().length > 10) {
        // Lowered threshold
        console.log(
          'Word document text extracted successfully with mammoth, length:',
          result.value.length
        );
        return { text: result.value.trim() };
      }

      // If we got some text but very little, it might still be useful
      if (result.value && result.value.trim().length > 0) {
        console.log(
          'Got minimal text from mammoth:',
          result.value.length,
          'chars'
        );
        return { text: result.value.trim() };
      }

      return {
        error:
          'No readable text found in Word document. The file may be corrupted, password-protected, or contain mostly images. Please try: 1) Save as a new .docx file, 2) Convert to PDF, or 3) Copy text to a .txt file.',
      };
    } catch (mammothError) {
      console.error('Mammoth parsing failed:', mammothError);

      // Check if it's a format issue
      if (
        mammothError instanceof Error &&
        mammothError.message.includes('not supported')
      ) {
        return {
          error:
            'Word document format not supported. Please save as a newer .docx format or try converting to PDF.',
        };
      }

      return {
        error:
          'Could not parse Word document. Please try: 1) Save as PDF instead, 2) Copy your CV text to a .txt file, or 3) Check if the file is corrupted.',
      };
    }
  } catch (error) {
    console.error('Word document extraction error:', error);
    return {
      error:
        'Failed to process Word document. Please try uploading your CV as a PDF or text file (.txt) instead.',
    };
  }
}

/**
 * Extract text using OpenAI as a fallback method
 */
// async function extractTextWithOpenAI(file: File): Promise<{ text?: string; error?: string }> {
//   try {
//     if (!process.env.OPENAI_API_KEY) {
//       return {
//         error: 'Document parsing failed. Please try uploading your CV as a plain text file (.txt) instead.'
//       };
//     }

//     console.log('Using OpenAI fallback for text extraction from:', file.type);

//     // Convert file to base64
//     const arrayBuffer = await file.arrayBuffer();
//     const base64 = Buffer.from(arrayBuffer).toString('base64');

//     // Truncate base64 for the prompt (OpenAI has token limits)
//     const maxBase64Length = 50000; // Reasonable limit
//     const truncatedBase64 = base64.length > maxBase64Length ?
//       base64.substring(0, maxBase64Length) + '...[truncated]' : base64;

//     const response = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'gpt-3.5-turbo',
//         messages: [
//           {
//             role: 'system',
//             content: 'You are a CV/resume text extraction service. Extract ALL readable text from the document. Return the complete text content exactly as it appears, preserving structure. Include name, contact info, work experience, education, skills, etc. Do not add any analysis or commentary - just the extracted text.'
//           },
//           {
//             role: 'user',
//             content: `Please extract all text content from this ${getFileTypeDescription(file.type)} CV/resume document. The document is provided as base64 data. Return only the text content:\n\n${truncatedBase64}`
//           }
//         ],
//         max_tokens: 4000,
//         temperature: 0
//       }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({ error: { message: 'API request failed' } }));
//       console.error('OpenAI API error:', errorData);
//       return {
//         error: `Text extraction failed. Please try uploading your CV as a plain text file (.txt) instead.`
//       };
//     }

//     const data = await response.json();
//     const extractedText = data.choices[0]?.message?.content;

//     if (!extractedText || extractedText.trim().length < 50) {
//       return {
//         error: 'Could not extract sufficient text from the document. Please try uploading your CV as a plain text file (.txt) instead.'
//       };
//     }

//     console.log('Successfully extracted text using OpenAI, length:', extractedText.length);
//     return { text: extractedText.trim() };

//   } catch (error) {
//     console.error('OpenAI text extraction error:', error);
//     return {
//       error: 'Text extraction failed. Please try uploading your CV as a plain text file (.txt) instead.'
//     };
//   }
// }

/**
 * Get human-readable file type description
 */
// function getFileTypeDescription(mimeType: string): string {
//   switch (mimeType) {
//     case 'application/pdf':
//       return 'PDF';
//     case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
//       return 'Word (DOCX)';
//     case 'application/msword':
//       return 'Word (DOC)';
//     case 'text/plain':
//       return 'text';
//     default:
//       return 'document';
//   }
// }

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
    console.log('Processing CV in-memory:', file.name, file.type);

    // Extract text from file
    const textResult = await extractTextFromFile(file);

    if (textResult.error || !textResult.text) {
      return {
        success: false,
        error: textResult.error || 'No text could be extracted from the file',
      };
    }

    console.log('Text extracted successfully, parsing with OpenAI...');

    // Parse the extracted text into structured data
    const parseResult = await parseCVWithOpenAI(textResult.text);

    return parseResult;
  } catch (error) {
    console.error('CV processing error:', error);
    return {
      success: false,
      error: `Failed to process CV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
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
        error: 'OpenAI API key not configured',
      };
    }

    const prompt = `
Extract structured information from this CV/Resume text. Return a JSON object with the following structure:

{
  "firstName": "string",
  "lastName": "string", 
  "email": "string",
  "phone": "string",
  "location": "string (city, country)",
  "linkedInUrl": "string",
  "website": "string",
  "title": "string (current or most recent job title)",
  "summary": "string (professional summary or objective)",
  "workExperience": [
    {
      "company": "string",
      "position": "string", 
      "startDate": "YYYY-MM or YYYY",
      "endDate": "YYYY-MM or YYYY or null if current",
      "location": "string",
      "description": "string",
      "achievements": ["string array of key achievements"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "YYYY",
      "endDate": "YYYY",
      "gpa": "string",
      "achievements": ["string array"]
    }
  ],
  "skills": ["array of skills"],
  "languages": ["array of languages"],
  "certifications": ["array of certifications"],
  "achievements": ["array of notable achievements/awards"]
}

Return only valid JSON. If a field is not found, use null or empty array as appropriate.

CV Text:
${cvText}
`;

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
              'You are an expert CV/Resume parser. Extract information accurately and return valid JSON only.',
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
        error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
      };
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: 'No response from OpenAI',
      };
    }

    // Parse the JSON response
    let parsedData: ExtractedCVData;
    try {
      // Clean the response in case it has markdown formatting
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanContent);
    } catch (parseError) {
      return {
        success: false,
        error: 'Failed to parse OpenAI response as JSON',
      };
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
