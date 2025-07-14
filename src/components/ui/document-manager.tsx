'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, FileText, Download, Calendar } from 'lucide-react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  profile_id: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  document_category: string;
  document_subcategory: string | null;
  title: string;
  description: string | null;
  version_number: number;
  is_primary: boolean;
  is_current_version: boolean;
  replaced_document_id: string | null;
  password_protected: boolean;
  access_level: string;
  download_count: number;
  last_accessed: string | null;
  virus_scan_status: string | null;
  virus_scan_date: string | null;
  content_extracted: string | null;
  tags: string[];
  upload_ip: string | null;
  upload_user_agent: string | null;
  retention_until: string | null;
  upload_date: string;
  created_at: string;
  updated_at: string;
}

interface DocumentManagerProps {
  documents: Document[];
  onUpdate: (documents: Document[]) => void;
  isEditing: boolean;
}

const DOCUMENT_CATEGORIES = [
  'resume',
  'cover_letter',
  'certificate',
  'reference',
  'portfolio',
  'report',
  'other',
];

const DOCUMENT_CATEGORY_LABELS = {
  resume: 'Resume/CV',
  cover_letter: 'Cover Letter',
  certificate: 'Certificate',
  reference: 'Reference Letter',
  portfolio: 'Portfolio',
  report: 'Report',
  other: 'Other',
};

