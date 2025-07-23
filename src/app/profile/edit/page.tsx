'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Globe, Briefcase, Plus, X, Save } from 'lucide-react';

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
  skills: string[];
  languages: string[];
  sectors: string[];
  has_board_experience: boolean;
  availability_status: 'available' | 'selective' | 'unavailable';
  remote_work_preference: 'remote' | 'hybrid' | 'onsite';
  compensation_expectation_min: number;
  compensation_expectation_max: number;
  equity_interest: boolean;
  profile_completeness: number;
}

export default function EditProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newSector, setNewSector] = useState('');

  const router = useRouter();
  const { toast } = useToast();
  const supabase = useSupabase();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/sign-in');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive',
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
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      router.push('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && profile) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (profile) {
      setProfile({
        ...profile,
        skills: profile.skills.filter((skill) => skill !== skillToRemove),
      });
    }
  };

  const addLanguage = () => {
    if (newLanguage.trim() && profile) {
      setProfile({
        ...profile,
        languages: [...profile.languages, newLanguage.trim()],
      });
      setNewLanguage('');
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    if (profile) {
      setProfile({
        ...profile,
        languages: profile.languages.filter(
          (lang) => lang !== languageToRemove
        ),
      });
    }
  };

  const addSector = () => {
    if (newSector.trim() && profile) {
      setProfile({
        ...profile,
        sectors: [...profile.sectors, newSector.trim()],
      });
      setNewSector('');
    }
  };

  const removeSector = (sectorToRemove: string) => {
    if (profile) {
      setProfile({
        ...profile,
        sectors: profile.sectors.filter((sector) => sector !== sectorToRemove),
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">
              Profile Not Found
            </h1>
            <Button onClick={() => router.push('/profile')}>Go Back</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Edit Profile
            </h1>
            <p className="text-gray-600">
              Update your professional information
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/profile')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, first_name: e.target.value })
                    }
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, last_name: e.target.value })
                    }
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="+44 20 1234 5678"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, location: e.target.value })
                  }
                  placeholder="London, UK"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Current Title</Label>
                <Input
                  id="title"
                  value={profile.title || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, title: e.target.value })
                  }
                  placeholder="Chief Technology Officer"
                />
              </div>

              <div>
                <Label htmlFor="company">Current Company</Label>
                <Input
                  id="company"
                  value={profile.company || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, company: e.target.value })
                  }
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <Label htmlFor="years_experience">Years of Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  min="0"
                  max="50"
                  value={profile.years_experience || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      years_experience: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="10"
                />
              </div>

              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself, your experience, and what you bring to board roles..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills & Expertise */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Skills</Label>
                <div className="mb-3 flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button onClick={addSkill} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Sectors</Label>
                <div className="mb-3 flex gap-2">
                  <Input
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    placeholder="Add a sector..."
                    onKeyPress={(e) => e.key === 'Enter' && addSector()}
                  />
                  <Button onClick={addSector} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.sectors?.map((sector) => (
                    <Badge
                      key={sector}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {sector}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSector(sector)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Languages</Label>
                <div className="mb-3 flex gap-2">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Add a language..."
                    onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                  />
                  <Button onClick={addLanguage} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.languages?.map((language) => (
                    <Badge
                      key={language}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {language}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeLanguage(language)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Professional Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  value={profile.linkedin_url || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, linkedin_url: e.target.value })
                  }
                  placeholder="https://linkedin.com/in/yourname"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profile.website || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, website: e.target.value })
                  }
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Work Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="availability_status">Availability Status</Label>
                <Select
                  value={profile.availability_status}
                  onValueChange={(
                    value: 'available' | 'selective' | 'unavailable'
                  ) => setProfile({ ...profile, availability_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="selective">Selective</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="remote_work_preference">
                  Remote Work Preference
                </Label>
                <Select
                  value={profile.remote_work_preference}
                  onValueChange={(value: 'remote' | 'hybrid' | 'onsite') =>
                    setProfile({ ...profile, remote_work_preference: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="compensation_min">Min Compensation (£)</Label>
                  <Input
                    id="compensation_min"
                    type="number"
                    min="0"
                    value={profile.compensation_expectation_min || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        compensation_expectation_min:
                          parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label htmlFor="compensation_max">Max Compensation (£)</Label>
                  <Input
                    id="compensation_max"
                    type="number"
                    min="0"
                    value={profile.compensation_expectation_max || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        compensation_expectation_max:
                          parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="equity_interest"
                  checked={profile.equity_interest}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, equity_interest: checked })
                  }
                />
                <Label htmlFor="equity_interest">
                  Interested in equity compensation
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="has_board_experience"
                  checked={profile.has_board_experience}
                  onCheckedChange={(checked) =>
                    setProfile({ ...profile, has_board_experience: checked })
                  }
                />
                <Label htmlFor="has_board_experience">
                  I have board experience
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-8">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
