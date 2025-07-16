'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, Users, Briefcase, TrendingUp } from 'lucide-react';

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

export default function HomePage() {
  return (
    <MainLayout>
      <div className="page-container section-spacing">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Hero Section */}
          <motion.section
            variants={itemVariants}
            className="space-y-6 text-center"
          >
            <h1 className="text-balance text-6xl font-bold text-foreground">
              Where Executive Excellence{' '}
              <span className="gradient-text">Connects</span>
            </h1>
            <p className="mx-auto max-w-3xl text-balance text-xl text-muted-foreground">
              The premier platform connecting executive talent with board
              opportunities through intelligent matching and professional
              development.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button size="lg" className="shadow-nexus-md" asChild>
                <Link href="/sign-up">
                  <Plus className="h-5 w-5" />
                  Join as Candidate
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/organizations">Post a Role</Link>
              </Button>
            </div>
          </motion.section>

          {/* Market Stats Section */}
          <motion.section variants={itemVariants}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-3xl font-bold">3,361</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Board Positions Available Annually
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-3xl font-bold">65%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Board Appointments Made Through Personal Networks
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-3xl font-bold">63</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Industry Sectors With Active Board Recruitment
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Features Section */}
          <motion.section variants={itemVariants} className="space-y-8">
            <div className="space-y-4 text-center">
              <h2 className="text-4xl font-bold text-foreground">
                Why Choose Nexus?
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                Technology-enhanced executive search with human expertise at its
                core.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <Card className="card-featured">
                <CardHeader>
                  <CardTitle className="text-2xl">Expert Curation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Our 30+ sector specialists bring deep industry knowledge and
                    proven track records to every search, ensuring quality
                    matches that go beyond algorithms.
                  </p>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">Financial Services</Badge>
                    <Badge variant="secondary">Technology</Badge>
                    <Badge variant="secondary">Healthcare</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    AI-Powered Matching
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Advanced algorithms analyze skills, experience, and cultural
                    fit to identify the perfect candidates for your board
                    positions.
                  </p>
                  <div className="flex space-x-2">
                    <Badge variant="outline">Skills Analysis</Badge>
                    <Badge variant="outline">Cultural Fit</Badge>
                    <Badge variant="outline">Experience Match</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Professional Growth
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Continuous learning opportunities, networking events, and
                    career development resources to help you excel in your board
                    roles.
                  </p>
                  <div className="flex space-x-2">
                    <Badge variant="outline">Training</Badge>
                    <Badge variant="outline">Networking</Badge>
                    <Badge variant="outline">Mentorship</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Trusted Network</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Join a community of accomplished executives and
                    organizations committed to excellence in governance and
                    leadership.
                  </p>
                  <div className="flex space-x-2">
                    <Badge variant="outline">Vetted Members</Badge>
                    <Badge variant="outline">Quality Network</Badge>
                    <Badge variant="outline">Trusted Platform</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            variants={itemVariants}
            className="space-y-6 rounded-2xl bg-secondary/20 p-12 text-center"
          >
            <h2 className="text-4xl font-bold text-foreground">
              Ready to Find Your Next Board Opportunity?
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Join thousands of executives who have advanced their careers
              through Nexus.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">Get Started Today</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </MainLayout>
  );
}
