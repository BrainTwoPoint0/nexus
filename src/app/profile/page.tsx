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
import { useToast } from '@/hooks/use-toast';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Building,
  Briefcase,
  Settings,
  Upload,
  Plus,
  X,
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
  compensation_type: string;
  equity_interest: boolean;
  benefits_important: string[];
  availability_start_date: string | null;
  time_commitment_preference: string | null;
  travel_willingness: string | null;
  remote_work_preference: string | null;
  profile_completeness: number;
  profile_verified: boolean;
  premium_member: boolean;
  [key: string]: string | number | string[] | boolean | null;
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
  credential_id: string | null;
  verification_url: string | null;
  description: string | null;
}

interface WorkHistory {
  id: string;
  company_name: string;
  position_title: string;
  department: string | null;
  employment_type: string;
  company_size: string | null;
  sector: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  key_responsibilities: string | null;
  major_achievements: string | null;
  reporting_to: string | null;
  team_size: number | null;
  reason_for_leaving: string | null;
}

interface Education {
  id: string;
  institution_name: string;
  institution_country: string | null;
  degree_type: string;
  degree_name: string | null;
  field_of_study: string | null;
  specialization: string | null;
  grade_classification: string | null;
  gpa: number | null;
  start_year: number | null;
  graduation_year: number | null;
  is_ongoing: boolean;
  thesis_title: string | null;
  honors_awards: string[] | null;
  relevant_coursework: string[] | null;
  extracurricular_activities: string[] | null;
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
  const [boardExperience, setBoardExperience] = useState<BoardExperience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSector, setNewSector] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  // Calculate profile completeness
  const { completeness, suggestions } = useProfileCompleteness(
    profile,
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
            .eq('is_active', true)
            .order('issue_date', { ascending: false }),

          // Load work history
          supabase
            .from('work_history')
            .select('*')
            .eq('profile_id', user.id)
            .order('start_date', { ascending: false }),

          // Load education
          supabase
            .from('education')
            .select(
              'id, institution_name, institution_country, degree_type, degree_name, field_of_study, specialization, grade_classification, gpa, start_year, graduation_year, is_ongoing, thesis_title, honors_awards, relevant_coursework, extracurricular_activities'
            )
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
            compensation_currency: 'USD',
            compensation_type: 'annual',
            equity_interest: false,
            benefits_important: [],
            availability_start_date: null,
            time_commitment_preference: null,
            travel_willingness: null,
            remote_work_preference: null,
            profile_completeness: 0,
            profile_verified: false,
            premium_member: false,
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
        await supabase.from('work_history').delete().eq('profile_id', user.id);

        // Insert updated work history
        const { error: workError } = await supabase.from('work_history').insert(
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
        await supabase.from('work_history').delete().eq('profile_id', user.id);

        // Insert new work history
        if (updatedHistory.length > 0) {
          const { error } = await supabase.from('work_history').insert(
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
    compensation_min: number | null;
    compensation_max: number | null;
    compensation_currency: string;
    compensation_type: string;
    equity_interest: boolean;
    benefits_important: string[];
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          compensation_min: compensationData.compensation_min,
          compensation_max: compensationData.compensation_max,
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
              compensation_min: compensationData.compensation_min,
              compensation_max: compensationData.compensation_max,
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
    travel_willingness: string | null;
    remote_work_preference: string | null;
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
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="compensation">Compensation</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
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
                      <Label htmlFor="bio">Professional Bio</Label>
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
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-2 font-semibold">Education</h3>
                      <p className="text-sm text-muted-foreground">
                        Education management is being updated for the new
                        database schema.
                        {education.length > 0 &&
                          ` You have ${education.length} education record(s).`}
                      </p>
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

                <Card>
                  <CardContent className="pt-6">
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-2 font-semibold">Certifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Certifications management is being updated for the new
                        database schema.
                        {certifications.length > 0 &&
                          ` You have ${certifications.length} certification(s).`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Compensation */}
              <TabsContent value="compensation" className="space-y-6">
                <CompensationManager
                  compensation={{
                    compensation_min: profile.compensation_min,
                    compensation_max: profile.compensation_max,
                    compensation_currency: profile.compensation_currency,
                    compensation_type: profile.compensation_type,
                    equity_interest: profile.equity_interest,
                    benefits_important: profile.benefits_important || [],
                  }}
                  onUpdate={handleCompensationUpdate}
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
                    travel_willingness: profile.travel_willingness,
                    remote_work_preference: profile.remote_work_preference,
                  }}
                  onUpdate={handleAvailabilityUpdate}
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
