import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getCVSignedUrl, updateCVParsingStatus } from '@/lib/cv-storage';
import {
  extractTextFromFile,
  parseCVWithOpenAI,
  mapCVDataToProfile,
} from '@/lib/cv-parser';

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

    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Get CV upload record
    const { data: cvUpload, error: cvError } = await supabase
      .from('documents')
      .select('*')
      .eq('profile_id', user.id)
      .eq('file_path', filePath)
      .eq('document_category', 'cv')
      .single();

    if (cvError || !cvUpload) {
      return NextResponse.json(
        { error: 'CV upload not found' },
        { status: 404 }
      );
    }

    // Update status to processing
    await updateCVParsingStatus(supabase, user.id, filePath, 'processing');

    // Get signed URL for file
    const { url, error: urlError } = await getCVSignedUrl(supabase, filePath);
    if (urlError || !url) {
      await updateCVParsingStatus(
        supabase,
        user.id,
        filePath,
        'failed',
        undefined,
        undefined,
        'Failed to get file URL'
      );
      return NextResponse.json(
        { error: 'Failed to access uploaded file' },
        { status: 500 }
      );
    }

    // Download and process file
    const fileResponse = await fetch(url);
    if (!fileResponse.ok) {
      await updateCVParsingStatus(
        supabase,
        user.id,
        filePath,
        'failed',
        undefined,
        undefined,
        'Failed to download file'
      );
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      );
    }

    // Create a File object from the response
    const arrayBuffer = await fileResponse.arrayBuffer();
    const file = new File([arrayBuffer], cvUpload.original_filename, {
      type: cvUpload.mime_type,
    });

    // Extract text from file
    const { text, error: extractError } = await extractTextFromFile(file);
    if (extractError || !text) {
      await updateCVParsingStatus(
        supabase,
        user.id,
        filePath,
        'failed',
        undefined,
        undefined,
        extractError
      );
      return NextResponse.json(
        { error: extractError || 'Failed to extract text from file' },
        { status: 400 }
      );
    }

    // Parse with OpenAI
    const parseResult = await parseCVWithOpenAI(text);
    if (!parseResult.success) {
      await updateCVParsingStatus(
        supabase,
        user.id,
        filePath,
        'failed',
        undefined,
        undefined,
        parseResult.error
      );
      return NextResponse.json({ error: parseResult.error }, { status: 500 });
    }

    // Map to profile format
    const profileData = mapCVDataToProfile(parseResult.data!);

    // Update CV parsing status
    await updateCVParsingStatus(
      supabase,
      user.id,
      filePath,
      'completed',
      parseResult.data as Record<string, unknown>,
      parseResult.confidence
    );

    return NextResponse.json({
      success: true,
      data: parseResult.data,
      confidence: parseResult.confidence,
      profileData,
    });
  } catch (error) {
    console.error('CV parsing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
