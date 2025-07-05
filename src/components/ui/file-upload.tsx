'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onUpload?: (files: FileUploadResult[]) => void;
  className?: string;
  bucket?: string;
  folder?: string;
}

interface FileUploadResult {
  file: File;
  url?: string;
  error?: string;
  progress?: number;
  status: 'uploading' | 'completed' | 'error';
}

export function FileUpload({
  accept = '.pdf,.doc,.docx',
  maxSize = 10,
  multiple = false,
  onUpload,
  className,
  bucket = 'documents',
  folder = 'resumes',
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileUploadResult[] = [];

    Array.from(selectedFiles).forEach((file) => {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        newFiles.push({
          file,
          error: `File size exceeds ${maxSize}MB limit`,
          status: 'error',
        });
        return;
      }

      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (accept && !accept.includes(fileExtension)) {
        newFiles.push({
          file,
          error: 'File type not supported',
          status: 'error',
        });
        return;
      }

      newFiles.push({
        file,
        status: 'uploading',
        progress: 0,
      });
    });

    if (!multiple) {
      setFiles(newFiles.slice(0, 1));
    } else {
      setFiles((prev) => [...prev, ...newFiles]);
    }

    // Simulate upload process (replace with actual Supabase upload)
    newFiles.forEach((fileResult, index) => {
      if (fileResult.status === 'uploading') {
        simulateUpload(fileResult, index);
      }
    });

    onUpload?.(newFiles);
  };

  // TODO: Replace with actual Supabase Storage upload
  const simulateUpload = async (
    fileResult: FileUploadResult,
    index: number
  ) => {
    const updateProgress = (progress: number) => {
      setFiles((prev) =>
        prev.map((f, i) =>
          f.file === fileResult.file
            ? {
                ...f,
                progress,
                status: progress === 100 ? 'completed' : 'uploading',
              }
            : f
        )
      );
    };

    // Announce upload start to screen readers
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = `Starting upload of ${fileResult.file.name}`;
    }

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      updateProgress(progress);
    }

    // Simulate getting the file URL
    const mockUrl = `https://example.com/uploads/${fileResult.file.name}`;
    setFiles((prev) =>
      prev.map((f) =>
        f.file === fileResult.file
          ? { ...f, url: mockUrl, status: 'completed' }
          : f
      )
    );

    // Announce upload completion
    if (liveRegion) {
      liveRegion.textContent = `Upload completed: ${fileResult.file.name}`;
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon className="h-8 w-8 text-green-500" />;
      case 'mp4':
      case 'mov':
      case 'avi':
        return <Video className="h-8 w-8 text-purple-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50',
          files.length > 0 && !multiple ? 'border-green-200 bg-green-50' : ''
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileSelect(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`Upload ${multiple ? 'files' : 'file'} (${accept}, max ${maxSize}MB)`}
        />

        <div className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium">
              Drop your files here or{' '}
              <Button
                variant="link"
                className="h-auto p-0 text-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </Button>
            </p>
            <p className="text-sm text-muted-foreground">
              Supports: {accept} • Max size: {maxSize}MB
              {multiple && ' • Multiple files allowed'}
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            {multiple ? `${files.length} file(s)` : 'Selected file'}
          </h4>

          <div className="space-y-2">
            {files.map((fileResult) => (
              <div
                key={fileResult.file.name + fileResult.file.size}
                className="flex items-center space-x-3 rounded-lg border bg-card p-3"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(fileResult.file.name)}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">
                      {fileResult.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {fileResult.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {fileResult.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileResult.file)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(fileResult.file.size)}</span>
                    {fileResult.status === 'completed' && (
                      <Badge variant="outline" className="text-green-600">
                        Uploaded
                      </Badge>
                    )}
                    {fileResult.status === 'error' && (
                      <Badge variant="destructive">{fileResult.error}</Badge>
                    )}
                  </div>

                  {fileResult.status === 'uploading' &&
                    fileResult.progress !== undefined && (
                      <Progress value={fileResult.progress} className="h-1" />
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
