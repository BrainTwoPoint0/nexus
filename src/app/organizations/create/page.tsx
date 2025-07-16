'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MainLayout } from '@/components/layout/main-layout';
import { Building, ArrowLeft, Check } from 'lucide-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { containerVariants, itemVariants } from '@/lib/animation-variants';

interface OrganizationForm {
  name: string;
  sector: string;
  industry: string;
  company_size: string;
  founded_year: string;
  headquarters_location: string;
  website_url: string;
  company_description: string;
  board_size: string;
}

const SECTORS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Transportation',
  'Energy',
  'Media',
  'Government',
  'Non-Profit',
  'Other',
];

const COMPANY_SIZES = [
  { value: 'startup', label: '1-10 employees' },
  { value: 'small', label: '51-200 employees' },
  { value: 'medium', label: '201-1000 employees' },
  { value: 'large', label: '1001-5000 employees' },
  { value: 'enterprise', label: '5001+ employees' },
];

export default function CreateOrganizationPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<OrganizationForm>({
    name: '',
    sector: '',
    industry: '',
    company_size: '',
    founded_year: '',
    headquarters_location: '',
    website_url: '',
    company_description: '',
    board_size: '',
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleInputChange = (field: keyof OrganizationForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const slug = generateSlug(formData.name);

      // Check if slug is already taken
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingOrg) {
        // Check if current user is already a member
        const { data: existingMember } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', existingOrg.id)
          .eq('user_id', user.id)
          .single();

        if (existingMember) {
          // User is already a member, redirect to the organization
          toast({
            title: 'Already a member',
            description: 'You are already a member of this organization',
          });
          router.push(`/organizations/${slug}`);
          return;
        } else {
          toast({
            title: 'Error',
            description: 'An organization with this name already exists',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Create organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          slug,
          sector: formData.sector,
          industry: formData.industry,
          company_size: formData.company_size,
          founded_year: parseInt(formData.founded_year) || null,
          headquarters_location: formData.headquarters_location,
          website_url: formData.website_url || null,
          company_description: formData.company_description,
          board_size: parseInt(formData.board_size) || null,
          current_openings: 0,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as owner (use upsert to handle duplicates)
      const { error: memberError } = await supabase
        .from('organization_members')
        .upsert(
          {
            organization_id: organization.id,
            user_id: user.id,
            role: 'owner',
            status: 'active',
            can_post_jobs: true,
            can_manage_applications: true,
            can_manage_organization: true,
            can_invite_members: true,
          },
          {
            onConflict: 'organization_id,user_id',
          }
        );

      if (memberError) throw memberError;

      toast({
        title: 'Success',
        description: 'Organization created successfully!',
      });

      router.push(`/organizations/${slug}`);
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep2 =
    formData.name &&
    formData.sector &&
    formData.company_size &&
    formData.headquarters_location;
  const canSubmit = canProceedToStep2 && formData.company_description;

  return (
    <MainLayout>
      <div className="page-container py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-2xl space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Create Organization
                </h1>
                <p className="text-muted-foreground">
                  Set up your organization profile to start posting jobs and
                  managing applications
                </p>
              </div>
            </div>
          </motion.div>

          {/* Progress Steps */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    step >= 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > 1 ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <span className="text-sm font-medium">Basic Information</span>
              </div>
              <div className="h-px flex-1 bg-muted" />
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    step >= 2
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > 2 ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <span className="text-sm font-medium">Company Details</span>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  {step === 1 ? 'Basic Information' : 'Company Details'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Organization Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange('name', e.target.value)
                          }
                          placeholder="Enter organization name"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="sector">Sector *</Label>
                        <Select
                          value={formData.sector}
                          onValueChange={(value) =>
                            handleInputChange('sector', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select sector" />
                          </SelectTrigger>
                          <SelectContent>
                            {SECTORS.map((sector) => (
                              <SelectItem key={sector} value={sector}>
                                {sector}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={formData.industry}
                          onChange={(e) =>
                            handleInputChange('industry', e.target.value)
                          }
                          placeholder="e.g., SaaS, Fintech, Healthcare IT"
                        />
                      </div>

                      <div>
                        <Label htmlFor="company_size">Company Size *</Label>
                        <Select
                          value={formData.company_size}
                          onValueChange={(value) =>
                            handleInputChange('company_size', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPANY_SIZES.map((size) => (
                              <SelectItem key={size.value} value={size.value}>
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="headquarters_location">
                          Headquarters Location *
                        </Label>
                        <Input
                          id="headquarters_location"
                          value={formData.headquarters_location}
                          onChange={(e) =>
                            handleInputChange(
                              'headquarters_location',
                              e.target.value
                            )
                          }
                          placeholder="e.g., San Francisco, CA"
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={() => setStep(2)}
                          disabled={!canProceedToStep2}
                        >
                          Next Step
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="founded_year">Founded Year</Label>
                        <Input
                          id="founded_year"
                          type="number"
                          value={formData.founded_year}
                          onChange={(e) =>
                            handleInputChange('founded_year', e.target.value)
                          }
                          placeholder="e.g., 2020"
                          min="1800"
                          max={new Date().getFullYear()}
                        />
                      </div>

                      <div>
                        <Label htmlFor="website_url">Website URL</Label>
                        <Input
                          id="website_url"
                          type="url"
                          value={formData.website_url}
                          onChange={(e) =>
                            handleInputChange('website_url', e.target.value)
                          }
                          placeholder="https://example.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="board_size">Board Size</Label>
                        <Input
                          id="board_size"
                          type="number"
                          value={formData.board_size}
                          onChange={(e) =>
                            handleInputChange('board_size', e.target.value)
                          }
                          placeholder="e.g., 7"
                          min="1"
                          max="50"
                        />
                      </div>

                      <div>
                        <Label htmlFor="company_description">
                          Company Description *
                        </Label>
                        <Textarea
                          id="company_description"
                          value={formData.company_description}
                          onChange={(e) =>
                            handleInputChange(
                              'company_description',
                              e.target.value
                            )
                          }
                          placeholder="Describe your organization, its mission, and what makes it unique..."
                          rows={6}
                          required
                        />
                        <p className="mt-1 text-sm text-muted-foreground">
                          This will be displayed on your organization page
                        </p>
                      </div>

                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                        >
                          Previous
                        </Button>
                        <Button type="submit" disabled={!canSubmit || loading}>
                          {loading ? 'Creating...' : 'Create Organization'}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
