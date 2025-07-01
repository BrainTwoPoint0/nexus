'use client';

import { useState } from 'react';
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

// Mock data
const mockOpportunities = [
  {
    id: 1,
    title: 'Non-Executive Director',
    company: 'GreenTech Solutions Ltd',
    sector: 'Technology',
    location: 'London, UK',
    type: 'Non-Executive Director',
    compensation: '£35,000 - £45,000',
    timeCommitment: '8-10 days per year',
    postedDate: '2 days ago',
    deadline: '15 days left',
    matchScore: 95,
    description:
      'Leading sustainable technology company seeking experienced NED with digital transformation expertise...',
    requirements: [
      '15+ years leadership experience',
      'Technology sector background',
      'Board experience preferred',
    ],
    isBookmarked: false,
  },
  {
    id: 2,
    title: 'Audit Committee Chair',
    company: 'Healthcare Innovations plc',
    sector: 'Healthcare',
    location: 'Remote',
    type: 'Committee Chair',
    compensation: '£50,000 - £60,000',
    timeCommitment: '12-15 days per year',
    postedDate: '5 days ago',
    deadline: '22 days left',
    matchScore: 88,
    description:
      'Fast-growing healthcare company seeking experienced Audit Committee Chair...',
    requirements: [
      'Qualified accountant (ACA/ACCA/CIMA)',
      'Public company experience',
      'Healthcare sector knowledge',
    ],
    isBookmarked: true,
  },
  {
    id: 3,
    title: 'Independent Director',
    company: 'Financial Services Group',
    sector: 'Finance',
    location: 'Edinburgh, UK',
    type: 'Independent Director',
    compensation: '£40,000 - £50,000',
    timeCommitment: '10-12 days per year',
    postedDate: '1 week ago',
    deadline: '8 days left',
    matchScore: 82,
    description:
      'Established financial services firm looking for independent director with risk management expertise...',
    requirements: [
      'Financial services background',
      'Risk management experience',
      'Regulatory knowledge',
    ],
    isBookmarked: false,
  },
  {
    id: 4,
    title: 'Board Chair',
    company: 'Social Impact Ventures',
    sector: 'Non-Profit',
    location: 'Manchester, UK',
    type: 'Chair',
    compensation: 'Voluntary',
    timeCommitment: '15-20 days per year',
    postedDate: '3 days ago',
    deadline: '30 days left',
    matchScore: 76,
    description:
      'Social enterprise focused on community development seeking passionate Board Chair...',
    requirements: [
      'Non-profit sector experience',
      'Community engagement background',
      'Strategic leadership skills',
    ],
    isBookmarked: false,
  },
];

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
const roleTypes = [
  'All Types',
  'Non-Executive Director',
  'Chair',
  'Committee Chair',
  'Independent Director',
];
export default function OpportunitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedRoleType, setSelectedRoleType] = useState('All Types');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [opportunities, setOpportunities] = useState(mockOpportunities);

  const toggleBookmark = (id: number) => {
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === id ? { ...opp, isBookmarked: !opp.isBookmarked } : opp
      )
    );
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      searchTerm === '' ||
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector =
      selectedSector === 'All Sectors' || opp.sector === selectedSector;
    const matchesLocation =
      selectedLocation === 'All Locations' ||
      opp.location.includes(selectedLocation) ||
      (selectedLocation === 'Remote' && opp.location === 'Remote');
    const matchesRoleType =
      selectedRoleType === 'All Types' || opp.type === selectedRoleType;
    const matchesBookmark = !showOnlyBookmarked || opp.isBookmarked;

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
            {filteredOpportunities.map((opportunity) => (
              <div key={opportunity.id}>
                <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xl font-semibold text-foreground">
                            {opportunity.title}
                          </h3>
                          <Badge variant="outline">{opportunity.type}</Badge>
                          <div className="flex items-center space-x-1 text-primary">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {opportunity.matchScore}% match
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Building className="h-4 w-4" />
                            <span>{opportunity.company}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{opportunity.location}</span>
                          </div>
                          <Badge variant="secondary">
                            {opportunity.sector}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBookmark(opportunity.id)}
                        className={
                          opportunity.isBookmarked ? 'text-primary' : ''
                        }
                      >
                        <Bookmark
                          className={`h-4 w-4 ${opportunity.isBookmarked ? 'fill-current' : ''}`}
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
                        <span>{opportunity.compensation}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{opportunity.timeCommitment}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-orange-600">
                          {opportunity.deadline}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Key Requirements:
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.requirements
                          .slice(0, 3)
                          .map((req, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {req}
                            </Badge>
                          ))}
                        {opportunity.requirements.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{opportunity.requirements.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-sm text-muted-foreground">
                        Posted {opportunity.postedDate}
                      </span>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Learn More
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                        <Button size="sm">Apply Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </motion.div>

          {/* Load More */}
          {filteredOpportunities.length > 0 && (
            <motion.div variants={itemVariants} className="text-center">
              <Button variant="outline" size="lg">
                Load More Opportunities
              </Button>
            </motion.div>
          )}

          {/* No Results */}
          {filteredOpportunities.length === 0 && (
            <motion.div variants={itemVariants} className="py-12 text-center">
              <div className="space-y-4">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">
                  No opportunities found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or filters to find more
                  opportunities.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}
