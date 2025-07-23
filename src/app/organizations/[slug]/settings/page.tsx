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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Building,
  ArrowLeft,
  Save,
  Users,
  UserPlus,
  Settings,
  Trash2,
  Shield,
  Mail,
} from 'lucide-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { containerVariants, itemVariants } from '@/lib/animation-variants';

interface Organization {
  id: string;
  name: string;
  slug: string;
  sector: string;
  industry: string;
  company_size: string;
  founded_year: number;
  headquarters_location: string;
  website_url: string | null;
  company_description: string;
  board_size: number;
  current_openings: number;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'hr' | 'member';
  title: string;
  department: string;
  can_post_jobs: boolean;
  can_manage_applications: boolean;
  can_manage_organization: boolean;
  can_invite_members: boolean;
  status: 'active' | 'inactive' | 'pending';
  joined_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
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

export default function OrganizationSettingsPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userMembership, setUserMembership] =
    useState<OrganizationMember | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'hr' | 'member'>(
    'member'
  );
  const [inviting, setInviting] = useState(false);

  const fetchOrganizationData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', params.slug)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      // Fetch user's membership
      if (user) {
        const { data: membershipData, error: membershipError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', orgData.id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (membershipError) throw membershipError;
        setUserMembership(membershipData);

        // Check if user can manage organization
        if (!membershipData.can_manage_organization) {
          router.push(`/organizations/${params.slug}`);
          return;
        }
      }

      // Fetch all members
      const { data: membersData } = await supabase
        .from('organization_members')
        .select(
          `
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `
        )
        .eq('organization_id', orgData.id)
        .order('joined_at');

      setMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [params.slug, user, supabase, router, toast]);

  useEffect(() => {
    if (params.slug) {
      fetchOrganizationData();
    }
  }, [params.slug, user, fetchOrganizationData]);

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: organization.name,
          sector: organization.sector,
          industry: organization.industry,
          company_size: organization.company_size,
          founded_year: organization.founded_year,
          headquarters_location: organization.headquarters_location,
          website_url: organization.website_url,
          company_description: organization.company_description,
          board_size: organization.board_size,
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Organization updated successfully',
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to update organization',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !inviteEmail) return;

    setInviting(true);
    try {
      // Check if user exists
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail)
        .single();

      if (!userData) {
        toast({
          title: 'Error',
          description: 'User not found. They need to create an account first.',
          variant: 'destructive',
        });
        setInviting(false);
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('user_id', userData.id)
        .single();

      if (existingMember) {
        toast({
          title: 'Error',
          description: 'User is already a member of this organization',
          variant: 'destructive',
        });
        setInviting(false);
        return;
      }

      // Create invitation
      const { error } = await supabase.from('organization_members').insert({
        organization_id: organization.id,
        user_id: userData.id,
        role: inviteRole,
        status: 'pending',
        can_post_jobs: inviteRole === 'admin' || inviteRole === 'hr',
        can_manage_applications: inviteRole === 'admin' || inviteRole === 'hr',
        can_manage_organization: inviteRole === 'admin',
        can_invite_members: inviteRole === 'admin',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      });

      setInviteEmail('');
      setInviteRole('member');
      fetchOrganizationData();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });

      fetchOrganizationData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="page-container py-8">
          <div className="mx-auto max-w-4xl">
            <div className="animate-pulse space-y-8">
              <div className="h-8 w-1/3 rounded bg-muted"></div>
              <div className="h-64 rounded bg-muted"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!organization || !userMembership) {
    return (
      <MainLayout>
        <div className="page-container py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Access Denied
              </h3>
              <p className="mt-2 text-muted-foreground">
                You don&apos;t have permission to access organization settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-container py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/organizations/${params.slug}`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Organization Settings
                </h1>
                <p className="text-muted-foreground">
                  Manage {organization.name} settings and members
                </p>
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div variants={itemVariants}>
            <div className="flex space-x-1 rounded-lg bg-muted p-1">
              {[
                { id: 'general', label: 'General', icon: Settings },
                {
                  id: 'members',
                  label: `Members (${members.length})`,
                  icon: Users,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(tab.id as 'general' | 'members')
                    }
                    className={`flex flex-1 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Content */}
          {activeTab === 'general' && (
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Organization Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveOrganization} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="name">Organization Name</Label>
                        <Input
                          id="name"
                          value={organization.name}
                          onChange={(e) =>
                            setOrganization({
                              ...organization,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sector">Sector</Label>
                        <Select
                          value={organization.sector}
                          onValueChange={(value) =>
                            setOrganization({ ...organization, sector: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
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
                          value={organization.industry || ''}
                          onChange={(e) =>
                            setOrganization({
                              ...organization,
                              industry: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="company_size">Company Size</Label>
                        <Select
                          value={organization.company_size}
                          onValueChange={(value) =>
                            setOrganization({
                              ...organization,
                              company_size: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
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
                        <Label htmlFor="founded_year">Founded Year</Label>
                        <Input
                          id="founded_year"
                          type="number"
                          value={organization.founded_year || ''}
                          onChange={(e) =>
                            setOrganization({
                              ...organization,
                              founded_year: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="headquarters_location">
                          Headquarters
                        </Label>
                        <Input
                          id="headquarters_location"
                          value={organization.headquarters_location}
                          onChange={(e) =>
                            setOrganization({
                              ...organization,
                              headquarters_location: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="website_url">Website</Label>
                        <Input
                          id="website_url"
                          type="url"
                          value={organization.website_url || ''}
                          onChange={(e) =>
                            setOrganization({
                              ...organization,
                              website_url: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="board_size">Board Size</Label>
                        <Input
                          id="board_size"
                          type="number"
                          value={organization.board_size || ''}
                          onChange={(e) =>
                            setOrganization({
                              ...organization,
                              board_size: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="company_description">
                        Company Description
                      </Label>
                      <Textarea
                        id="company_description"
                        value={organization.company_description}
                        onChange={(e) =>
                          setOrganization({
                            ...organization,
                            company_description: e.target.value,
                          })
                        }
                        rows={6}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'members' && (
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Invite Member */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Invite Member
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInviteMember} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="md:col-span-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={inviteRole}
                          onValueChange={(value: 'admin' | 'hr' | 'member') =>
                            setInviteRole(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="hr">HR</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" disabled={inviting}>
                      <Mail className="mr-2 h-4 w-4" />
                      {inviting ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Members List */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {member.profiles.first_name?.[0]}
                              {member.profiles.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">
                              {member.profiles.first_name}{' '}
                              {member.profiles.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.profiles.email}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {member.role}
                              </Badge>
                              <Badge
                                variant={
                                  member.status === 'active'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {member.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.role !== 'owner' &&
                            member.user_id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}
