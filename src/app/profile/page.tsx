'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { FileUpload } from '@/components/ui/file-upload';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Building,
  Briefcase,
  Award,
  Settings,
  Upload,
  Plus,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  linkedin_url: string | null;
  skills: string[];
  sector_preferences: string[];
  languages: string[];
  availability_status: string;
  compensation_min: number | null;
  compensation_max: number | null;
  compensation_currency: string;
  travel_willingness: string;
  profile_completeness: number;
  profile_verified: boolean;
  premium_member: boolean;
}

interface BoardExperience {
  id: string;
  organization_name: string;
  position_title: string;
  organization_type: string;
  organization_sector: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  key_responsibilities: string | null;
  notable_achievements: string | null;
}

interface Certification {
  id: string;
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string | null;
  is_active: boolean;
}

// Available sectors for selection
const AVAILABLE_SECTORS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Real Estate',
  'Energy',
  'Manufacturing',
  'Retail',
  'Media',
  'Non-Profit',
  'Government',
  'Consulting',
  'Legal',
  'Transportation',
  'Hospitality',
];

// Available skills for selection
const AVAILABLE_SKILLS = [
  'Digital Transformation',
  'Strategic Planning',
  'Team Leadership',
  'Financial Oversight',
  'Risk Management',
  'ESG',
  'Corporate Governance',
  'Audit',
  'Compliance',
  'Cybersecurity',
  'Data Analytics',
  'Marketing',
  'Operations',
  'HR',
  'Legal',
  'International Business',
  'M&A',
  'Innovation',
  'Change Management',
  'Stakeholder Relations',
];

