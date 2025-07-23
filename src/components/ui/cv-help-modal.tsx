'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, FileText, Copy } from 'lucide-react';

interface CVHelpModalProps {
  children?: React.ReactNode;
}

export function CVHelpModal({ children }: CVHelpModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Need help?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CV Upload Help
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Supported Formats */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">
              Supported File Formats
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="font-semibold text-green-600">✅ PDF</div>
                  <div className="text-sm text-muted-foreground">
                    Best for formatted CVs
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="font-semibold text-green-600">✅ DOCX</div>
                  <div className="text-sm text-muted-foreground">
                    Word documents
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="font-semibold text-green-600">✅ TXT</div>
                  <div className="text-sm text-muted-foreground">
                    Plain text (most reliable)
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Troubleshooting */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Having Problems?</h3>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="mb-2 font-medium">
                    📄 PDF Issues (Scanned/Image-based)
                  </h4>
                  <p className="mb-3 text-sm text-muted-foreground">
                    If your PDF is scanned or image-based, try these options:
                  </p>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                    <li>Convert to Word (.docx) and re-save as PDF</li>
                    <li>
                      Copy and paste your CV text into a new Word document
                    </li>
                    <li>Use the text format option below</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="mb-2 font-medium">📝 Word Document Issues</h4>
                  <p className="mb-3 text-sm text-muted-foreground">
                    If your DOCX isn&apos;t processing correctly:
                  </p>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                    <li>Save as a newer .docx format (not .doc)</li>
                    <li>Remove any complex formatting or tables</li>
                    <li>Try saving as PDF instead</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-medium">
                    <Copy className="h-4 w-4" />
                    Alternative: Use Text Format
                  </h4>
                  <p className="mb-3 text-sm text-muted-foreground">
                    For the most reliable processing, copy your CV text into a
                    .txt file:
                  </p>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                    <li>Open your CV and select all text (Ctrl+A / Cmd+A)</li>
                    <li>Copy the text (Ctrl+C / Cmd+C)</li>
                    <li>Open a text editor (Notepad, TextEdit, etc.)</li>
                    <li>Paste and save as &quot;my-cv.txt&quot;</li>
                    <li>Upload the text file here</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">File Requirements</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Maximum file size: 10MB</li>
              <li>• Files must contain readable text (not just images)</li>
              <li>
                • Include all sections: contact info, experience, education,
                skills
              </li>
              <li>• Use standard CV formatting and section headers</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
