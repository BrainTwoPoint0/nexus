'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
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

import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  ProfileCompleteness,
  useProfileCompleteness,
} from '@/components/ui/profile-completeness';
import { BoardExperienceManager } from '@/components/ui/board-experience-manager';
import { WorkHistoryManager } from '@/components/ui/work-history-manager';
import { DocumentManager } from '@/components/ui/document-manager';
import { CompensationManager } from '@/components/ui/compensation-manager';
import { AvailabilityManager } from '@/components/ui/availability-manager';
import { EducationManager } from '@/components/ui/education-manager';
import { CertificationsManager } from '@/components/ui/certifications-manager';
import { useToast } from '@/hooks/use-toast';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Settings,
  Upload,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Award,
  DollarSign,
  Calendar,
  FileText,
} from 'lucide-react';
import {
  AvailabilityStatus,
  RemoteWorkPreference,
  UserRole,
} from '@/lib/enums';

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

type TravelWillingness =
  | 'none'
  | 'domestic_only'
  | 'european'
  | 'international'
  | 'global';
type CompensationCurrency = 'GBP' | 'USD' | 'EUR';
type VisibilityStatus = 'public' | 'private' | 'connections_only';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  professional_headline: string | null;
  bio: string | null;
  location: string | null;
  linkedin_url: string | null;
  website: string | null;
  avatar_url: string | null;
  skills: string[];
  languages: string[];
  sectors: string[];
  role: UserRole;
  permissions: string[];
  availability_status: AvailabilityStatus;
  available_from: string | null;
  availability_start_date: string | null;
  time_commitment_min: number | null;
  time_commitment_max: number | null;
  time_commitment_preference: string | null;
  travel_willingness: TravelWillingness | null;
  remote_work_preference: RemoteWorkPreference | null;
  compensation_expectation_min: number | null;
  compensation_expectation_max: number | null;
  compensation_currency: CompensationCurrency;
  compensation_type: string;
  equity_interest: boolean;
  benefits_important: string[];
  profile_completeness: number;
  is_verified: boolean;
  onboarding_completed: boolean;
  visibility_status: VisibilityStatus;
  last_profile_update: string | null;
  created_at: string;
  updated_at: string;
}

interface BoardExperience {
  id: string;
  organization: string;
  role: string;
  sector: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  organization_size: string | null;
  key_contributions: string | null;
  compensation_disclosed: boolean;
  annual_fee: number | null;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  verification_url: string | null;
}

interface WorkHistory {
  id: string;
  company: string;
  position: string;
  company_size: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  key_achievements: string[] | null;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  graduation_year: number | null;
  gpa: string | null;
  honors: string[];
  description: string | null;
}

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

// Available sectors for selection
const AVAILABLE_SECTORS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Goods',
  'Manufacturing',
  'Energy',
  'Real Estate',
  'Media & Entertainment',
  'Education',
  'Non-Profit',
  'Government',
  'Transportation',
  'Retail',
  'Telecommunications',
  'Automotive',
  'Aerospace',
  'Pharmaceuticals',
  'Agriculture',
  'Construction',
  'Hospitality',
  'Professional Services',
  'Insurance',
];