export function DocumentManager({
  documents,
  onUpdate,
  isEditing,
}: DocumentManagerProps) {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { toast } = useToast();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    document_category: '',
    document_subcategory: '',
    description: '',
    access_level: 'private',
    tags: [] as string[],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetForm = () => {
    setFormData({
      title: '',
      document_category: '',
      document_subcategory: '',
      description: '',
      access_level: 'private',
      tags: [],
    });
    setSelectedFile(null);
  };

  const handleUpload = () => {
    setEditingDocument(null);
    resetForm();
    setIsUploadModalOpen(true);
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      title: doc.title,
      document_category: doc.document_category,
      document_subcategory: doc.document_subcategory || '',
      description: doc.description || '',
      access_level: doc.access_level,
      tags: doc.tags || [],
    });
    setIsUploadModalOpen(true);
  };

  const handleFileUploadClick = async () => {
    if (!user || !selectedFile) {
      console.log('No user or file selected');
      return;
    }

    console.log('Current user object:', user);
    console.log('User ID:', user.id);
    console.log('User email:', user.email);

    // Validate form data
    if (!formData.title || !formData.document_category) {
      toast({
        title: 'Error',
        description: 'Please fill in document title and category',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log('Uploading file to Supabase:', fileName);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      supabase.storage.from('documents').getPublicUrl(fileName);

      const newDocument: Document = {
        id: crypto.randomUUID(),
        profile_id: user.id,
        original_filename: selectedFile.name,
        stored_filename: fileName,
        file_path: uploadData?.path || fileName,
        file_size: selectedFile.size,
        file_type: selectedFile.type || 'application/octet-stream',
        mime_type: selectedFile.type || 'application/octet-stream',
        document_category: formData.document_category,
        document_subcategory: formData.document_subcategory || null,
        title: formData.title,
        description: formData.description || null,
        version_number: 1,
        is_primary: true,
        is_current_version: true,
        replaced_document_id: null,
        password_protected: false,
        access_level: formData.access_level,
        download_count: 0,
        last_accessed: null,
        virus_scan_status: null,
        virus_scan_date: null,
        content_extracted: null,
        tags: formData.tags || [],
        upload_ip: null,
        upload_user_agent: navigator.userAgent,
        retention_until: null,
        upload_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Saving document to database:', newDocument);
      console.log('User ID:', user.id);

      // Save to database
      const { data: insertData, error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            id: newDocument.id,
            profile_id: user.id,
            original_filename: newDocument.original_filename,
            stored_filename: newDocument.stored_filename,
            file_path: newDocument.file_path,
            file_size: newDocument.file_size,
            file_type: newDocument.file_type,
            mime_type: newDocument.mime_type,
            document_category: newDocument.document_category,
            document_subcategory: newDocument.document_subcategory,
            title: newDocument.title,
            description: newDocument.description,
            version_number: newDocument.version_number,
            is_primary: newDocument.is_primary,
            is_current_version: newDocument.is_current_version,
            password_protected: newDocument.password_protected,
            access_level: newDocument.access_level,
            download_count: newDocument.download_count,
            tags: newDocument.tags,
            upload_user_agent: newDocument.upload_user_agent,
            upload_date: newDocument.upload_date,
          },
        ])
        .select();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Database insert successful:', insertData);

      // Update local state
      const updatedDocuments = [...documents, newDocument];
      onUpdate(updatedDocuments);

      toast({
        title: 'Success',
        description: 'Document uploaded successfully!',
      });

      setIsUploadModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', error ? Object.keys(error) : 'none');

      // Enhanced error messaging
      let errorMessage = 'Failed to upload document';
      let errorDetails = '';

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || '';
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase error format
        if ('message' in error) {
          errorMessage = (error as unknown as { message: string }).message;
        } else if ('error' in error) {
          errorMessage = (error as unknown as { error: string }).error;
        } else if ('details' in error) {
          errorMessage = (error as unknown as { details: string }).details;
        } else if ('hint' in error) {
          errorMessage = (error as unknown as { hint: string }).hint;
        } else {
          // If it's an object but no known error field, stringify it
          errorMessage = JSON.stringify(error);
        }

        // Log additional error info
        if ('code' in error) {
          console.error(
            'Error code:',
            (error as unknown as { code: string }).code
          );
          errorDetails += `Code: ${(error as unknown as { code: string }).code}`;
        }
        if ('details' in error) {
          console.error(
            'Error details:',
            (error as unknown as { details: string }).details
          );
          errorDetails += ` Details: ${(error as unknown as { details: string }).details}`;
        }
        if ('hint' in error) {
          console.error(
            'Error hint:',
            (error as unknown as { hint: string }).hint
          );
          errorDetails += ` Hint: ${(error as unknown as { hint: string }).hint}`;
        }
      }

      console.error('Final error message:', errorMessage);
      console.error('Error details:', errorDetails);

      toast({
        title: 'Error',
        description: errorMessage + (errorDetails ? ` (${errorDetails})` : ''),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingDocument || !user) return;

    try {
      const updatedDocument = {
        ...editingDocument,
        title: formData.title,
        document_category: formData.document_category,
        document_subcategory: formData.document_subcategory,
        description: formData.description || null,
        access_level: formData.access_level,
        tags: formData.tags,
      };

      // Update in database
      const { error } = await supabase
        .from('documents')
        .update(updatedDocument)
        .eq('id', editingDocument.id)
        .eq('profile_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedDocuments = documents.map((doc) =>
        doc.id === editingDocument.id ? updatedDocument : doc
      );
      onUpdate(updatedDocuments);

      toast({
        title: 'Success',
        description: 'Document updated successfully!',
      });

      setIsUploadModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to update document',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!user) return;

    try {
      const documentToDelete = documents.find((doc) => doc.id === documentId);
      if (!documentToDelete) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([documentToDelete.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('profile_id', user.id);

      if (dbError) throw dbError;

      // Update local state
      const updatedDocuments = documents.filter((doc) => doc.id !== documentId);
      onUpdate(updatedDocuments);

      toast({
        title: 'Success',
        description: 'Document deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.original_filename;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const sortedDocuments = [...documents].sort(
    (a, b) =>
      new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents</h3>
        {isEditing && (
          <Button variant="outline" size="sm" onClick={handleUpload}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Document Categories */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Resume Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Resume & CV</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedDocuments.filter((doc) => doc.document_category === 'resume')
              .length > 0 ? (
              <div className="space-y-3">
                {sortedDocuments
                  .filter((doc) => doc.document_category === 'resume')
                  .map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                      isEditing={isEditing}
                    />
                  ))}
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <p className="text-sm">
                  {isEditing
                    ? 'Upload your resume or CV'
                    : 'No resume uploaded'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Other Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Supporting Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedDocuments.filter((doc) => doc.document_category !== 'resume')
              .length > 0 ? (
              <div className="space-y-3">
                {sortedDocuments
                  .filter((doc) => doc.document_category !== 'resume')
                  .map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                      isEditing={isEditing}
                    />
                  ))}
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <p className="text-sm">
                  {isEditing
                    ? 'Upload certificates, references, or other documents'
                    : 'No supporting documents'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload/Edit Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? 'Edit Document' : 'Upload Document'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="docName">Document Title *</Label>
                <Input
                  id="docName"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. John Doe - Resume 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="docType">Document Category *</Label>
                <Select
                  value={formData.document_category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, document_category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {
                          DOCUMENT_CATEGORY_LABELS[
                            category as keyof typeof DOCUMENT_CATEGORY_LABELS
                          ]
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the document..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access">Access Level</Label>
              <Select
                value={formData.access_level}
                onValueChange={(value) =>
                  setFormData({ ...formData, access_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!editingDocument && (
              <div className="space-y-2">
                <Label>Select File</Label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSelectedFile(file || null);
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {selectedFile && (
                    <div className="text-sm text-green-600">
                      Selected: {selectedFile.name} (
                      {Math.round(selectedFile.size / 1024)}KB)
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Supports: PDF, DOC, DOCX, JPG, PNG • Max size: 10MB
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </Button>
              {editingDocument ? (
                <Button onClick={handleSaveEdit}>Update Document</Button>
              ) : (
                <Button
                  onClick={handleFileUploadClick}
                  disabled={
                    uploading ||
                    !selectedFile ||
                    !formData.title ||
                    !formData.document_category
                  }
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Document Card Component
function DocumentCard({
  document,
  onEdit,
  onDelete,
  onDownload,
  isEditing,
}: {
  document: Document;
  onEdit: (doc: Document) => void;
  onDelete: (id: string) => void;
  onDownload: (doc: Document) => void;
  isEditing: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center space-x-3">
        <FileText className="h-5 w-5 text-blue-500" />
        <div>
          <p className="text-sm font-medium">{document.title}</p>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>
              {
                DOCUMENT_CATEGORY_LABELS[
                  document.document_category as keyof typeof DOCUMENT_CATEGORY_LABELS
                ]
              }
            </span>
            <span>•</span>
            <span>{formatFileSize(document.file_size)}</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(document.upload_date)}</span>
            </div>
          </div>
          {document.access_level === 'public' && (
            <Badge variant="outline" className="mt-1 text-xs">
              Public
            </Badge>
          )}
        </div>
      </div>
      <div className="flex space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onDownload(document)}>
          <Download className="h-4 w-4" />
        </Button>
        {isEditing && (
          <>
            <Button variant="ghost" size="sm" onClick={() => onEdit(document)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(document.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