export default function ProfilePage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [boardExperience, setBoardExperience] = useState<BoardExperience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSector, setNewSector] = useState('');

  // Load profile data on mount
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        // Load main profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData) {
          setProfile({
            ...profileData,
            email: user.email,
          });
        } else {
          // Create initial profile if doesn't exist
          const newProfile: Profile = {
            id: user.id,
            first_name: user.user_metadata?.first_name || null,
            last_name: user.user_metadata?.last_name || null,
            email: user.email || null,
            phone: null,
            title: null,
            bio: null,
            location: null,
            company: null,
            linkedin_url: null,
            skills: [],
            sector_preferences: [],
            languages: ['English'],
            availability_status: 'immediately_available',
            compensation_min: null,
            compensation_max: null,
            compensation_currency: 'GBP',
            travel_willingness: 'domestic_only',
            profile_completeness: 0,
            profile_verified: false,
            premium_member: false,
          };
          setProfile(newProfile);
          setIsEditing(true); // Start in edit mode for new profiles
        }

        // Load board experience
        const { data: boardData } = await supabase
          .from('board_experience')
          .select('*')
          .eq('profile_id', user.id)
          .order('start_date', { ascending: false });

        if (boardData) setBoardExperience(boardData);

        // Load certifications
        const { data: certData } = await supabase
          .from('certifications')
          .select('*')
          .eq('profile_id', user.id)
          .eq('is_active', true)
          .order('issue_date', { ascending: false });

        if (certData) setCertifications(certData);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, supabase, toast]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        company: profile.company,
        linkedin_url: profile.linkedin_url,
        skills: profile.skills,
        sector_preferences: profile.sector_preferences,
        languages: profile.languages,
        availability_status: profile.availability_status,
        compensation_min: profile.compensation_min,
        compensation_max: profile.compensation_max,
        compensation_currency: profile.compensation_currency,
        travel_willingness: profile.travel_willingness,
        last_profile_update: new Date().toISOString(),
      });

      if (error) throw error;

      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });

      // Refresh profile to get updated completeness score
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (updatedProfile) {
        setProfile({ ...updatedProfile, email: user.email });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean | null
  ) => {
    if (!profile) return;
    setProfile((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const addSkill = () => {
    if (
      !profile ||
      !newSkill.trim() ||
      profile.skills.includes(newSkill.trim())
    )
      return;

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            skills: [...prev.skills, newSkill.trim()],
          }
        : null
    );
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    if (!profile) return;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            skills: prev.skills.filter((skill) => skill !== skillToRemove),
          }
        : null
    );
  };

  const addSector = () => {
    if (
      !profile ||
      !newSector.trim() ||
      profile.sector_preferences.includes(newSector.trim())
    )
      return;

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            sector_preferences: [...prev.sector_preferences, newSector.trim()],
          }
        : null
    );
    setNewSector('');
  };

  const removeSector = (sectorToRemove: string) => {
    if (!profile) return;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            sector_preferences: prev.sector_preferences.filter(
              (sector) => sector !== sectorToRemove
            ),
          }
        : null
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="page-container py-8">
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="page-container py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Profile Not Found</h1>
            <p className="text-muted-foreground">
              Unable to load your profile. Please try again.
            </p>
          </div>
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
          className="space-y-8"
        >
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-start justify-between space-y-4 md:flex-row md:items-center md:space-y-0"
          >
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                    {(profile.first_name?.[0] || '') +
                      (profile.last_name?.[0] || '') || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {`${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
                    'User'}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {profile.title || 'Add your professional title'}
                </p>
                <div className="mt-2 flex flex-col space-y-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
                  {profile.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.company && (
                    <div className="flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>{profile.company}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-stretch space-y-2 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
              <div className="flex items-center space-x-2 text-sm">
                {profile.profile_verified ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Unverified
                  </Badge>
                )}
                <span className="text-muted-foreground">
                  {profile.profile_completeness || 0}% Complete
                </span>
              </div>

              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="flex-1 sm:flex-initial"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 sm:flex-initial"
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Profile Content */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="skills">Skills & Certs</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              {/* Personal Information */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="firstName"
                            value={profile.first_name || ''}
                            onChange={(e) =>
                              handleInputChange('first_name', e.target.value)
                            }
                            className="pl-10"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profile.last_name || ''}
                          onChange={(e) =>
                            handleInputChange('last_name', e.target.value)
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Professional Title</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="title"
                          value={profile.title || ''}
                          onChange={(e) =>
                            handleInputChange('title', e.target.value)
                          }
                          className="pl-10"
                          disabled={!isEditing}
                          placeholder="e.g., Former CEO, Board Chair"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={profile.email || ''}
                            className="pl-10"
                            disabled={true}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={profile.phone || ''}
                            onChange={(e) =>
                              handleInputChange('phone', e.target.value)
                            }
                            className="pl-10"
                            disabled={!isEditing}
                            placeholder="+44 20 1234 5678"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={profile.location || ''}
                          onChange={(e) =>
                            handleInputChange('location', e.target.value)
                          }
                          className="pl-10"
                          disabled={!isEditing}
                          placeholder="London, UK"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio || ''}
                        onChange={(e) =>
                          handleInputChange('bio', e.target.value)
                        }
                        rows={4}
                        disabled={!isEditing}
                        placeholder="Tell us about your professional background, board interests, and what value you bring to governance roles..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Experience */}
              <TabsContent value="experience" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company">Current/Recent Company</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="company"
                            value={profile.company || ''}
                            onChange={(e) =>
                              handleInputChange('company', e.target.value)
                            }
                            className="pl-10"
                            disabled={!isEditing}
                            placeholder="Your current or most recent company"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          value={
                            (profile as Profile & { experience?: string })
                              .experience || ''
                          }
                          onChange={(e) =>
                            handleInputChange('experience', e.target.value)
                          }
                          disabled={!isEditing}
                          placeholder="15+ years"
                        />
                      </div>
                    </div>

                    {/* Board Experience Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Board Experience
                        </h3>
                        {isEditing && (
                          <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Position
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-lg border p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">
                                Non-Executive Director
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                TechStartup Ltd • 2020 - Present
                              </p>
                              <p className="mt-2 text-sm">
                                Oversight of technology strategy and digital
                                transformation initiatives.
                              </p>
                            </div>
                            {isEditing && (
                              <Button variant="ghost" size="sm">
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills & Certifications */}
              <TabsContent value="skills" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Expertise</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {profile.skills && profile.skills.length > 0 ? (
                          profile.skills.map((skill, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-sm"
                            >
                              {skill}
                              {isEditing && (
                                <button
                                  onClick={() => removeSkill(skill)}
                                  className="ml-2 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {isEditing
                              ? 'Add skills to showcase your expertise'
                              : 'No skills added yet'}
                          </p>
                        )}
                      </div>

                      {isEditing && (
                        <div className="space-y-3">
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Add a skill..."
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === 'Enter' && addSkill()
                              }
                            />
                            <Button onClick={addSkill} variant="outline">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Suggested:{' '}
                            {AVAILABLE_SKILLS.filter(
                              (s) => !profile.skills?.includes(s)
                            )
                              .slice(0, 5)
                              .map((skill) => (
                                <button
                                  key={skill}
                                  onClick={() => {
                                    setNewSkill(skill);
                                    addSkill();
                                  }}
                                  className="mr-2 underline hover:text-foreground"
                                >
                                  {skill}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Certifications & Qualifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {certifications && certifications.length > 0 ? (
                      certifications.map((cert) => (
                        <div
                          key={cert.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <Award className="h-5 w-5 text-primary" />
                            <div>
                              <span className="font-medium">
                                {cert.certification_name}
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {cert.issuing_organization}
                              </p>
                              {cert.issue_date && (
                                <p className="text-xs text-muted-foreground">
                                  Issued:{' '}
                                  {new Date(cert.issue_date).getFullYear()}
                                  {cert.expiry_date &&
                                    ` • Expires: ${new Date(cert.expiry_date).getFullYear()}`}
                                </p>
                              )}
                            </div>
                          </div>
                          {isEditing && (
                            <Button variant="ghost" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center">
                        <Award className="mx-auto mb-2 h-12 w-12 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          {isEditing
                            ? 'Add certifications to showcase your qualifications'
                            : 'No certifications added yet'}
                        </p>
                      </div>
                    )}
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Certification
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents */}
              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Resume & Documents</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">
                          Resume/CV
                        </Label>
                        <p className="mb-3 text-sm text-muted-foreground">
                          Upload your current resume or CV. This will be shared
                          with potential organizations.
                        </p>
                        <FileUpload
                          accept=".pdf,.doc,.docx"
                          maxSize={5}
                          multiple={false}
                          bucket="documents"
                          folder="resumes"
                          onUpload={(files) => {
                            console.log('Resume uploaded:', files);
                            // TODO: Save file URL to user profile
                          }}
                        />
                      </div>

                      <div>
                        <Label className="text-base font-medium">
                          Supporting Documents
                        </Label>
                        <p className="mb-3 text-sm text-muted-foreground">
                          Upload additional documents such as certifications,
                          cover letters, or references.
                        </p>
                        <FileUpload
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          maxSize={10}
                          multiple={true}
                          bucket="documents"
                          folder="supporting"
                          onUpload={(files) => {
                            console.log(
                              'Supporting documents uploaded:',
                              files
                            );
                            // TODO: Save file URLs to user profile
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Document Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="font-medium">Current Resume</p>
                              <p className="text-sm text-muted-foreground">
                                resume-john-doe-2024.pdf
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Preview
                            </Button>
                            <Button variant="ghost" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="py-8 text-center text-muted-foreground">
                        <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
                        <p>No supporting documents uploaded yet.</p>
                        <p className="text-sm">
                          Upload certificates, references, or cover letters
                          above.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Opportunity Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">
                          Preferred Sectors
                        </Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.sector_preferences &&
                          profile.sector_preferences.length > 0 ? (
                            profile.sector_preferences.map((sector, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="relative"
                              >
                                {sector}
                                {isEditing && (
                                  <button
                                    onClick={() => removeSector(sector)}
                                    className="ml-2 text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {isEditing
                                ? 'Add preferred sectors'
                                : 'No sector preferences set'}
                            </p>
                          )}
                        </div>
                        {isEditing && (
                          <div className="mt-3 space-y-2">
                            <div className="flex space-x-2">
                              <Input
                                placeholder="Add a sector..."
                                value={newSector}
                                onChange={(e) => setNewSector(e.target.value)}
                                onKeyPress={(e) =>
                                  e.key === 'Enter' && addSector()
                                }
                              />
                              <Button onClick={addSector} variant="outline">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Suggested:{' '}
                              {AVAILABLE_SECTORS.filter(
                                (s) => !profile.sector_preferences?.includes(s)
                              )
                                .slice(0, 5)
                                .map((sector) => (
                                  <button
                                    key={sector}
                                    onClick={() => {
                                      setNewSector(sector);
                                      addSector();
                                    }}
                                    className="mr-2 underline hover:text-foreground"
                                  >
                                    {sector}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-base font-medium">
                          Availability Status
                        </Label>
                        <div className="mt-2">
                          {isEditing ? (
                            <Select
                              value={
                                profile.availability_status ||
                                'immediately_available'
                              }
                              onValueChange={(value) =>
                                handleInputChange('availability_status', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="immediately_available">
                                  Immediately Available
                                </SelectItem>
                                <SelectItem value="available_3_months">
                                  Available in 3 Months
                                </SelectItem>
                                <SelectItem value="available_6_months">
                                  Available in 6 Months
                                </SelectItem>
                                <SelectItem value="not_available">
                                  Not Available
                                </SelectItem>
                                <SelectItem value="by_arrangement">
                                  By Arrangement
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">
                              {profile.availability_status
                                ?.replace('_', ' ')
                                .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                                'Not Set'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-medium">
                          Travel Willingness
                        </Label>
                        <div className="mt-2">
                          {isEditing ? (
                            <Select
                              value={
                                profile.travel_willingness || 'domestic_only'
                              }
                              onValueChange={(value) =>
                                handleInputChange('travel_willingness', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="domestic_only">
                                  Domestic Only
                                </SelectItem>
                                <SelectItem value="european">
                                  European
                                </SelectItem>
                                <SelectItem value="international">
                                  International
                                </SelectItem>
                                <SelectItem value="global">Global</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">
                              {profile.travel_willingness
                                ?.replace('_', ' ')
                                .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                                'Not Set'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">
                          Languages
                        </Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.languages && profile.languages.length > 0 ? (
                            profile.languages.map((language, index) => (
                              <Badge key={index} variant="outline">
                                {language}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No languages specified
                            </p>
                          )}
                        </div>
                      </div>

                      {(profile.compensation_min ||
                        profile.compensation_max) && (
                        <div>
                          <Label className="text-base font-medium">
                            Compensation Expectations
                          </Label>
                          <div className="mt-2">
                            <Badge variant="outline">
                              {profile.compensation_min &&
                              profile.compensation_max
                                ? `${profile.compensation_currency || 'GBP'} ${(profile.compensation_min / 1000).toFixed(0)}K - ${(profile.compensation_max / 1000).toFixed(0)}K`
                                : profile.compensation_min
                                  ? `${profile.compensation_currency || 'GBP'} ${(profile.compensation_min / 1000).toFixed(0)}K+`
                                  : `Up to ${profile.compensation_currency || 'GBP'} ${((profile.compensation_max || 0) / 1000).toFixed(0)}K`}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
