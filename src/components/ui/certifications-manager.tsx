'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Award,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  verification_url: string | null;
}

interface CertificationsManagerProps {
  certifications: Certification[];
  onUpdate: (certifications: Certification[]) => void;
  isEditing: boolean;
}

export function CertificationsManager({
  certifications,
  onUpdate,
  isEditing,
}: CertificationsManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCertification, setEditingCertification] =
    useState<Certification | null>(null);
  const [formData, setFormData] = useState<Partial<Certification>>({
    name: '',
    issuer: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    verification_url: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      issuer: '',
      issue_date: '',
      expiry_date: '',
      credential_id: '',
      verification_url: '',
    });
  };

  const handleAdd = () => {
    setEditingCertification(null);
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEdit = (cert: Certification) => {
    setEditingCertification(cert);
    setFormData(cert);
    setIsAddModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.issuer) return;

    const newCertification: Certification = {
      id: editingCertification?.id || crypto.randomUUID(),
      name: formData.name,
      issuer: formData.issuer,
      issue_date: formData.issue_date || null,
      expiry_date: formData.expiry_date || null,
      credential_id: formData.credential_id || null,
      verification_url: formData.verification_url || null,
    };

    const updatedCertifications = [...certifications];

    if (editingCertification) {
      const index = updatedCertifications.findIndex(
        (cert) => cert.id === editingCertification.id
      );
      if (index !== -1) {
        updatedCertifications[index] = newCertification;
      }
    } else {
      updatedCertifications.push(newCertification);
    }

    // Sort by issue date (most recent first)
    updatedCertifications.sort((a, b) => {
      const dateA = a.issue_date ? new Date(a.issue_date).getTime() : 0;
      const dateB = b.issue_date ? new Date(b.issue_date).getTime() : 0;
      return dateB - dateA;
    });

    onUpdate(updatedCertifications);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDelete = (certificationId: string) => {
    const updatedCertifications = certifications.filter(
      (cert) => cert.id !== certificationId
    );
    onUpdate(updatedCertifications);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const sortedCertifications = [...certifications].sort((a, b) => {
    const dateA = a.issue_date ? new Date(a.issue_date).getTime() : 0;
    const dateB = b.issue_date ? new Date(b.issue_date).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Certifications</h3>
        {isEditing && (
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Certification
          </Button>
        )}
      </div>

      {sortedCertifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? 'Add your professional certifications'
                : 'No certifications added yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedCertifications.map((cert) => (
            <Card key={cert.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-semibold">{cert.name}</h4>
                          {cert.expiry_date && isExpired(cert.expiry_date) && (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{cert.issuer}</span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                          {cert.issue_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Issued {formatDate(cert.issue_date)}
                                {cert.expiry_date && (
                                  <span>
                                    {' '}
                                    • Expires {formatDate(cert.expiry_date)}
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        {cert.credential_id && (
                          <div className="mt-2">
                            <span className="text-sm text-muted-foreground">
                              Credential ID: {cert.credential_id}
                            </span>
                          </div>
                        )}
                        {cert.verification_url && (
                          <div className="mt-2">
                            <a
                              href={cert.verification_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Verify Credential</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cert)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cert.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCertification
                ? 'Edit Certification'
                : 'Add Certification'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Certification Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. AWS Certified Solutions Architect"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuer">Issuing Organization *</Label>
                <Input
                  id="issuer"
                  value={formData.issuer}
                  onChange={(e) =>
                    setFormData({ ...formData, issuer: e.target.value })
                  }
                  placeholder="e.g. Amazon Web Services"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issue_date || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, issue_date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiry_date || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="credentialId">Credential ID</Label>
                <Input
                  id="credentialId"
                  value={formData.credential_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, credential_id: e.target.value })
                  }
                  placeholder="e.g. ABC123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationUrl">Verification URL</Label>
                <Input
                  id="verificationUrl"
                  type="url"
                  value={formData.verification_url || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      verification_url: e.target.value,
                    })
                  }
                  placeholder="https://verify.example.com/..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingCertification
                  ? 'Update Certification'
                  : 'Add Certification'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
