'use client';

import { useState, memo, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for motion to reduce initial bundle size
const motion = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion })),
  {
    ssr: false,
  }
) as any;
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MainLayout } from '@/components/layout/main-layout';
// Optimized lucide-react imports - only import what we need
import Search from 'lucide-react/dist/esm/icons/search';
import Play from 'lucide-react/dist/esm/icons/play';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Users from 'lucide-react/dist/esm/icons/users';
import Star from 'lucide-react/dist/esm/icons/star';
import Award from 'lucide-react/dist/esm/icons/award';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Target from 'lucide-react/dist/esm/icons/target';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Globe from 'lucide-react/dist/esm/icons/globe';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';

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

// Course categories with icons
const categories = [
  {
    id: 'all',
    name: 'All Courses',
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'governance',
    name: 'Governance',
    icon: Shield,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'legal',
    name: 'Legal & Risk',
    icon: Target,
    color: 'bg-red-100 text-red-600',
  },
  {
    id: 'strategy',
    name: 'Strategy',
    icon: Lightbulb,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'leadership',
    name: 'Leadership',
    icon: Users,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    id: 'esg',
    name: 'ESG & Ethics',
    icon: Globe,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 'digital',
    name: 'Digital',
    icon: Zap,
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    id: 'industry',
    name: 'Industry',
    icon: Briefcase,
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    id: 'certification',
    name: 'Certification',
    icon: Award,
    color: 'bg-amber-100 text-amber-600',
  },
];

// Mock course data - This would come from a CMS or database
const courses = [
  {
    id: '1',
    title: 'Board Roles & Responsibilities',
    description:
      'Comprehensive overview of board member duties, fiduciary responsibilities, and governance best practices.',
    category: 'governance',
    level: 'Beginner',
    duration: 120, // minutes
    rating: 4.8,
    reviewCount: 342,
    enrolledCount: 1250,
    instructor: {
      name: 'Sarah Johnson',
      title: 'Former FTSE 100 Chair',
      avatar: '/avatars/sarah-johnson.jpg',
    },
    thumbnail: '/courses/governance-fundamentals.jpg',
    isCertified: true,
    isPremium: false,
    tags: ['governance', 'fundamentals', 'board-duties'],
    price: 0,
    learningObjectives: [
      'Understand fiduciary duties and legal responsibilities',
      'Learn effective board meeting practices',
      'Master governance frameworks and compliance',
    ],
  },
  {
    id: '2',
    title: 'Financial Statements for Directors',
    description:
      'Essential financial literacy for board members. Learn to read and interpret financial statements with confidence.',
    category: 'finance',
    level: 'Intermediate',
    duration: 180,
    rating: 4.9,
    reviewCount: 198,
    enrolledCount: 850,
    instructor: {
      name: 'Michael Chen',
      title: 'Former CFO & Audit Committee Chair',
      avatar: '/avatars/michael-chen.jpg',
    },
    thumbnail: '/courses/financial-literacy.jpg',
    isCertified: true,
    isPremium: true,
    tags: ['finance', 'financial-statements', 'analysis'],
    price: 199,
    learningObjectives: [
      'Read and analyze financial statements',
      'Understand key financial ratios and metrics',
      'Identify financial red flags and opportunities',
    ],
  },
  {
    id: '3',
    title: 'ESG Reporting & Metrics',
    description:
      'Master environmental, social, and governance reporting requirements and best practices for modern boards.',
    category: 'esg',
    level: 'Advanced',
    duration: 240,
    rating: 4.7,
    reviewCount: 156,
    enrolledCount: 420,
    instructor: {
      name: 'Dr. Emma Williams',
      title: 'ESG Strategy Consultant',
      avatar: '/avatars/emma-williams.jpg',
    },
    thumbnail: '/courses/esg-reporting.jpg',
    isCertified: true,
    isPremium: true,
    tags: ['esg', 'sustainability', 'reporting'],
    price: 299,
    learningObjectives: [
      'Implement ESG reporting frameworks',
      'Measure and track sustainability metrics',
      'Integrate ESG into strategic decision-making',
    ],
  },
  {
    id: '4',
    title: 'Digital Transformation for Boards',
    description:
      'How boards can effectively oversee and guide digital transformation initiatives in their organizations.',
    category: 'digital',
    level: 'Intermediate',
    duration: 150,
    rating: 4.6,
    reviewCount: 89,
    enrolledCount: 320,
    instructor: {
      name: 'Alex Thompson',
      title: 'Digital Strategy Director',
      avatar: '/avatars/alex-thompson.jpg',
    },
    thumbnail: '/courses/digital-transformation.jpg',
    isCertified: false,
    isPremium: true,
    tags: ['digital', 'transformation', 'technology'],
    price: 149,
    learningObjectives: [
      'Understand digital transformation fundamentals',
      'Oversee technology initiatives effectively',
      'Assess digital risks and opportunities',
    ],
  },
  {
    id: '5',
    title: 'Crisis Management & Communication',
    description:
      'Prepare for and manage organizational crises with effective communication strategies and decision-making frameworks.',
    category: 'leadership',
    level: 'Advanced',
    duration: 200,
    rating: 4.8,
    reviewCount: 234,
    enrolledCount: 650,
    instructor: {
      name: 'Robert Davis',
      title: 'Crisis Management Expert',
      avatar: '/avatars/robert-davis.jpg',
    },
    thumbnail: '/courses/crisis-management.jpg',
    isCertified: true,
    isPremium: false,
    tags: ['leadership', 'crisis', 'communication'],
    price: 0,
    learningObjectives: [
      'Develop crisis response protocols',
      'Master stakeholder communication',
      'Lead through uncertainty and change',
    ],
  },
  {
    id: '6',
    title: 'Board Evaluation & Assessment',
    description:
      'Comprehensive guide to conducting effective board evaluations and implementing improvement strategies.',
    category: 'governance',
    level: 'Intermediate',
    duration: 135,
    rating: 4.5,
    reviewCount: 127,
    enrolledCount: 380,
    instructor: {
      name: 'Jennifer Liu',
      title: 'Governance Consultant',
      avatar: '/avatars/jennifer-liu.jpg',
    },
    thumbnail: '/courses/board-evaluation.jpg',
    isCertified: true,
    isPremium: true,
    tags: ['governance', 'evaluation', 'improvement'],
    price: 179,
    learningObjectives: [
      'Design effective evaluation processes',
      'Analyze board performance metrics',
      'Implement continuous improvement',
    ],
  },
];

