'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Building,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface Certification {
  id: string;
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string | null;
  is_active: boolean;
  credential_id: string | null;
  verification_url: string | null;
  description: string | null;
}

interface CertificationsManagerProps {
  certifications: Certification[];
  onUpdate: (certifications: Certification[]) => void;
  isEditing: boolean;
}

const COMMON_CERTIFICATIONS = [
  'Institute of Directors (IoD) Certificate',
  'Chartered Director',
  'Company Director Course',
  'Board Effectiveness Certificate',
  'Corporate Governance Certificate',
  'Risk Management Certificate',
  'Audit Committee Excellence',
  'ESG Certificate',
  'Digital Governance Certificate',
  'Cyber Security for Directors',
  'Financial Literacy for Directors',
  'Legal Duties of Directors',
  'Strategy & Leadership Certificate',
  'Crisis Management Certificate',
  'Other',
];

const ISSUING_ORGANIZATIONS = [
  'Institute of Directors (IoD)',
  'ICSA: The Governance Institute',
  'Financial Reporting Council (FRC)',
  'National Association of Corporate Directors (NACD)',
  'Directors & Boards Institute',
  'Harvard Business School',
  'Stanford Graduate School of Business',
  'INSEAD',
  'London Business School',
  'Wharton Executive Education',
  'MIT Sloan',
  'University of Oxford',
  'University of Cambridge',
  'Other',
];

export function CertificationsManager({
  certifications,
  onUpdate,
  isEditing,
}: CertificationsManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCertification, setEditingCertification] =
    useState<Certification | null>(null);
  const [formData, setFormData] = useState<Partial<Certification>>({
    certification_name: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
    is_active: true,
    credential_id: '',
    verification_url: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({
      certification_name: '',
      issuing_organization: '',
      issue_date: '',
      expiry_date: '',
      is_active: true,
      credential_id: '',
      verification_url: '',
      description: '',
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
    if (!formData.certification_name || !formData.issuing_organization) return;

    const newCertification: Certification = {
      id: editingCertification?.id || crypto.randomUUID(),
      certification_name: formData.certification_name,
      issuing_organization: formData.issuing_organization,
      issue_date: formData.issue_date || '',
      expiry_date: formData.expiry_date || null,
      is_active: formData.is_active !== false,
      credential_id: formData.credential_id || null,
      verification_url: formData.verification_url || null,
      description: formData.description || null,
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
    updatedCertifications.sort(
      (a, b) =>
        new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
    );

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

  const toggleActive = (certificationId: string) => {
    const updatedCertifications = certifications.map((cert) =>
      cert.id === certificationId
        ? { ...cert, is_active: !cert.is_active }
        : cert
    );
    onUpdate(updatedCertifications);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
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

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const sixMonthsFromNow = new Date(
      now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000
    );
    return expiry < sixMonthsFromNow && expiry > now;
  };

  const activeCertifications = certifications.filter((cert) => cert.is_active);
  const sortedCertifications = [...activeCertifications].sort(
    (a, b) =>
      new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Certifications & Qualifications
        </h3>
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
                ? 'Add professional certifications to showcase your qualifications'
                : 'No certifications added yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedCertifications.map((cert) => {
            const expired = isExpired(cert.expiry_date);
            const expiringSoon = isExpiringSoon(cert.expiry_date);

            return (
              <Card
                key={cert.id}
                className={
                  expired
                    ? 'border-red-200'
                    : expiringSoon
                      ? 'border-yellow-200'
                      : ''
                }
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-semibold">
                              {cert.certification_name}
                            </h4>
                            {expired && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                            {expiringSoon && !expired && (
                              <Badge
                                variant="outline"
                                className="border-yellow-500 text-yellow-700"
                              >
                                Expires Soon
                              </Badge>
                            )}
                            {cert.is_active && !expired && !expiringSoon && (
                              <Badge variant="default">Active</Badge>
                            )}
                          </div>
                          <div className="mt-1 flex items-center space-x-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {cert.issuing_organization}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Issued: {formatDate(cert.issue_date)}</span>
                            </div>
                            {cert.expiry_date && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Expires: {formatDate(cert.expiry_date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {isEditing && (
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleActive(cert.id)}
                              title={
                                cert.is_active
                                  ? 'Mark as inactive'
                                  : 'Mark as active'
                              }
                            >
                              {cert.is_active ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
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

                      {cert.description && (
                        <div>
                          <h5 className="mb-2 text-sm font-medium">
                            Description
                          </h5>
                          <p className="text-sm text-muted-foreground">
                            {cert.description}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        {cert.credential_id && (
                          <div>
                            <span className="font-medium">ID: </span>
                            <span>{cert.credential_id}</span>
                          </div>
                        )}
                        {cert.verification_url && (
                          <a
                            href={cert.verification_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Verify Certificate
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
                <Label htmlFor="certName">Certification Name *</Label>
                <Select
                  value={formData.certification_name}
                  onValueChange={(value) =>
                    setFormData({ ...formData, certification_name: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or type certification" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_CERTIFICATIONS.map((cert) => (
                      <SelectItem key={cert} value={cert}>
                        {cert}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.certification_name === 'Other' && (
                  <Input
                    placeholder="Enter custom certification name"
                    value={
                      formData.certification_name === 'Other'
                        ? ''
                        : formData.certification_name
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certification_name: e.target.value,
                      })
                    }
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuer">Issuing Organization *</Label>
                <Select
                  value={formData.issuing_organization}
                  onValueChange={(value) =>
                    setFormData({ ...formData, issuing_organization: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUING_ORGANIZATIONS.map((org) => (
                      <SelectItem key={org} value={org}>
                        {org}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.issuing_organization === 'Other' && (
                  <Input
                    placeholder="Enter custom organization name"
                    value={
                      formData.issuing_organization === 'Other'
                        ? ''
                        : formData.issuing_organization
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        issuing_organization: e.target.value,
                      })
                    }
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issue_date}
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
                  placeholder="e.g. CERT-2024-001"
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
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the certification..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Status</Label>
              <div className="flex items-center space-x-2">
                <input
                  id="active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
                <span className="text-sm">
                  This certification is currently active
                </span>
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
