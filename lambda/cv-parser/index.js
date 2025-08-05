/**
 * AWS Lambda function for CV parsing
 * Handles OpenAI processing with 15-minute timeout
 */

const { Buffer } = require('buffer');

// CV parsing logic
async function processDocumentWithOpenAI(fileBuffer, fileName, mimeType) {
  console.log('Processing with OpenAI-only approach', {
    fileName,
    mimeType,
    fileSize: fileBuffer.length,
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  console.log('Starting text extraction...');

  // Handle plain text files directly - no AI needed
  if (mimeType === 'text/plain') {
    const text = fileBuffer.toString('utf8');
    console.log('Text file processed directly', { length: text.length });
    return { text };
  }

  // File size limit
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (fileBuffer.length > maxSize) {
    throw new Error(
      'File too large for processing. Please use a file smaller than 10MB.'
    );
  }

  const base64 = fileBuffer.toString('base64');

  console.log('File type detected', { mimeType });

  // Handle DOCX files by extracting text with mammoth
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    console.log('Processing DOCX file with mammoth');

    try {
      // Try to use mammoth if available
      const mammoth = require('mammoth');

      // Extract raw text from DOCX buffer
      const result = await mammoth.extractRawText({ buffer: fileBuffer });

      if (result.messages && result.messages.length > 0) {
        console.log('Mammoth conversion messages', {
          messages: result.messages,
        });
      }

      const extractedText = result.value;

      if (!extractedText || extractedText.trim().length < 50) {
        console.log(
          'Insufficient text extracted from DOCX, falling back to OpenAI'
        );
        throw new Error('Insufficient text from mammoth');
      }

      console.log('Text extracted from DOCX successfully', {
        length: extractedText.length,
      });

      return { text: extractedText.trim() };
    } catch (mammothError) {
      // Fallback to OpenAI if mammoth fails
      console.log('Mammoth extraction failed, falling back to OpenAI', {
        error: mammothError.message,
      });
      // Continue with OpenAI extraction below
    }
  }

  // Handle PDF files with pdf-parse
  if (mimeType === 'application/pdf') {
    console.log('Processing PDF with pdf-parse');

    try {
      const pdfParse = require('pdf-parse');

      // Extract text from PDF buffer
      const pdfData = await pdfParse(fileBuffer);

      if (!pdfData.text || pdfData.text.trim().length < 50) {
        console.log(
          'Insufficient text extracted from PDF, will fallback to OpenAI'
        );
        throw new Error('Insufficient text from pdf-parse');
      }

      console.log('Text extracted from PDF successfully', {
        length: pdfData.text.length,
      });

      return { text: pdfData.text.trim() };
    } catch (pdfError) {
      console.log(
        'PDF parsing failed, falling back to OpenAI Vision (treating as image)',
        { error: pdfError.message }
      );
      // Continue with OpenAI extraction below as fallback
    }
  }

  // Use OpenAI for text extraction from images (and PDF fallback)
  let requestBody;

  if (mimeType === 'application/pdf') {
    // Fallback: Try processing PDF as image with OpenAI Vision API
    console.log('Processing PDF with OpenAI Vision API (fallback)');
    // Note: This may not work as Vision API doesn't support PDF MIME type
    // but we'll try converting the approach
    throw new Error(
      'PDF processing is currently not supported. Please convert your CV to an image format (JPG, PNG) or text file (TXT) and try again.'
    );
  } else if (mimeType.startsWith('image/')) {
    // Use Vision API for image files
    console.log('Sending image to OpenAI Vision API');
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
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('OpenAI API response status', { status: response.status });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error', {
      status: response.status,
      statusText: response.statusText,
      errorText,
    });
    throw new Error(
      'Document processing failed. Please try converting to text format.'
    );
  }

  const data = await response.json();
  const extractedText = data.choices[0]?.message?.content;

  if (!extractedText || extractedText.trim().length < 50) {
    throw new Error(
      'Could not extract sufficient text from the document. Please try converting to text format.'
    );
  }

  console.log('OpenAI API extraction succeeded', {
    length: extractedText.length,
  });

  return { text: extractedText.trim() };
}

async function parseCVWithOpenAI(cvText) {
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
  "workExperience": [],
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
- position: Job title from CV
- startDate: Extract start date in any format mentioned (e.g., "March 2023", "2023", "Mar 2023", "03/2023")
- endDate: Extract end date if mentioned (null if current/present)
- location: Work location if mentioned
- description: Extract the COMPLETE job description, responsibilities, and role details
- achievements: List of specific achievements, accomplishments, metrics, or quantifiable results mentioned

IMPORTANT FOR DATES: Look for date patterns like:
- "March 2023 - Present" 
- "2022 - 2024"
- "Jan 2020 - Mar 2023"
- "2019 - Current"
- Single dates like "Since 2022"
- Academic years like "2018-2021"

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
  } catch (parseError) {
    console.error('JSON parsing failed', { parseError, rawContent: content });
    throw new Error(
      'Failed to parse AI response as JSON. Please try again or use a different file format.'
    );
  }

  console.log('CV data parsing completed');

  return parsedData;
}

