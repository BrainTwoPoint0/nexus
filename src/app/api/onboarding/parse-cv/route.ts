import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

/**
 * Lambda-based CV processing for onboarding
 * Uses AWS Lambda for reliable processing with 15-minute timeout
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Lambda URL is configured
    const lambdaUrl =
      process.env.LAMBDA_CV_PARSER_URL ||
      'https://vmsleaxjtt25zdbwrt6fegtjfi0mdlzy.lambda-url.eu-west-2.on.aws/';

    if (!lambdaUrl) {
      return NextResponse.json(
        {
          error:
            'CV parsing service is not configured. Please contact support.',
        },
        { status: 503 }
      );
    }

    // Set a timeout for Lambda processing (2 minutes for network)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute network timeout

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - support what we can actually process
    const allowedTypes = [
      'application/pdf', // Processed with OpenAI Vision API
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx - text extracted with mammoth, then processed with OpenAI
      'application/msword', // .doc - text extracted with mammoth, then processed with OpenAI
      'text/plain', // .txt - processed directly
      'image/jpeg', // Images processed with OpenAI Vision API
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Please upload TXT, PDF, DOCX, or image files (JPG, PNG, WEBP, GIF).',
        },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'File too large. Please upload files smaller than 10MB.',
        },
        { status: 400 }
      );
    }

    try {
      // Convert file to base64 for Lambda
      const fileBuffer = await file.arrayBuffer();
      const base64Buffer = Buffer.from(fileBuffer).toString('base64');

      console.log('Sending CV to Lambda for processing', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        lambdaUrl,
      });

      // Send to Lambda function
      const lambdaResponse = await fetch(lambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBuffer: base64Buffer,
          fileName: file.name,
          mimeType: file.type,
        }),
        signal: controller.signal,
      });

      // Clear timeout on response
      clearTimeout(timeoutId);

      if (!lambdaResponse.ok) {
        const errorText = await lambdaResponse.text();
        console.error('Lambda processing failed', {
          status: lambdaResponse.status,
          statusText: lambdaResponse.statusText,
          errorText,
        });

        return NextResponse.json(
          {
            error: `CV processing failed (${lambdaResponse.status}): ${errorText}`,
          },
          { status: 500 }
        );
      }

      const result = await lambdaResponse.json();

      if (!result.success || !result.data) {
        return NextResponse.json(
          {
            error: result.error || 'CV processing failed',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        completenessAnalysis: result.completenessAnalysis || null,
        filename: file.name,
      });
    } catch (processingError) {
      // Clear timeout on error
      clearTimeout(timeoutId);
      console.error('CV processing error:', processingError);

      // Check if it's a timeout error
      if (
        processingError instanceof Error &&
        processingError.name === 'AbortError'
      ) {
        return NextResponse.json(
          {
            error:
              'CV processing timed out. Please try again with a smaller file.',
          },
          { status: 408 }
        );
      }

      return NextResponse.json(
        {
          error: 'CV processing failed - please try again',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('CV parsing route error:', error);

    return NextResponse.json(
      {
        error:
          'Failed to process CV file. Please try again or use a different file format.',
      },
      { status: 500 }
    );
  }
}
