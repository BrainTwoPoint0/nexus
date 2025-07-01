'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MainLayout } from '@/components/layout/main-layout';
import { Users, FileText, Calendar, Plus, Search, Eye } from 'lucide-react';

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

// Mock data for organization
const mockOrganization = {
  name: 'TechForward Industries',
  logo: 'TI',
  sector: 'Technology',
  location: 'London, UK',
};

const mockStats = [
  {
    title: 'Active Roles',
    value: '3',
    icon: FileText,
    change: '+1 this month',
  },
  {
    title: 'Applications Received',
    value: '42',
    icon: Users,
    change: '+12 this week',
  },
  {
    title: 'Interviews Scheduled',
    value: '8',
    icon: Calendar,
    change: '3 upcoming',
  },
  { title: 'Profile Views', value: '156', icon: Eye, change: '+24 this week' },
];

const mockActiveRoles = [
  {
    id: 1,
    title: 'Non-Executive Director',
    department: 'Board',
    postedDate: '5 days ago',
    applications: 18,
    shortlisted: 4,
    deadline: '10 days left',
    status: 'Active',
  },
  {
    id: 2,
    title: 'Audit Committee Chair',
    department: 'Finance',
    postedDate: '2 weeks ago',
    applications: 15,
    shortlisted: 3,
    deadline: '3 days left',
    status: 'Closing Soon',
  },
  {
    id: 3,
    title: 'Independent Director',
    department: 'Board',
    postedDate: '1 month ago',
    applications: 9,
    shortlisted: 2,
    deadline: 'Closed',
    status: 'Interviewing',
  },
];

const mockCandidates = [
  {
    id: 1,
    name: 'Sarah Johnson',
    initials: 'SJ',
    title: 'Former VP of Technology',
    experience: '15+ years',
    matchScore: 95,
    appliedFor: 'Non-Executive Director',
    status: 'New Application',
    appliedDate: '2 days ago',
  },
  {
    id: 2,
    name: 'Michael Chen',
    initials: 'MC',
    title: 'Former CFO',
    experience: '20+ years',
    matchScore: 92,
    appliedFor: 'Audit Committee Chair',
    status: 'Shortlisted',
    appliedDate: '1 week ago',
  },
  {
    id: 3,
    name: 'Emma Williams',
    initials: 'EW',
    title: 'Former Chief Legal Officer',
    experience: '12+ years',
    matchScore: 88,
    appliedFor: 'Independent Director',
    status: 'Interview Scheduled',
    appliedDate: '2 weeks ago',
  },
];

const mockRecentActivity = [
  {
    type: 'application',
    message: 'New application from Sarah Johnson for Non-Executive Director',
    time: '2 hours ago',
  },
  {
    type: 'shortlist',
    message: 'Michael Chen shortlisted for Audit Committee Chair',
    time: '5 hours ago',
  },
  {
    type: 'interview',
    message: 'Interview scheduled with Emma Williams',
    time: '1 day ago',
  },
  {
    type: 'view',
    message: 'Your Non-Executive Director role was viewed 12 times',
    time: '1 day ago',
  },
];

export default function OrganizationDashboardPage() {
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
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {mockOrganization.logo}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {mockOrganization.name}
                </h1>
                <p className="text-muted-foreground">
                  {mockOrganization.sector} • {mockOrganization.location}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Browse Candidates
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Post New Role
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {mockStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {stat.value}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {stat.change}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Active Roles */}
            <motion.div
              variants={itemVariants}
              className="space-y-6 lg:col-span-2"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>Active Roles</CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockActiveRoles.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-lg border p-4 transition-colors hover:bg-secondary/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-foreground">
                              {role.title}
                            </h3>
                            <Badge
                              variant={
                                role.status === 'Active'
                                  ? 'default'
                                  : role.status === 'Closing Soon'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {role.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {role.department} • Posted {role.postedDate}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>{role.applications} applications</span>
                            <span>•</span>
                            <span>{role.shortlisted} shortlisted</span>
                            <span>•</span>
                            <span
                              className={
                                role.deadline === 'Closed'
                                  ? 'text-red-600'
                                  : 'text-orange-600'
                              }
                            >
                              {role.deadline}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-right">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Candidates */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>Recent Candidates</CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="rounded-lg border p-4 transition-colors hover:bg-secondary/30"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {candidate.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-foreground">
                                {candidate.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {candidate.title} • {candidate.experience}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="mb-1 flex items-center space-x-1">
                                <span className="text-sm font-medium text-primary">
                                  {candidate.matchScore}% match
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {candidate.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Applied for {candidate.appliedFor}</span>
                            <span>{candidate.appliedDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Post New Role
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Search className="mr-2 h-4 w-4" />
                    Search Candidates
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Interview
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Download Reports
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockRecentActivity.map((activity, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm text-foreground">
                          {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming Interviews */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Interviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Emma Williams</p>
                        <p className="text-xs text-muted-foreground">
                          Tomorrow, 2:00 PM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Michael Chen</p>
                        <p className="text-xs text-muted-foreground">
                          Friday, 10:00 AM
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
