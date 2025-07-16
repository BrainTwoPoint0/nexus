'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Building,
  Users,
  MapPin,
  ExternalLink,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { containerVariants, itemVariants } from '@/lib/animation-variants';
import Image from 'next/image';

interface Organization {
  id: string;
  name: string;
  slug: string;
  sector: string;
  company_size: string;
  headquarters_location: string;
  current_openings: number;
  logo_url: string | null;
  company_description: string;
  founded_year: number;
}

export default function OrganizationsPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select(
          `
          id,
          name,
          slug,
          sector,
          company_size,
          headquarters_location,
          current_openings,
          logo_url,
          company_description,
          founded_year
        `
        )
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Filter and sort organizations
  const filteredOrganizations = organizations
    .filter((org) => {
      const matchesSearch =
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.company_description
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesSector =
        sectorFilter === 'all' || org.sector === sectorFilter;
      return matchesSearch && matchesSector;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'openings':
          return b.current_openings - a.current_openings;
        case 'sector':
          return a.sector.localeCompare(b.sector);
        default:
          return 0;
      }
    });

  // Get unique sectors for filter
  const sectors = [...new Set(organizations.map((org) => org.sector))];

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
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Organizations
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Discover companies and organizations looking for board talent.
              Browse by sector, size, and current openings.
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative max-w-sm flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={sectorFilter}
                      onValueChange={setSectorFilter}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="All sectors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sectors</SelectItem>
                        {sectors.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="openings">Openings</SelectItem>
                        <SelectItem value="sector">Sector</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {user && (
                    <Button
                      onClick={() => router.push('/organizations/create')}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Organization
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Organizations Grid */}
          <motion.div variants={itemVariants}>
            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-muted"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-muted"></div>
                          <div className="h-3 w-1/2 rounded bg-muted"></div>
                          <div className="h-3 w-2/3 rounded bg-muted"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredOrganizations.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    No organizations found
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {searchQuery || sectorFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Be the first to create an organization'}
                  </p>
                  {user && (
                    <Button
                      onClick={() => router.push('/organizations/create')}
                      className="mt-4"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Organization
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrganizations.map((org) => (
                  <Card
                    key={org.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => router.push(`/organizations/${org.slug}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          {org.logo_url ? (
                            <Image
                              src={org.logo_url}
                              alt={`${org.name} logo`}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded"
                            />
                          ) : (
                            <Building className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-foreground">
                            {org.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {org.sector}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {org.company_size}
                            </Badge>
                            {org.current_openings > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {org.current_openings} openings
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {org.headquarters_location}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span>Founded {org.founded_year}</span>
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {org.company_description}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/organizations/${org.slug}`);
                          }}
                        >
                          View Profile
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>

          {/* Results Summary */}
          {!loading && (
            <motion.div variants={itemVariants} className="text-center">
              <p className="text-sm text-muted-foreground">
                Showing {filteredOrganizations.length} of {organizations.length}{' '}
                organizations
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}
