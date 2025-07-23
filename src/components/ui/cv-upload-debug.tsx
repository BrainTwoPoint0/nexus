'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Upload, File, Loader2 } from 'lucide-react';

export function CVUploadDebug() {
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useSupabase();

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      console.log(
        'File selected:',
        selectedFile.name,
        selectedFile.size,
        selectedFile.type
      );

      setFile(selectedFile);
      setStatus('uploading');
      setMessage('Starting upload...');

      try {
        // Get current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error('Auth error:', authError);
          setStatus('error');
          setMessage(`Auth error: ${authError.message}`);
          return;
        }

        if (!user) {
          console.error('No user found');
          setStatus('error');
          setMessage('Not authenticated - please sign in');
          return;
        }

        console.log('User authenticated:', user.id);
        setMessage(`User authenticated (${user.id}), uploading file...`);

        // Create form data
        const formData = new FormData();
        formData.append('file', selectedFile);

        console.log('Uploading to /api/profile/upload-cv');

        // Upload file
        const response = await fetch('/api/profile/upload-cv', {
          method: 'POST',
          body: formData,
        });

        console.log('Upload response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          setStatus('error');
          setMessage(`Upload failed: ${errorText}`);
          return;
        }

        const result = await response.json();
        console.log('Upload result:', result);

        if (result.success) {
          setStatus('success');
          setMessage(`Upload successful! File path: ${result.filePath}`);

          // Now try parsing
          console.log('Starting CV parsing...');
          setMessage('File uploaded, parsing CV...');

          const parseResponse = await fetch('/api/profile/parse-cv', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath: result.filePath }),
          });

          console.log('Parse response status:', parseResponse.status);

          if (parseResponse.ok) {
            const parseResult = await parseResponse.json();
            console.log('Parse result:', parseResult);
            setMessage(
              `CV parsed successfully! Confidence: ${(parseResult.confidence * 100).toFixed(1)}%`
            );
          } else {
            const parseError = await parseResponse.text();
            console.error('Parse failed:', parseError);
            setMessage(`Upload successful but parsing failed: ${parseError}`);
          }
        } else {
          setStatus('error');
          setMessage(`Upload failed: ${result.error}`);
        }
      } catch (error) {
        console.error('Error:', error);
        setStatus('error');
        setMessage(
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [supabase]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    if (status === 'uploading') return;
    fileInputRef.current?.click();
  }, [status]);

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="p-6">
        <div className="space-y-4 text-center">
          <div
            className="cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50"
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={status === 'uploading'}
            />

            <div className="space-y-4">
              {status === 'uploading' ? (
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              ) : (
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              )}

              <div>
                <p className="font-medium">
                  {status === 'uploading'
                    ? 'Processing...'
                    : 'Upload CV (Debug Mode)'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Click to select file (.txt, .pdf, .doc, .docx)
                </p>
              </div>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <File className="h-4 w-4" />
              <span>{file.name}</span>
            </div>
          )}

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                status === 'error'
                  ? 'bg-red-50 text-red-700'
                  : status === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-blue-50 text-blue-700'
              }`}
            >
              {message}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus('idle');
              setMessage('');
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
