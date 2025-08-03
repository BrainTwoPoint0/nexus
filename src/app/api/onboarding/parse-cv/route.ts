import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { processCVInMemory } from '@/lib/cv-parser';

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

    // Validate file type - support what we can actually process
    const allowedTypes = [
      'application/pdf', // Processed with OpenAI Vision API
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx - text extracted with mammoth, then processed with OpenAI
      'application/msword', // .doc - text extracted with mammoth, then processed with OpenAI
      'text/plain', // .txt - processed directly
      'image/jpeg', // .jpg, .jpeg - processed with Vision API
      'image/png', // .png - processed with Vision API
      'image/webp', // .webp - processed with Vision API
      'image/gif', // .gif - processed with Vision API
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

    console.log('Processing CV file:', file.name, file.type, file.size);

    // Process CV in-memory without storing
    const result = await processCVInMemory(file);

    if (!result.success) {
      console.error('CV processing failed:', result.error);
      return NextResponse.json(
        {
          error: result.error,
        },
        { status: 400 }
      );
    }

    console.log('CV processed successfully');

    return NextResponse.json({
      success: true,
      data: result.data,
      completenessAnalysis: result.completenessAnalysis,
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
