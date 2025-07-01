'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Brain,
  Target,
  Users,
  TrendingUp,
  Award,
  Zap,
  Shield,
  Globe,
  ChevronRight,
  Sparkles,
  BarChart3,
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

const stats = [
  { number: '5,000+', label: 'Successful Placements', icon: Award },
  { number: '15,000+', label: 'Active Candidates', icon: Users },
  { number: '98%', label: 'Match Accuracy', icon: Target },
  { number: '2.5x', label: 'Faster Placements', icon: Zap },
];

const teamMembers = [
  {
    name: 'Sarah Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former Goldman Sachs MD with 15+ years in executive search. Harvard MBA.',
    image: '/team/sarah-chen.jpg',
    initials: 'SC',
  },
  {
    name: 'Dr. Marcus Thompson',
    role: 'CTO & Co-Founder',
    bio: 'AI researcher, former Google. PhD in Machine Learning from Stanford.',
    image: '/team/marcus-thompson.jpg',
    initials: 'MT',
  },
  {
    name: 'Emma Rodriguez',
    role: 'Head of Talent',
    bio: '12 years in board recruitment. Former Russell Reynolds consultant.',
    image: '/team/emma-rodriguez.jpg',
    initials: 'ER',
  },
  {
    name: 'James Wu',
    role: 'Head of AI',
    bio: 'Machine learning expert. Former Microsoft Research scientist.',
    image: '/team/james-wu.jpg',
    initials: 'JW',
  },
];

