'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/components/providers/supabase-provider';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Briefcase,
  Edit3,
  Award,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

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
  avatar_url: string;
  years_experience: number;
  skills: string[];
  languages: string[];
  sectors: string[];
  has_board_experience: boolean;
  current_board_roles: number;
  availability_status: 'available' | 'selective' | 'unavailable';
  remote_work_preference: 'remote' | 'hybrid' | 'onsite';
  compensation_expectation_min: number;
  compensation_expectation_max: number;
  equity_interest: boolean;
  profile_completeness: number;
  is_verified: boolean;
  created_at: string;
}

interface WorkExperience {
  id: string;
  company: string;
  title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  graduation_year: number;
}

interface BoardExperience {
  id: string;
  organization: string;
  role: string;
  sector: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
}

export default function ProfileViewPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [boardExperience, setBoardExperience] = useState<BoardExperience[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Load profile with related data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive',
        });
        return;
      }

      setProfile(profileData);

      // Load work experience
      const { data: workData } = await supabase
        .from('work_experience')
        .select('*')
        .eq('profile_id', user.id)
        .order('start_date', { ascending: false });

      setWorkExperience(workData || []);

      // Load education
      const { data: eduData } = await supabase
        .from('education')
        .select('*')
        .eq('profile_id', user.id)
        .order('graduation_year', { ascending: false });

      setEducation(eduData || []);

      // Load board experience
      const { data: boardData } = await supabase
        .from('board_experience')
        .select('*')
        .eq('profile_id', user.id)
        .order('start_date', { ascending: false });

      setBoardExperience(boardData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              My Profile
            </h1>
            <p className="text-gray-600">
              Manage your professional information
            </p>
          </div>
          <Button onClick={() => router.push('/profile/edit')}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-6 text-center">
                  <Avatar className="mx-auto mb-4 h-24 w-24">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-2xl">
                      {profile.first_name?.[0]}
                      {profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile.first_name} {profile.last_name}
                    {profile.is_verified && (
                      <CheckCircle className="ml-2 inline h-5 w-5 text-blue-500" />
                    )}
                  </h2>
                  <p className="mb-2 text-gray-600">{profile.title}</p>
                  <p className="text-sm text-gray-500">{profile.company}</p>
                </div>

                {/* Profile Completeness */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Profile Completeness
                    </span>
                    <span className="text-sm text-gray-500">
                      {profile.profile_completeness}%
                    </span>
                  </div>
                  <Progress
                    value={profile.profile_completeness}
                    className="h-2"
                  />
                </div>

                {/* Quick Stats */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="mr-3 h-4 w-4" />
                    {profile.years_experience} years experience
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="mr-3 h-4 w-4" />
                    {profile.location}
                  </div>
                  {profile.has_board_experience && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Award className="mr-3 h-4 w-4" />
                      Board experience ({profile.current_board_roles} current
                      roles)
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <TrendingUp className="mr-3 h-4 w-4" />
                    {profile.availability_status === 'available'
                      ? 'Available'
                      : profile.availability_status === 'selective'
                        ? 'Selective'
                        : 'Unavailable'}
                  </div>
                </div>

                {/* Contact Info */}
                {(profile.email ||
                  profile.phone ||
                  profile.linkedin_url ||
                  profile.website) && (
                  <div className="mt-6 space-y-3 border-t pt-6">
                    {profile.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="mr-3 h-4 w-4" />
                        <a
                          href={`mailto:${profile.email}`}
                          className="hover:text-blue-600"
                        >
                          {profile.email}
                        </a>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="mr-3 h-4 w-4" />
                        {profile.phone}
                      </div>
                    )}
                    {profile.linkedin_url && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="mr-3 h-4 w-4" />
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600"
                        >
                          LinkedIn
                        </a>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="mr-3 h-4 w-4" />
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="space-y-6 lg:col-span-2">
            {/* About */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-gray-700">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills & Expertise */}
            {(profile.skills?.length > 0 ||
              profile.sectors?.length > 0 ||
              profile.languages?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.skills?.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-medium">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.sectors?.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-medium">Sectors</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.sectors.map((sector) => (
                          <Badge key={sector} variant="outline">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.languages?.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-medium">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.languages.map((language) => (
                          <Badge key={language} variant="outline">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Work Experience */}
            {workExperience.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Work Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workExperience.map((work) => (
                      <div
                        key={work.id}
                        className="border-l-2 border-gray-200 pl-4"
                      >
                        <h4 className="font-semibold">{work.title}</h4>
                        <p className="text-gray-600">{work.company}</p>
                        <p className="mb-2 text-sm text-gray-500">
                          {work.start_date} -{' '}
                          {work.is_current ? 'Present' : work.end_date}
                        </p>
                        {work.description && (
                          <p className="text-sm text-gray-700">
                            {work.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Board Experience */}
            {boardExperience.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Board Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {boardExperience.map((board) => (
                      <div
                        key={board.id}
                        className="border-l-2 border-blue-200 pl-4"
                      >
                        <h4 className="font-semibold">{board.role}</h4>
                        <p className="text-gray-600">{board.organization}</p>
                        <p className="text-sm text-gray-500">
                          {board.sector && `${board.sector} • `}
                          {board.start_date} -{' '}
                          {board.is_current ? 'Present' : board.end_date}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {education.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Education</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {education.map((edu) => (
                      <div
                        key={edu.id}
                        className="border-l-2 border-green-200 pl-4"
                      >
                        <h4 className="font-semibold">{edu.degree}</h4>
                        <p className="text-gray-600">{edu.institution}</p>
                        <p className="text-sm text-gray-500">
                          {edu.field_of_study && `${edu.field_of_study} • `}
                          {edu.graduation_year}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Work Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <span className="font-medium">Availability:</span>{' '}
                    <span className="capitalize">
                      {profile.availability_status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Remote Work:</span>{' '}
                    <span className="capitalize">
                      {profile.remote_work_preference}
                    </span>
                  </div>
                  {profile.compensation_expectation_min &&
                    profile.compensation_expectation_max && (
                      <div>
                        <span className="font-medium">Compensation:</span> £
                        {profile.compensation_expectation_min.toLocaleString()}{' '}
                        - £
                        {profile.compensation_expectation_max.toLocaleString()}
                      </div>
                    )}
                  <div>
                    <span className="font-medium">Equity Interest:</span>{' '}
                    {profile.equity_interest ? 'Yes' : 'No'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