// Enhanced data processing
async function enhanceParsedData(data) {
  const enhanced = { ...data };

  // Compute fullName from firstName and lastName
  if (!enhanced.fullName && (enhanced.firstName || enhanced.lastName)) {
    if (enhanced.firstName && enhanced.lastName) {
      enhanced.fullName = `${enhanced.firstName} ${enhanced.lastName}`;
    } else {
      enhanced.fullName = enhanced.firstName || enhanced.lastName;
    }
  }

  // Handle current role from work experience
  if (!enhanced.currentRole || !enhanced.currentCompany) {
    // Find current work experience
    const currentWork = enhanced.workExperience?.find(
      (job) =>
        !job.endDate ||
        job.endDate === null ||
        job.endDate === 'Present' ||
        job.endDate === 'Current'
    );

    if (currentWork) {
      if (!enhanced.currentRole && currentWork.position) {
        enhanced.currentRole = currentWork.position;
      }
      if (!enhanced.currentCompany && currentWork.company) {
        enhanced.currentCompany = currentWork.company;
      }
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

// Generate professional bio from CV data
async function generateProfessionalBio(data) {
  const bioPrompt = `Create a professional biography based on the following CV data. Write in third person, 2-3 sentences, focusing on current role, key achievements, and board experience if applicable.

Name: ${data.firstName} ${data.lastName}
Current Role: ${data.currentRole} at ${data.currentCompany}
Work Experience: ${data.workExperience?.length || 0} positions
Education: ${data.education?.map((e) => `${e.degree} from ${e.institution}`).join(', ') || 'Not specified'}

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

// Completeness analysis
function analyzeCompleteness(data) {
  const fieldRequirements = {
    critical: [
      'firstName',
      'lastName',
      'email',
      'phone',
      'location',
      'title',
      'professionalBio',
    ],
    highValue: ['workExperience', 'education', 'skills', 'languages'],
    enhanced: [
      'certifications',
      'achievements',
      'linkedInUrl',
      'professionalMemberships',
    ],
  };

  const presentFields = [];
  const missingCriticalFields = [];
  const missingHighValueFields = [];
  const missingEnhancedFields = [];

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

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Lambda function started', {
    httpMethod: event.requestContext?.http?.method || event.httpMethod,
    headers: Object.keys(event.headers || {}),
    bodySize: event.body ? event.body.length : 0,
    eventKeys: Object.keys(event),
  });

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Get HTTP method
  const httpMethod = event.requestContext?.http?.method || event.httpMethod;

  // Handle preflight CORS requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the JSON payload
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Failed to parse request body', {
        parseError,
        body: event.body?.substring(0, 200),
      });
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON payload' }),
      };
    }

    const { fileBuffer, fileName, mimeType } = requestData;

    if (!fileBuffer || !fileName || !mimeType) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing file data, name, or type' }),
      };
    }

    // Convert base64 back to buffer
    const buffer = Buffer.from(fileBuffer, 'base64');

    console.log('Processing CV file', {
      fileName,
      mimeType,
      size: buffer.length,
    });

    // Extract text using OpenAI Vision API
    const textResult = await processDocumentWithOpenAI(
      buffer,
      fileName,
      mimeType
    );

    if (!textResult.text) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'No text could be extracted from the file',
        }),
      };
    }

    console.log('Text extracted successfully, parsing with AI', {
      textLength: textResult.text.length,
    });

    // Parse the extracted text into structured data
    const parsedData = await parseCVWithOpenAI(textResult.text);

    // Enhance parsed data with computed fields and bio
    const enhancedData = await enhanceParsedData(parsedData);

    console.log('Finalizing CV processing...');

    // Analyze completeness
    const completenessAnalysis = analyzeCompleteness(enhancedData);

    console.log('CV processed successfully', {
      overallCompleteness: completenessAnalysis.overallCompleteness,
      workExperienceCount: enhancedData.workExperience?.length || 0,
      educationCount: enhancedData.education?.length || 0,
      skillsCount: enhancedData.skills?.length || 0,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: enhancedData,
        completenessAnalysis,
        filename: fileName,
      }),
    };
  } catch (error) {
    console.error('CV processing error', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: `Failed to process CV: ${error.message}`,
      }),
    };
  }
};