const values = [
  {
    icon: Brain,
    title: 'AI-Powered Intelligence',
    description:
      'Our proprietary algorithms analyze thousands of data points to create perfect matches between candidates and opportunities.',
  },
  {
    icon: Shield,
    title: 'Trust & Transparency',
    description:
      'Every recommendation comes with clear reasoning and confidence scores, so you understand exactly why matches are made.',
  },
  {
    icon: Globe,
    title: 'Global Network',
    description:
      'Connect with board opportunities and talent from around the world, breaking down traditional geographical barriers.',
  },
  {
    icon: TrendingUp,
    title: 'Continuous Learning',
    description:
      'Our AI constantly improves from every placement, feedback, and interaction to deliver better results over time.',
  },
];

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="section-spacing bg-gradient-to-br from-background to-secondary/30"
        >
          <div className="page-container">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <motion.div variants={itemVariants} className="space-y-6">
                <Badge variant="outline" className="w-fit">
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI-Powered Board Search
                </Badge>
                <h1 className="text-4xl font-bold leading-tight text-foreground lg:text-6xl">
                  Revolutionizing Board Recruitment with{' '}
                  <span className="gradient-text">Artificial Intelligence</span>
                </h1>
                <p className="text-xl leading-relaxed text-muted-foreground lg:text-2xl">
                  Nexus combines cutting-edge AI technology with deep industry
                  expertise to connect the right board talent with the right
                  opportunities, faster and more accurately than ever before.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button size="lg" className="w-fit">
                    See How It Works
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" className="w-fit">
                    View Our Stats
                  </Button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="relative">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-full bg-primary p-2 text-primary-foreground">
                        <Brain className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        Nexus Score Technology
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Experience Match
                        </span>
                        <Badge variant="secondary">95%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Skills Alignment
                        </span>
                        <Badge variant="secondary">92%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Cultural Fit
                        </span>
                        <Badge variant="secondary">88%</Badge>
                      </div>
                      <div className="my-4 h-px bg-border"></div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Overall Nexus Score</span>
                        <Badge className="text-base font-bold">92%</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="section-spacing border-t border-border/50 bg-background"
        >
          <div className="page-container">
            <motion.div variants={itemVariants} className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground">
                Platform Performance
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Our AI-powered platform delivers exceptional results for both
                candidates and organizations
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center"
                >
                  <Card className="border-2 border-transparent p-8 transition-shadow hover:border-primary/10 hover:shadow-lg">
                    <CardContent className="space-y-6 p-0">
                      <div className="mx-auto w-fit rounded-full bg-primary/10 p-4 text-primary">
                        <stat.icon className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="mb-2 text-4xl font-bold text-foreground lg:text-5xl">
                          {stat.number}
                        </div>
                        <div className="text-base font-medium text-muted-foreground">
                          {stat.label}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Nexus Score Deep Dive */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="section-spacing bg-gradient-to-br from-secondary/20 to-background"
        >
          <div className="page-container">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <motion.div variants={itemVariants}>
                <Card className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-8 w-8 text-primary" />
                      <h2 className="text-2xl font-bold">The Nexus Score</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                        <div>
                          <h4 className="font-medium">Experience Analysis</h4>
                          <p className="text-sm text-muted-foreground">
                            AI evaluates career progression, industry exposure,
                            and leadership roles
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                        <div>
                          <h4 className="font-medium">Skills Matching</h4>
                          <p className="text-sm text-muted-foreground">
                            Deep learning algorithms match technical and soft
                            skills requirements
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                        <div>
                          <h4 className="font-medium">
                            Cultural Fit Assessment
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Analyzes company values, working styles, and
                            personality indicators
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                        <div>
                          <h4 className="font-medium">Market Dynamics</h4>
                          <p className="text-sm text-muted-foreground">
                            Considers sector trends, compensation benchmarks,
                            and timing factors
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-8">
                <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
                  Beyond Traditional Matching
                </h2>
                <p className="text-xl leading-relaxed text-muted-foreground">
                  Our proprietary Nexus Score goes far beyond keyword matching.
                  Using advanced machine learning, we analyze over{' '}
                  <span className="font-semibold text-primary">
                    200 data points
                  </span>{' '}
                  to predict not just qualification fit, but long-term success
                  and satisfaction in board roles.
                </p>

                <div className="space-y-6">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 transition-colors hover:bg-primary/10">
                    <h4 className="mb-3 text-lg font-semibold text-primary">
                      For Candidates
                    </h4>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      Get personalized opportunity recommendations with clear
                      explanations of why each role matches your profile and
                      career goals.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary/20 p-6 transition-colors hover:bg-secondary/30">
                    <h4 className="mb-3 text-lg font-semibold">
                      For Organizations
                    </h4>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      Receive ranked candidate lists with detailed compatibility
                      analysis, reducing time-to-hire by{' '}
                      <span className="font-semibold text-primary">60%</span>{' '}
                      while improving placement quality.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Our Values */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="section-spacing bg-background"
        >
          <div className="page-container">
            <motion.div variants={itemVariants} className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground">
                What Drives Us
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Our core values shape every aspect of how we build technology
                and serve our community
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {values.map((value, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full p-6 transition-shadow hover:shadow-lg">
                    <CardContent className="space-y-4 p-0">
                      <div className="w-fit rounded-full bg-primary/10 p-3 text-primary">
                        <value.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {value.title}
                      </h3>
                      <p className="leading-relaxed text-muted-foreground">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Team Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="section-spacing bg-gradient-to-br from-background to-secondary/20"
        >
          <div className="page-container">
            <motion.div variants={itemVariants} className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground">
                Meet Our Leadership Team
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Industry veterans and AI pioneers working together to transform
                board recruitment
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="h-full"
                >
                  <Card className="group flex h-full flex-col border-2 border-transparent p-8 text-center transition-all duration-300 hover:border-primary/10 hover:shadow-lg">
                    <CardContent className="flex flex-1 flex-col space-y-6 p-0">
                      <Avatar className="mx-auto h-24 w-24 ring-4 ring-primary/10 transition-all group-hover:ring-primary/20">
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="mb-2 text-lg font-bold text-foreground">
                          {member.name}
                        </h3>
                        <p className="text-base font-semibold text-primary">
                          {member.role}
                        </p>
                      </div>
                      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                        {member.bio}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="section-spacing bg-primary"
        >
          <div className="page-container text-center">
            <motion.div
              variants={itemVariants}
              className="mx-auto max-w-3xl space-y-6"
            >
              <h2 className="text-3xl font-bold text-white">
                Ready to Experience the Future of Board Search?
              </h2>
              <p className="text-xl leading-relaxed text-white/90">
                Join thousands of executives and organizations who trust Nexus
                to make better board connections with AI-powered precision.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="border-0 bg-white font-medium text-primary hover:bg-white/90"
                  style={{
                    transform: 'none !important',
                    fontSize: 'inherit !important',
                    width: 'auto !important',
                    minWidth: 'auto !important',
                  }}
                >
                  Join as a Candidate
                </Button>
                <Button
                  size="lg"
                  className="border-2 border-white bg-transparent font-medium text-white transition-colors duration-200 hover:bg-white hover:text-primary"
                  style={{
                    transform: 'none !important',
                    fontSize: 'inherit !important',
                    width: 'auto !important',
                    minWidth: 'auto !important',
                  }}
                >
                  Post an Opportunity
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </MainLayout>
  );
}