export default function ProfilePage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [boardExperience, setBoardExperience] = useState<BoardExperience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSector, setNewSector] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  // Calculate profile completeness
  const { completeness, suggestions } = useProfileCompleteness(
    profile as Record<
      string,
      string | number | boolean | string[] | null
    > | null,
    boardExperience,
    workHistory,
    education,
    certifications,
    documents
  );

  // Load profile data on mount
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        // Load all data in parallel for better performance
        const [
          profileResult,
          boardResult,
          certResult,
          workResult,
          educationResult,
          documentsResult,
        ] = await Promise.all([
          // Load main profile
          supabase.from('profiles').select('*').eq('id', user.id).single(),

          // Load board experience
          supabase
            .from('board_experience')
            .select('*')
            .eq('profile_id', user.id)
            .order('start_date', { ascending: false }),

          // Load certifications
          supabase
            .from('certifications')
            .select('*')
            .eq('profile_id', user.id)
            .order('issue_date', { ascending: false }),

          // Load work history
          supabase
            .from('work_experience')
            .select('*')
            .eq('profile_id', user.id)
            .order('start_date', { ascending: false }),

          // Load education
          supabase
            .from('education')
            .select('*')
            .eq('profile_id', user.id)
            .order('graduation_year', { ascending: false }),

          // Load documents
          supabase
            .from('documents')
            .select('*')
            .eq('profile_id', user.id)
            .order('upload_date', { ascending: false }),
        ]);

        // Handle profile data
        const { data: profileData, error: profileError } = profileResult;
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
            professional_headline: null,
            bio: null,
            location: null,
            linkedin_url: null,
            website: null,
            avatar_url: null,
            skills: [],
            languages: ['English'],
            sectors: [],
            role: 'candidate' as UserRole,
            permissions: [],
            availability_status: 'immediately_available',
            available_from: null,
            availability_start_date: null,
            time_commitment_min: null,
            time_commitment_max: null,
            time_commitment_preference: null,
            travel_willingness: null,
            remote_work_preference: null,
            compensation_expectation_min: null,
            compensation_expectation_max: null,
            compensation_currency: 'USD',
            compensation_type: 'annual',
            equity_interest: false,
            benefits_important: [],
            profile_completeness: 0,
            is_verified: false,
            onboarding_completed: false,
            visibility_status: 'public',
            last_profile_update: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(newProfile);
          setIsEditing(true); // Start in edit mode for new profiles
        }

        // Set all the related data
        setBoardExperience(boardResult.data || []);
        setCertifications(certResult.data || []);
        setWorkHistory(workResult.data || []);
        setEducation(educationResult.data || []);
        setDocuments(documentsResult.data || []);

        // Log any errors from the parallel queries (but don't fail completely)
        [
          boardResult,
          certResult,
          workResult,
          educationResult,
          documentsResult,
        ].forEach((result, index) => {
          if (result.error) {
            const tables = [
              'board_experience',
              'certifications',
              'work_history',
              'education',
              'documents',
            ];
            console.warn(
              `Warning: Could not load ${tables[index]}:`,
              result.error
            );
          }
        });
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
        professional_headline: profile.professional_headline,
        bio: profile.bio,
        location: profile.location,
        linkedin_url: profile.linkedin_url,
        website: profile.website,
        skills: profile.skills,
        languages: profile.languages,
        sectors: profile.sectors,
        role: profile.role,
        permissions: profile.permissions,
        availability_status: profile.availability_status,
        compensation_expectation_min: profile.compensation_expectation_min,
        compensation_expectation_max: profile.compensation_expectation_max,
        compensation_currency: profile.compensation_currency,
        travel_willingness: profile.travel_willingness,
        last_profile_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Save board experience if there are changes
      if (boardExperience.length > 0) {
        // Delete existing board experience
        await supabase
          .from('board_experience')
          .delete()
          .eq('profile_id', user.id);

        // Insert updated board experience
        const { error: boardError } = await supabase
          .from('board_experience')
          .insert(
            boardExperience.map((exp) => ({
              ...exp,
              profile_id: user.id,
            }))
          );

        if (boardError) throw boardError;
      }

      // Save work history if there are changes
      if (workHistory.length > 0) {
        // Delete existing work history
        await supabase
          .from('work_experience')
          .delete()
          .eq('profile_id', user.id);

        // Insert updated work history
        const { error: workError } = await supabase
          .from('work_experience')
          .insert(
            workHistory.map((hist) => ({
              ...hist,
              profile_id: user.id,
            }))
          );

        if (workError) throw workError;
      }

      // Save education if there are changes
      if (education.length > 0) {
        // Delete existing education
        await supabase.from('education').delete().eq('profile_id', user.id);

        // Insert updated education
        const { error: educationError } = await supabase
          .from('education')
          .insert(
            education.map((edu) => ({
              ...edu,
              profile_id: user.id,
            }))
          );

        if (educationError) throw educationError;
      }

      // Save certifications if there are changes
      if (certifications.length > 0) {
        // Delete existing certifications
        await supabase
          .from('certifications')
          .delete()
          .eq('profile_id', user.id);

        // Insert updated certifications
        const { error: certificationsError } = await supabase
          .from('certifications')
          .insert(
            certifications.map((cert) => ({
              ...cert,
              profile_id: user.id,
            }))
          );

        if (certificationsError) throw certificationsError;
      }

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
      profile.sectors.includes(newSector.trim())
    )
      return;

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            sectors: [...prev.sectors, newSector.trim()],
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
            sectors: prev.sectors.filter((sector) => sector !== sectorToRemove),
          }
        : null
    );
  };

  const handleBoardExperienceUpdate = async (
    updatedExperience: BoardExperience[]
  ) => {
    setBoardExperience(updatedExperience);

    // If not in editing mode, save to database immediately
    if (!isEditing && user) {
      try {
        // Delete existing board experience
        await supabase
          .from('board_experience')
          .delete()
          .eq('profile_id', user.id);

        // Insert new board experience
        if (updatedExperience.length > 0) {
          const { error } = await supabase.from('board_experience').insert(
            updatedExperience.map((exp) => ({
              ...exp,
              profile_id: user.id,
            }))
          );

          if (error) throw error;
        }

        toast({
          title: 'Success',
          description: 'Board experience updated successfully!',
        });
      } catch (error) {
        console.error('Error updating board experience:', error);
        toast({
          title: 'Error',
          description: 'Failed to update board experience',
          variant: 'destructive',
        });
      }
    }
  };

  const handleWorkHistoryUpdate = async (updatedHistory: WorkHistory[]) => {
    setWorkHistory(updatedHistory);

    // If not in editing mode, save to database immediately
    if (!isEditing && user) {
      try {
        // Delete existing work history
        await supabase
          .from('work_experience')
          .delete()
          .eq('profile_id', user.id);

        // Insert new work history
        if (updatedHistory.length > 0) {
          const { error } = await supabase.from('work_experience').insert(
            updatedHistory.map((hist) => ({
              ...hist,
              profile_id: user.id,
            }))
          );

          if (error) throw error;
        }

        toast({
          title: 'Success',
          description: 'Work history updated successfully!',
        });
      } catch (error) {
        console.error('Error updating work history:', error);
        toast({
          title: 'Error',
          description: 'Failed to update work history',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDocumentsUpdate = (updatedDocuments: Document[]) => {
    setDocuments(updatedDocuments);
  };

  const handleCompensationUpdate = async (compensationData: {
    compensation_expectation_min: number | null;
    compensation_expectation_max: number | null;
    compensation_currency: CompensationCurrency;
    compensation_type: string;
    equity_interest: boolean;
    benefits_important: string[];
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          compensation_expectation_min:
            compensationData.compensation_expectation_min,
          compensation_expectation_max:
            compensationData.compensation_expectation_max,
          compensation_currency: compensationData.compensation_currency,
          compensation_type: compensationData.compensation_type,
          equity_interest: compensationData.equity_interest,
          benefits_important: compensationData.benefits_important,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              compensation_expectation_min:
                compensationData.compensation_expectation_min,
              compensation_expectation_max:
                compensationData.compensation_expectation_max,
              compensation_currency: compensationData.compensation_currency,
              compensation_type: compensationData.compensation_type,
              equity_interest: compensationData.equity_interest,
              benefits_important: compensationData.benefits_important,
            }
          : null
      );

      toast({
        title: 'Success',
        description: 'Compensation preferences updated successfully!',
      });
    } catch (error) {
      console.error('Error updating compensation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update compensation preferences',
        variant: 'destructive',
      });
    }
  };

  const handleAvailabilityUpdate = async (availabilityData: {
    availability_start_date: string | null;
    time_commitment_preference: string | null;
    travel_willingness: TravelWillingness | null;
    remote_work_preference: RemoteWorkPreference | null;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          availability_start_date: availabilityData.availability_start_date,
          time_commitment_preference:
            availabilityData.time_commitment_preference,
          travel_willingness: availabilityData.travel_willingness,
          remote_work_preference: availabilityData.remote_work_preference,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              availability_start_date: availabilityData.availability_start_date,
              time_commitment_preference:
                availabilityData.time_commitment_preference,
              travel_willingness: availabilityData.travel_willingness,
              remote_work_preference: availabilityData.remote_work_preference,
            }
          : null
      );

      toast({
        title: 'Success',
        description: 'Availability preferences updated successfully!',
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update availability preferences',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateBio = async () => {
    if (!user) return;

    setIsGeneratingBio(true);
    try {
      const response = await fetch('/api/profile/generate-bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate bio');
      }

      const result = await response.json();

      if (result.bio) {
        setProfile((prev) => (prev ? { ...prev, bio: result.bio } : null));
        toast({
          title: 'Success',
          description: 'Professional bio generated successfully!',
        });
      }
    } catch (error) {
      console.error('Error generating bio:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate bio',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingBio(false);
    }
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
          <motion.div variants={itemVariants}>
            {/* Desktop Layout - Original Design */}
            <div className="hidden flex-col items-start justify-between space-y-4 md:flex md:flex-row md:items-center md:space-y-0">
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
                    {profile.professional_headline ||
                      'Add your professional headline'}
                  </p>
                  <div className="mt-2 flex flex-col space-y-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
                    {profile.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-stretch space-y-2 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
                <div className="flex items-center space-x-2 text-sm">
                  {profile.is_verified ? (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Unverified
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              '/api/profile/verify-linkedin',
                              {
                                method: 'POST',
                              }
                            );

                            if (response.ok) {
                              setProfile((prev) =>
                                prev ? { ...prev, is_verified: true } : null
                              );
                              toast({
                                title: 'Profile Verified',
                                description:
                                  'Your LinkedIn account has been verified successfully!',
                              });
                            } else {
                              const error = await response.json();
                              toast({
                                variant: 'destructive',
                                title: 'Verification Failed',
                                description:
                                  error.error ||
                                  'Failed to verify LinkedIn account',
                              });
                            }
                          } catch (error) {
                            toast({
                              variant: 'destructive',
                              title: 'Error',
                              description: 'Failed to verify account',
                            });
                          }
                        }}
                        className="h-6 px-2 py-1 text-xs"
                      >
                        Verify LinkedIn
                      </Button>
                    </div>
                  )}
                  <span className="text-muted-foreground">
                    {completeness}% Complete
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
            </div>

            {/* Mobile Layout - Optimized Design */}
            <div className="space-y-4 md:hidden">
              {/* Profile Info */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-xl text-primary-foreground">
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
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-2xl font-bold text-foreground">
                    {`${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
                      'User'}
                  </h1>
                  <p className="line-clamp-2 text-base text-muted-foreground">
                    {profile.professional_headline ||
                      'Add your professional headline'}
                  </p>
                  {profile.location && (
                    <div className="mt-1 flex items-center space-x-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Bar with justify-between */}
              <div className="flex items-center justify-between">
                {profile.is_verified ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Unverified
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            '/api/profile/verify-linkedin',
                            {
                              method: 'POST',
                            }
                          );

                          if (response.ok) {
                            setProfile((prev) =>
                              prev ? { ...prev, is_verified: true } : null
                            );
                            toast({
                              title: 'Profile Verified',
                              description:
                                'Your LinkedIn account has been verified successfully!',
                            });
                          } else {
                            const error = await response.json();
                            toast({
                              variant: 'destructive',
                              title: 'Verification Failed',
                              description:
                                error.error ||
                                'Failed to verify LinkedIn account',
                            });
                          }
                        } catch (error) {
                          toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Failed to verify account',
                          });
                        }
                      }}
                      className="h-6 px-2 py-1 text-xs"
                    >
                      Verify LinkedIn
                    </Button>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  {completeness}% Complete
                </span>
              </div>

              {/* Full width edit button */}
              <div className="w-full">
                {isEditing ? (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1"
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
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Profile Completeness */}
          <motion.div variants={itemVariants}>
            <ProfileCompleteness
              completeness={completeness}
              suggestions={suggestions}
              onSuggestionClick={(suggestion) => {
                // Navigate to the relevant tab
                setActiveTab(suggestion.section);

                // Focus on the specific field after a short delay to allow tab switch
                setTimeout(() => {
                  let elementToFocus: HTMLElement | null = null;

                  switch (suggestion.id) {
                    case 'bio':
                      elementToFocus = document.querySelector('[name="bio"]');
                      break;
                    case 'phone':
                      elementToFocus = document.querySelector('[name="phone"]');
                      break;
                    case 'linkedin':
                      elementToFocus = document.querySelector(
                        '[name="linkedin_url"]'
                      );
                      break;
                    case 'skills':
                      elementToFocus =
                        document.querySelector('[name="newSkill"]');
                      break;
                    case 'work_history':
                      // Focus on the "Add Work Experience" button or first input
                      elementToFocus = document.querySelector(
                        '[data-section="work-history"]'
                      );
                      break;
                    case 'board_experience':
                      // Focus on the "Add Board Experience" button or first input
                      elementToFocus = document.querySelector(
                        '[data-section="board-experience"]'
                      );
                      break;
                    case 'education':
                      // Focus on the "Add Education" button or first input
                      elementToFocus = document.querySelector(
                        '[data-section="education"]'
                      );
                      break;
                    case 'certifications':
                      // Focus on the "Add Certification" button or first input
                      elementToFocus = document.querySelector(
                        '[data-section="certifications"]'
                      );
                      break;
                    case 'resume':
                      // Focus on the documents tab file upload area
                      elementToFocus = document.querySelector(
                        '[data-section="documents"]'
                      );
                      break;
                    default:
                      // Focus on the first input in the current tab
                      elementToFocus = document.querySelector(
                        `[data-tab="${suggestion.section}"] input, [data-tab="${suggestion.section}"] textarea`
                      );
                  }

                  if (elementToFocus) {
                    elementToFocus.focus();
                    // Add visual highlight
                    elementToFocus.classList.add(
                      'ring-2',
                      'ring-primary',
                      'ring-offset-2'
                    );
                    setTimeout(() => {
                      elementToFocus?.classList.remove(
                        'ring-2',
                        'ring-primary',
                        'ring-offset-2'
                      );
                    }, 2000);
                  }
                }, 100);

                // Show toast notification
                toast({
                  title: 'Profile Quick Win',
                  description: `Navigate to ${suggestion.title} to improve your profile by ${suggestion.points} points.`,
                });
              }}
            />
          </motion.div>

          {/* Profile Content */}
          <motion.div variants={itemVariants}>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <div className="overflow-x-auto">
                <TabsList className="inline-flex h-auto w-max min-w-full justify-evenly p-1 md:grid md:w-full md:grid-cols-6">
                  <TabsTrigger
                    value="personal"
                    className="flex flex-shrink-0 items-center gap-2 text-sm"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Personal</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="experience"
                    className="flex flex-shrink-0 items-center gap-2 text-sm"
                  >
                    <Briefcase className="h-4 w-4" />
                    <span className="hidden sm:inline">Experience</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="skills"
                    className="flex flex-shrink-0 items-center gap-2 text-sm"
                  >
                    <Award className="h-4 w-4" />
                    <span className="hidden sm:inline">Skills</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="compensation"
                    className="flex flex-shrink-0 items-center gap-2 text-sm"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Compensation</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="availability"
                    className="flex flex-shrink-0 items-center gap-2 text-sm"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Availability</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="flex flex-shrink-0 items-center gap-2 text-sm"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Documents</span>
                  </TabsTrigger>
                </TabsList>
              </div>

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
                      <Label htmlFor="professional_headline">
                        Professional Headline
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="professional_headline"
                          value={profile.professional_headline || ''}
                          onChange={(e) =>
                            handleInputChange(
                              'professional_headline',
                              e.target.value
                            )
                          }
                          className="pl-10"
                          disabled={!isEditing}
                          placeholder="e.g., Former CEO & Non-Executive Director | Tech & Financial Services"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This headline appears prominently on your profile and in
                        search results
                      </p>
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
                            name="phone"
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

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                        <Input
                          id="linkedin_url"
                          name="linkedin_url"
                          value={profile.linkedin_url || ''}
                          onChange={(e) =>
                            handleInputChange('linkedin_url', e.target.value)
                          }
                          disabled={!isEditing}
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          name="website"
                          value={profile.website || ''}
                          onChange={(e) =>
                            handleInputChange('website', e.target.value)
                          }
                          disabled={!isEditing}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="bio">Professional Bio</Label>
                        {isEditing && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateBio}
                            disabled={isGeneratingBio}
                          >
                            {isGeneratingBio ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Generating...
                              </>
                            ) : (
                              '✨ Generate Bio'
                            )}
                          </Button>
                        )}
                      </div>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profile.bio || ''}
                        onChange={(e) =>
                          handleInputChange('bio', e.target.value)
                        }
                        rows={4}
                        disabled={!isEditing}
                        placeholder="Tell us about your professional background, board interests, and what value you bring to governance roles..."
                      />
                      {isEditing && !profile.bio && (
                        <p className="text-xs text-muted-foreground">
                          💡 Tip: Click &quot;Generate Bio&quot; to create a
                          professional bio from your work experience and skills
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">
                          Profile Visibility
                        </Label>
                        <div className="mt-2">
                          {isEditing ? (
                            <Select
                              value={profile.visibility_status || 'public'}
                              onValueChange={(value) =>
                                handleInputChange('visibility_status', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="connections_only">
                                  Connections Only
                                </SelectItem>
                                <SelectItem value="private">Private</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">
                              {profile.visibility_status
                                ?.replace('_', ' ')
                                .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                                'Public'}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Control who can see your profile and contact you
                        </p>
                      </div>

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

                      {(profile.compensation_expectation_min ||
                        profile.compensation_expectation_max) && (
                        <div>
                          <Label className="text-base font-medium">
                            Compensation Expectations
                          </Label>
                          <div className="mt-2">
                            <Badge variant="outline">
                              {profile.compensation_expectation_min &&
                              profile.compensation_expectation_max
                                ? `${profile.compensation_currency || 'GBP'} ${(profile.compensation_expectation_min / 1000).toFixed(0)}K - ${(profile.compensation_expectation_max / 1000).toFixed(0)}K`
                                : profile.compensation_expectation_min
                                  ? `${profile.compensation_currency || 'GBP'} ${(profile.compensation_expectation_min / 1000).toFixed(0)}K+`
                                  : `Up to ${profile.compensation_currency || 'GBP'} ${((profile.compensation_expectation_max || 0) / 1000).toFixed(0)}K`}
                            </Badge>
                          </div>
                        </div>
                      )}
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
                    {/* Board Experience Section */}
                    <BoardExperienceManager
                      data-section="board-experience"
                      boardExperience={boardExperience}
                      onUpdate={handleBoardExperienceUpdate}
                      isEditing={isEditing}
                    />
                  </CardContent>
                </Card>

                {/* Work History Section */}
                <Card>
                  <CardContent className="pt-6">
                    <WorkHistoryManager
                      data-section="work-history"
                      workHistory={workHistory}
                      onUpdate={handleWorkHistoryUpdate}
                      isEditing={isEditing}
                    />
                  </CardContent>
                </Card>

                {/* Education Section */}
                <Card>
                  <CardContent className="pt-6">
                    <EducationManager
                      data-section="education"
                      education={education}
                      onUpdate={(updatedEducation) => {
                        setEducation(updatedEducation);
                        if (!isEditing && user) {
                          supabase
                            .from('education')
                            .delete()
                            .eq('profile_id', user.id);
                          supabase.from('education').insert(
                            updatedEducation.map((edu) => ({
                              ...edu,
                              profile_id: user.id,
                            }))
                          );
                          toast({
                            title: 'Success',
                            description: 'Education updated successfully!',
                          });
                        }
                      }}
                      isEditing={isEditing}
                    />
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
                              name="newSkill"
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

                {/* Industry Sectors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Industry Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {profile.sectors && profile.sectors.length > 0 ? (
                          profile.sectors.map((sector, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-sm"
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
                              ? 'Add industries to highlight your sector experience'
                              : 'No industry experience added yet'}
                          </p>
                        )}
                      </div>

                      {isEditing && (
                        <div className="space-y-3">
                          <div className="flex space-x-2">
                            <Input
                              name="newSector"
                              placeholder="Add an industry sector..."
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
                              (s) => !profile.sectors?.includes(s)
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
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <CertificationsManager
                      data-section="certifications"
                      certifications={certifications}
                      onUpdate={(updatedCertifications) => {
                        setCertifications(updatedCertifications);
                        if (!isEditing && user) {
                          supabase
                            .from('certifications')
                            .delete()
                            .eq('profile_id', user.id);
                          supabase.from('certifications').insert(
                            updatedCertifications.map((cert) => ({
                              ...cert,
                              profile_id: user.id,
                            }))
                          );
                          toast({
                            title: 'Success',
                            description: 'Certifications updated successfully!',
                          });
                        }
                      }}
                      isEditing={isEditing}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Compensation */}
              <TabsContent value="compensation" className="space-y-6">
                <CompensationManager
                  compensation={{
                    compensation_expectation_min:
                      profile.compensation_expectation_min,
                    compensation_expectation_max:
                      profile.compensation_expectation_max,
                    compensation_currency:
                      profile.compensation_currency as CompensationCurrency,
                    compensation_type: profile.compensation_type,
                    equity_interest: profile.equity_interest,
                    benefits_important: profile.benefits_important || [],
                  }}
                  onUpdate={(data) => {
                    void handleCompensationUpdate({
                      ...data,
                      compensation_currency:
                        data.compensation_currency as CompensationCurrency,
                    });
                  }}
                  isEditing={isEditing}
                />
              </TabsContent>

              {/* Availability */}
              <TabsContent value="availability" className="space-y-6">
                <AvailabilityManager
                  availability={{
                    availability_start_date: profile.availability_start_date,
                    time_commitment_preference:
                      profile.time_commitment_preference,
                    travel_willingness:
                      profile.travel_willingness as TravelWillingness | null,
                    remote_work_preference: profile.remote_work_preference,
                  }}
                  onUpdate={(data) => {
                    void handleAvailabilityUpdate({
                      ...data,
                      travel_willingness:
                        data.travel_willingness as TravelWillingness | null,
                    });
                  }}
                  isEditing={isEditing}
                />
              </TabsContent>

              {/* Documents */}
              <TabsContent value="documents" className="space-y-6">
                <DocumentManager
                  data-section="documents"
                  documents={documents}
                  onUpdate={handleDocumentsUpdate}
                  isEditing={isEditing}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
