'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Search,
  Filter,
  MapPin,
  Building,
  Calendar,
  TrendingUp,
  Briefcase,
  Clock,
  Bookmark,
  ExternalLink,
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

// Types for opportunities
interface Opportunity {
  id: string;
  title: string;
  organization: {
    name: string;
  };
  sector: string | null;
  location: string | null;
  employment_type: string;
  compensation_min: number | null;
  compensation_max: number | null;
  compensation_currency: string;
  time_commitment: string | null;
  description: string;
  requirements: string | null;
  created_at: string;
  application_deadline: string | null;
  status: string;
}

const sectors = [
  'All Sectors',
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Energy',
  'Retail',
  'Non-Profit',
];
const locations = [
  'All Locations',
  'London',
  'Manchester',
  'Edinburgh',
  'Birmingham',
  'Remote',
  'Europe',
  'Global',
];
const roleTypes = ['All Types', 'board', 'executive', 'advisory', 'consultant'];
export default function OpportunitiesPage() {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedRoleType, setSelectedRoleType] = useState('All Types');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());

  // Fetch opportunities from Supabase
  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const { data: jobsData, error } = await supabase
          .from('jobs')
          .select(
            `
            id,
            title,
            description,
            requirements,
            location,
            sector,
            compensation_min,
            compensation_max,
            compensation_currency,
            time_commitment,
            employment_type,
            created_at,
            application_deadline,
            status,
            organization:organizations(name)
          `
          )
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (jobsData) setOpportunities(jobsData as Opportunity[]);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();
  }, [supabase]);

  // Real-time subscription for new opportunities
  useEffect(() => {
    const jobsSubscription = supabase
      .channel('real-time-jobs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
          filter: 'status=eq.active',
        },
        (payload) => {
          console.log('New opportunity added:', payload);
          // Add new opportunity to the list
          setOpportunities((prev) => [payload.new as Opportunity, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
        },
        (payload) => {
          console.log('Opportunity updated:', payload);
          // Update existing opportunity
          setOpportunities((prev) =>
            prev.map((opp) =>
              opp.id === payload.new.id ? { ...opp, ...payload.new } : opp
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'jobs',
        },
        (payload) => {
          console.log('Opportunity removed:', payload);
          // Remove opportunity from list
          setOpportunities((prev) =>
            prev.filter((opp) => opp.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      jobsSubscription.unsubscribe();
    };
  }, [supabase]);

  const toggleBookmark = (id: string) => {
    // TODO: Implement real bookmarking with Supabase
    setBookmarkedJobs((prev) => {
      const newBookmarked = new Set(prev);
      if (newBookmarked.has(id)) {
        newBookmarked.delete(id);
      } else {
        newBookmarked.add(id);
      }
      return newBookmarked;
    });
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      searchTerm === '' ||
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector =
      selectedSector === 'All Sectors' || opp.sector === selectedSector;
    const matchesLocation =
      selectedLocation === 'All Locations' ||
      (opp.location && opp.location.includes(selectedLocation)) ||
      (selectedLocation === 'Remote' && opp.location === 'Remote');
    const matchesRoleType =
      selectedRoleType === 'All Types' ||
      opp.employment_type === selectedRoleType;
    const matchesBookmark = !showOnlyBookmarked || bookmarkedJobs.has(opp.id);

    return (
      matchesSearch &&
      matchesSector &&
      matchesLocation &&
      matchesRoleType &&
      matchesBookmark
    );
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSector('All Sectors');
    setSelectedLocation('All Locations');
    setSelectedRoleType('All Types');
    setShowOnlyBookmarked(false);
  };

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
            <h1 className="text-3xl font-bold text-foreground">
              Board Opportunities
            </h1>
            <p className="mt-2 text-muted-foreground">
              Discover your next board position from our curated opportunities
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search opportunities, companies, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-10 text-base"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Desktop Filters */}
              <div className="hidden flex-1 items-center space-x-4 lg:flex">
                <Select
                  value={selectedSector}
                  onValueChange={setSelectedSector}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedRoleType}
                  onValueChange={setSelectedRoleType}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mobile Filter Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Opportunities</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Sector</Label>
                      <Select
                        value={selectedSector}
                        onValueChange={setSelectedSector}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sectors.map((sector) => (
                            <SelectItem key={sector} value={sector}>
                              {sector}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Select
                        value={selectedLocation}
                        onValueChange={setSelectedLocation}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Role Type</Label>
                      <Select
                        value={selectedRoleType}
                        onValueChange={setSelectedRoleType}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="bookmarked"
                        checked={showOnlyBookmarked}
                        onCheckedChange={(checked) =>
                          setShowOnlyBookmarked(checked === true)
                        }
                      />
                      <Label htmlFor="bookmarked">Show only bookmarked</Label>
                    </div>

                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Additional Filter Options */}
              <div className="flex items-center space-x-4">
                <div className="hidden items-center space-x-2 lg:flex">
                  <Checkbox
                    id="bookmarked-desktop"
                    checked={showOnlyBookmarked}
                    onCheckedChange={(checked) =>
                      setShowOnlyBookmarked(checked === true)
                    }
                  />
                  <Label htmlFor="bookmarked-desktop" className="text-sm">
                    Bookmarked only
                  </Label>
                </div>

                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  className="hidden lg:flex"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredOpportunities.length} of {opportunities.length}{' '}
                opportunities
              </p>
              <Select defaultValue="match">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Best Match</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="deadline">Deadline Soon</SelectItem>
                  <SelectItem value="compensation">Compensation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Opportunities Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 gap-6"
          >
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="mb-2 h-6 w-3/4 rounded bg-muted"></div>
                      <div className="h-4 w-1/2 rounded bg-muted"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 h-4 w-full rounded bg-muted"></div>
                      <div className="h-4 w-2/3 rounded bg-muted"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">
                    No opportunities found matching your criteria.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredOpportunities.map((opportunity) => (
                <div key={opportunity.id}>
                  <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-semibold text-foreground">
                              {opportunity.title}
                            </h3>
                            <Badge variant="outline">
                              {opportunity.employment_type}
                            </Badge>
                            {/* TODO: Add match score calculation later */}
                          </div>
                          <div className="flex items-center space-x-4 text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Building className="h-4 w-4" />
                              <span>{opportunity.organization.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {opportunity.location || 'Location TBD'}
                              </span>
                            </div>
                            {opportunity.sector && (
                              <Badge variant="secondary">
                                {opportunity.sector}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBookmark(opportunity.id)}
                          className={
                            bookmarkedJobs.has(opportunity.id)
                              ? 'text-primary'
                              : ''
                          }
                          aria-label={
                            bookmarkedJobs.has(opportunity.id)
                              ? `Remove ${opportunity.title} from bookmarks`
                              : `Add ${opportunity.title} to bookmarks`
                          }
                        >
                          <Bookmark
                            className={`h-4 w-4 ${bookmarkedJobs.has(opportunity.id) ? 'fill-current' : ''}`}
                          />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="line-clamp-2 text-muted-foreground">
                        {opportunity.description}
                      </p>

                      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {opportunity.compensation_min &&
                            opportunity.compensation_max
                              ? `${opportunity.compensation_currency || '$'}${(opportunity.compensation_min / 1000).toFixed(0)}K - ${(opportunity.compensation_max / 1000).toFixed(0)}K`
                              : opportunity.compensation_min
                                ? `${opportunity.compensation_currency || '$'}${(opportunity.compensation_min / 1000).toFixed(0)}K+`
                                : 'Competitive'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{opportunity.time_commitment || 'TBD'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-orange-600">
                            {opportunity.application_deadline
                              ? new Date(opportunity.application_deadline) >
                                new Date()
                                ? `${Math.ceil((new Date(opportunity.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                                : 'Expired'
                              : 'Open'}
                          </span>
                        </div>
                      </div>

                      {opportunity.requirements && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Requirements:
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {opportunity.requirements.slice(0, 150)}
                            {opportunity.requirements.length > 150 && '...'}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t pt-4">
                        <span className="text-sm text-muted-foreground">
                          Posted{' '}
                          {Math.floor(
                            (new Date().getTime() -
                              new Date(opportunity.created_at).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          days ago
                        </span>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Learn more about ${opportunity.title} at ${opportunity.organization.name}`}
                          >
                            Learn More
                            <ExternalLink
                              className="ml-2 h-4 w-4"
                              aria-hidden="true"
                            />
                          </Button>
                          <Button
                            size="sm"
                            aria-label={`Apply for ${opportunity.title} at ${opportunity.organization.name}`}
                          >
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </motion.div>

          {/* Load More */}
          {!loading && filteredOpportunities.length > 0 && (
            <motion.div variants={itemVariants} className="text-center">
              <Button variant="outline" size="lg">
                Load More Opportunities
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}