const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const durations = [
  'All Durations',
  'Under 1 hour',
  '1-3 hours',
  '3-6 hours',
  '6+ hours',
];
const sortOptions = ['Popular', 'Newest', 'Rating', 'Duration'];

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  rating: number;
  reviewCount: number;
  enrolledCount: number;
  instructor: {
    name: string;
    title: string;
    avatar: string;
  };
  thumbnail: string;
  isCertified: boolean;
  isPremium: boolean;
  tags: string[];
  price: number;
  learningObjectives: string[];
}

// Memoized course card component for better performance
const CourseCard = memo(({ course }: { course: Course }) => {
  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  }, []);

  return (
    <Card className="group transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <div className="flex aspect-video items-center justify-center rounded-t-lg bg-gradient-to-br from-primary/10 to-secondary/20">
          <Play className="h-12 w-12 text-primary/60" />
        </div>
        {course.isCertified && (
          <Badge className="absolute left-2 top-2 bg-green-500">
            <Award className="mr-1 h-3 w-3" />
            Certified
          </Badge>
        )}
        {course.isPremium && (
          <Badge variant="secondary" className="absolute right-2 top-2">
            Premium
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {course.level}
            </Badge>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(course.duration)}
            </div>
          </div>
          <CardTitle className="text-lg transition-colors group-hover:text-primary">
            {course.title}
          </CardTitle>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{course.rating}</span>
              <span className="text-muted-foreground">
                ({course.reviewCount})
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{course.enrolledCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Instructor</p>
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/30">
              <span className="text-xs font-medium">
                {course.instructor.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{course.instructor.name}</p>
              <p className="text-xs text-muted-foreground">
                {course.instructor.title}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-lg font-bold">
            {course.price === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              <span>${course.price}</span>
            )}
          </div>
          <Button size="sm">
            {course.price === 0 ? 'Enroll Free' : 'Enroll Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

CourseCard.displayName = 'CourseCard';

export default function LearningCenterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [selectedDuration, setSelectedDuration] = useState('All Durations');
  const [sortBy, setSortBy] = useState('Popular');
  const [showOnlyFree, setShowOnlyFree] = useState(false);
  const [showOnlyCertified, setShowOnlyCertified] = useState(false);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      searchTerm === '' ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory;

    const matchesLevel =
      selectedLevel === 'All Levels' || course.level === selectedLevel;

    const matchesDuration =
      selectedDuration === 'All Durations' ||
      (selectedDuration === 'Under 1 hour' && course.duration < 60) ||
      (selectedDuration === '1-3 hours' &&
        course.duration >= 60 &&
        course.duration <= 180) ||
      (selectedDuration === '3-6 hours' &&
        course.duration > 180 &&
        course.duration <= 360) ||
      (selectedDuration === '6+ hours' && course.duration > 360);

    const matchesFree = !showOnlyFree || course.price === 0;
    const matchesCertified = !showOnlyCertified || course.isCertified;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesDuration &&
      matchesFree &&
      matchesCertified
    );
  });

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'Newest':
        return parseInt(b.id) - parseInt(a.id); // Assuming higher ID = newer
      case 'Rating':
        return b.rating - a.rating;
      case 'Duration':
        return a.duration - b.duration;
      case 'Popular':
      default:
        return b.enrolledCount - a.enrolledCount;
    }
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLevel('All Levels');
    setSelectedDuration('All Durations');
    setShowOnlyFree(false);
    setShowOnlyCertified(false);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Hero Section */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 py-24"
          >
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-4xl space-y-6 text-center">
                <h1 className="text-5xl font-bold text-foreground">
                  Advance Your Board Career
                </h1>
                <p className="text-xl text-muted-foreground">
                  Professional development courses designed specifically for
                  board members and aspiring directors
                </p>
                <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>500+ Courses</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>10k+ Graduates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>95% Completion Rate</span>
                  </div>
                </div>
                <Button size="lg" className="mt-8">
                  Start Learning Today
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="container mx-auto space-y-8 px-4">
            {/* Course Categories */}
            <motion.div variants={itemVariants} className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Browse by Category
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  const isSelected = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`rounded-lg p-3 ${category.color}`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <span className="text-center text-sm font-medium">
                          {category.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Search and Filters */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  <Select
                    value={selectedLevel}
                    onValueChange={setSelectedLevel}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedDuration}
                    onValueChange={setSelectedDuration}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((duration) => (
                        <SelectItem key={duration} value={duration}>
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Filters */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="free-only"
                    checked={showOnlyFree}
                    onCheckedChange={(checked) =>
                      setShowOnlyFree(checked === true)
                    }
                  />
                  <label htmlFor="free-only" className="text-sm font-medium">
                    Free courses only
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="certified-only"
                    checked={showOnlyCertified}
                    onCheckedChange={(checked) =>
                      setShowOnlyCertified(checked === true)
                    }
                  />
                  <label
                    htmlFor="certified-only"
                    className="text-sm font-medium"
                  >
                    Certified courses only
                  </label>
                </div>
                {(searchTerm ||
                  selectedCategory !== 'all' ||
                  selectedLevel !== 'All Levels' ||
                  selectedDuration !== 'All Durations' ||
                  showOnlyFree ||
                  showOnlyCertified) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {sortedCourses.length} of {courses.length} courses
                </p>
              </div>
            </motion.div>

            {/* Course Grid */}
            <motion.div variants={itemVariants} className="space-y-6">
              {sortedCourses.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No courses found
                    </h3>
                    <p className="mb-4 text-muted-foreground">
                      Try adjusting your search criteria or filters to find more
                      courses.
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sortedCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Load More */}
            {sortedCourses.length > 0 && (
              <motion.div variants={itemVariants} className="text-center">
                <Button variant="outline" size="lg">
                  Load More Courses
                </Button>
              </motion.div>
            )}

            {/* Featured Sections */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 gap-8 lg:grid-cols-3"
            >
              {/* Popular This Month */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Popular This Month</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {courses.slice(0, 3).map((course, index) => (
                    <div
                      key={course.id}
                      className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
                    >
                      <div className="text-sm font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.instructor.name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {course.level}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Certification Paths */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Certification Paths</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="rounded-lg border p-3">
                      <h4 className="font-medium">
                        Board Governance Certificate
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        5 courses • 12 hours
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="h-2 flex-1 rounded-full bg-secondary">
                          <div className="h-2 w-3/5 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-xs">60%</span>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <h4 className="font-medium">
                        Financial Oversight Certificate
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        4 courses • 10 hours
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-xs"
                      >
                        Start Path
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* New Releases */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>New Releases</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {courses.slice(3, 6).map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-primary/20 to-secondary/30">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.duration}m • {course.level}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
