import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { processCVInMemory } from '@/lib/cv-parser-robust';

/**
 * In-memory CV processing for onboarding
 * Processes uploaded files without storing them
 */
export async function POST(request: NextRequest) {
  try {
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

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Please upload PDF, DOCX, or TXT files only.',
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

    console.log('Processing CV file:', file.name, file.type, file.size);

    // Process CV in-memory without storing
    const result = await processCVInMemory(file);

    if (!result.success) {
      console.error('CV processing failed:', result.error);
      return NextResponse.json(
        {
          error: `Parsing failed: ${JSON.stringify({ error: result.error })}`,
        },
        { status: 400 }
      );
    }

    console.log('CV processed successfully, confidence:', result.confidence);

    return NextResponse.json({
      success: true,
      data: result.data,
      confidence: result.confidence,
      filename: file.name,
    });
  } catch (error) {
    console.error('CV parsing API error:', error);
    return NextResponse.json(
      {
        error:
          'Failed to process CV file. Please try again or use a different file format.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
