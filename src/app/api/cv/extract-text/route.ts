import { NextRequest, NextResponse } from 'next/server';

// Text extraction function from Lambda (exact copy)
async function processDocumentWithOpenAI(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
) {
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
    } catch (mammothError: any) {
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
    } catch (pdfError: any) {
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

export async function POST(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    const requestData = await request.json();
    const { fileBuffer, fileName, mimeType } = requestData;

    if (!fileBuffer || !fileName || !mimeType) {
      return NextResponse.json(
        { error: 'Missing file data, name, or type' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Convert base64 back to buffer
    const buffer = Buffer.from(fileBuffer, 'base64');

    console.log('Processing CV file for text extraction', {
      fileName,
      mimeType,
      size: buffer.length,
    });

    // Extract text using the same logic as Lambda
    const textResult = await processDocumentWithOpenAI(
      buffer,
      fileName,
      mimeType
    );

    if (!textResult.text) {
      return NextResponse.json(
        { error: 'No text could be extracted from the file' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Text extraction completed successfully', {
      textLength: textResult.text.length,
    });

    return NextResponse.json(
      {
        success: true,
        text: textResult.text,
        filename: fileName,
        extractedLength: textResult.text.length,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Text extraction error', error);

    return NextResponse.json(
      { error: `Failed to extract text: ${error.message}` },
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
