'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, Loader2 } from 'lucide-react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  company: string;
  bio: string;
  location: string;
  phone: string;
  linkedin_url: string;
  website: string;
  years_experience: number;
  has_board_experience: boolean;
  skills: string[];
  sectors: string[];
  languages: string[];
  availability_status: string;
  remote_work_preference: string;
  compensation_expectation_min: number;
  compensation_expectation_max: number;
  equity_interest: boolean;
  profile_completeness: number;
}

export function ProfileForm({ profileId }: { profileId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const supabase = useSupabase();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load profile',
        });
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          title: profile.title,
          company: profile.company,
          bio: profile.bio,
          location: profile.location,
          phone: profile.phone,
          linkedin_url: profile.linkedin_url,
          website: profile.website,
          years_experience: profile.years_experience,
          has_board_experience: profile.has_board_experience,
          skills: profile.skills,
          sectors: profile.sectors,
          languages: profile.languages,
          availability_status: profile.availability_status,
          remote_work_preference: profile.remote_work_preference,
          compensation_expectation_min: profile.compensation_expectation_min,
          compensation_expectation_max: profile.compensation_expectation_max,
          equity_interest: profile.equity_interest,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) {
        console.error('Save error:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save profile',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      // Reload to get updated completeness
      await loadProfile();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof Profile, value: unknown) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const addSkill = () => {
    if (!newSkill.trim() || !profile) return;
    updateProfile('skills', [...profile.skills, newSkill.trim()]);
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    if (!profile) return;
    const newSkills = profile.skills.filter((_, i) => i !== index);
    updateProfile('skills', newSkills);
  };

  const addSector = () => {
    if (!newSector.trim() || !profile) return;
    updateProfile('sectors', [...profile.sectors, newSector.trim()]);
    setNewSector('');
  };

  const removeSector = (index: number) => {
    if (!profile) return;
    const newSectors = profile.sectors.filter((_, i) => i !== index);
    updateProfile('sectors', newSectors);
  };

  const addLanguage = () => {
    if (!newLanguage.trim() || !profile) return;
    updateProfile('languages', [...profile.languages, newLanguage.trim()]);
    setNewLanguage('');
  };

  const removeLanguage = (index: number) => {
    if (!profile) return;
    const newLanguages = profile.languages.filter((_, i) => i !== index);
    updateProfile('languages', newLanguages);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-center">Profile not found</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Profile Completeness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Profile Completeness
            <span className="text-sm font-normal">
              {profile.profile_completeness}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${profile.profile_completeness}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={profile.first_name || ''}
                onChange={(e) => updateProfile('first_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={profile.last_name || ''}
                onChange={(e) => updateProfile('last_name', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={profile.email || ''}
              onChange={(e) => updateProfile('email', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Current Title</Label>
              <Input
                id="title"
                value={profile.title || ''}
                onChange={(e) => updateProfile('title', e.target.value)}
                placeholder="e.g., Chief Technology Officer"
              />
            </div>
            <div>
              <Label htmlFor="company">Current Company</Label>
              <Input
                id="company"
                value={profile.company || ''}
                onChange={(e) => updateProfile('company', e.target.value)}
                placeholder="e.g., Acme Corp"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Professional Summary</Label>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => updateProfile('bio', e.target.value)}
              placeholder="Brief summary of your professional background and expertise..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profile.location || ''}
                onChange={(e) => updateProfile('location', e.target.value)}
                placeholder="e.g., London, UK or Remote"
              />
            </div>
            <div>
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                value={profile.years_experience || ''}
                onChange={(e) =>
                  updateProfile(
                    'years_experience',
                    parseInt(e.target.value) || 0
                  )
                }
                min="0"
                max="50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile.phone || ''}
                onChange={(e) => updateProfile('phone', e.target.value)}
                placeholder="+44 20 1234 5678"
              />
            </div>
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={profile.linkedin_url || ''}
                onChange={(e) => updateProfile('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={profile.website || ''}
              onChange={(e) => updateProfile('website', e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills & Expertise */}
      <Card>
        <CardHeader>
          <CardTitle>Skills & Expertise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Skills</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeSkill(index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              />
              <Button onClick={addSkill} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Industry Sectors</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.sectors.map((sector, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {sector}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeSector(index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                placeholder="Add a sector..."
                onKeyDown={(e) => e.key === 'Enter' && addSector()}
              />
              <Button onClick={addSector} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Languages</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.languages.map((language, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {language}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeLanguage(index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Add a language..."
                onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
              />
              <Button onClick={addLanguage} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience & Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Experience & Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="previous_board_experience"
              checked={profile.has_board_experience}
              onChange={(e) =>
                updateProfile('has_board_experience', e.target.checked)
              }
              className="rounded"
            />
            <Label htmlFor="previous_board_experience">
              I have previous board experience
            </Label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="availability_status">Availability Status</Label>
              <select
                id="availability_status"
                value={profile.availability_status || 'available'}
                onChange={(e) =>
                  updateProfile('availability_status', e.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="available">Available</option>
                <option value="selective">Selective</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <div>
              <Label htmlFor="remote_work_preference">
                Remote Work Preference
              </Label>
              <select
                id="remote_work_preference"
                value={profile.remote_work_preference || 'hybrid'}
                onChange={(e) =>
                  updateProfile('remote_work_preference', e.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="compensation_min">Minimum Compensation (£)</Label>
              <Input
                id="compensation_min"
                type="number"
                value={profile.compensation_expectation_min || ''}
                onChange={(e) =>
                  updateProfile(
                    'compensation_expectation_min',
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="50000"
              />
            </div>
            <div>
              <Label htmlFor="compensation_max">Maximum Compensation (£)</Label>
              <Input
                id="compensation_max"
                type="number"
                value={profile.compensation_expectation_max || ''}
                onChange={(e) =>
                  updateProfile(
                    'compensation_expectation_max',
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="100000"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="equity_interest"
              checked={profile.equity_interest}
              onChange={(e) =>
                updateProfile('equity_interest', e.target.checked)
              }
              className="rounded"
            />
            <Label htmlFor="equity_interest">
              I&apos;m interested in equity compensation
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
