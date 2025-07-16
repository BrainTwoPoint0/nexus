'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorMessage } from '@/components/ui/error-states';
import { Building, ArrowRight } from 'lucide-react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export default function OrganizationSetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationSector: '',
  });
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    // LinkedIn-style: Any authenticated user can create an organization
    if (!user) {
      router.push('/sign-in');
      return;
    }

    // Pre-fill form if organization data exists in user metadata
    if (user.user_metadata?.organization_name) {
      setFormData((prev) => ({
        ...prev,
        organizationName: user.user_metadata.organization_name,
        organizationSector: user.user_metadata.organization_sector || '',
      }));
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    // Validation
    const newErrors: string[] = [];
    if (!formData.organizationName)
      newErrors.push('Organization name is required');
    if (!formData.organizationSector)
      newErrors.push('Organization sector is required');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Create organization record
      const organizationSlug = formData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([
          {
            name: formData.organizationName,
            slug: organizationSlug,
            sector: formData.organizationSector,
          },
        ])
        .select()
        .single();

      if (orgError) {
        setErrors([orgError.message]);
        setIsLoading(false);
        return;
      }

      // Organization membership should be automatically created by the trigger
      // But let's verify it exists
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgData.id)
        .eq('user_id', user?.id)
        .single();

      if (!memberData) {
        // Create membership manually if trigger didn't work
        await supabase.from('organization_members').insert([
          {
            organization_id: orgData.id,
            user_id: user?.id,
            role: 'owner',
            can_post_jobs: true,
            can_manage_applications: true,
            can_manage_organization: true,
            can_invite_members: true,
            status: 'active',
          },
        ]);
      }

      // Redirect to org dashboard
      router.push('/org-dashboard');
    } catch (error) {
      console.error('Error creating organization:', error);
      setErrors(['Failed to create organization. Please try again.']);
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) setErrors([]);
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Complete Organization Setup
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us about your organization to get started
            </p>
          </div>

          {/* Setup Form */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Messages */}
                {errors.length > 0 && (
                  <div className="space-y-2">
                    {errors.map((error, index) => (
                      <ErrorMessage key={index} message={error} />
                    ))}
                  </div>
                )}

                {/* Organization Name */}
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="organizationName"
                      placeholder="Enter your organization name"
                      value={formData.organizationName}
                      onChange={(e) =>
                        handleInputChange('organizationName', e.target.value)
                      }
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Organization Sector */}
                <div className="space-y-2">
                  <Label htmlFor="organizationSector">Industry Sector</Label>
                  <Input
                    id="organizationSector"
                    placeholder="e.g., Technology, Healthcare, Finance"
                    value={formData.organizationSector}
                    onChange={(e) =>
                      handleInputChange('organizationSector', e.target.value)
                    }
                    disabled={isLoading}
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
