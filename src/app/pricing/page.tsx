'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Check,
  X,
  Building,
  Users,
  Brain,
  Zap,
  Shield,
  ArrowRight,
  Sparkles,
  BarChart3,
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

const candidatePlans = [
  {
    name: 'Free',
    description: 'Perfect for exploring opportunities',
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: null,
    features: [
      { name: 'Basic profile creation', included: true },
      { name: 'Browse opportunities', included: true },
      { name: 'Basic Nexus Score', included: true },
      { name: '3 applications per month', included: true },
      { name: 'Email notifications', included: true },
      { name: 'Community access', included: true },
      { name: 'Advanced matching', included: false },
      { name: 'Priority support', included: false },
      { name: 'Compensation insights', included: false },
      { name: 'Direct recruiter messaging', included: false },
      { name: 'Interview coaching', included: false },
      { name: 'Career planning tools', included: false },
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'For active board seekers',
    monthlyPrice: 49,
    yearlyPrice: 39,
    badge: 'Most Popular',
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Advanced Nexus Score analytics', included: true },
      { name: 'Unlimited applications', included: true },
      { name: 'Priority in search results', included: true },
      { name: 'Compensation benchmarking', included: true },
      { name: 'Direct recruiter messaging', included: true },
      { name: 'Weekly opportunity digest', included: true },
      { name: 'Basic interview preparation', included: true },
      { name: 'Industry insights reports', included: true },
      { name: 'Standard support', included: true },
      { name: 'Personal brand coaching', included: false },
      { name: 'Executive coaching sessions', included: false },
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Executive',
    description: 'For serious board professionals',
    monthlyPrice: 199,
    yearlyPrice: 159,
    badge: 'Premium',
    features: [
      { name: 'Everything in Professional', included: true },
      { name: 'AI-powered career planning', included: true },
      { name: 'Personal brand optimization', included: true },
      { name: 'Executive coaching sessions', included: true },
      { name: 'VIP event invitations', included: true },
      { name: 'Priority support & account manager', included: true },
      { name: 'Custom market analysis', included: true },
      { name: 'Board readiness assessment', included: true },
      { name: 'Networking introductions', included: true },
      { name: 'White-glove service', included: true },
      { name: 'Exclusive opportunities', included: true },
      { name: 'Quarterly strategy sessions', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const organizationPlans = [
  {
    name: 'Starter',
    description: 'For small organizations',
    monthlyPrice: 299,
    yearlyPrice: 249,
    badge: null,
    features: [
      { name: 'Post up to 3 roles per month', included: true },
      { name: 'AI-powered candidate matching', included: true },
      { name: 'Basic Nexus Score insights', included: true },
      { name: 'Standard search filters', included: true },
      { name: 'Email support', included: true },
      { name: 'Basic reporting', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'Dedicated account manager', included: false },
      { name: 'Custom branding', included: false },
      { name: 'API access', included: false },
      { name: 'Priority candidate sourcing', included: false },
      { name: 'Interview scheduling tools', included: false },
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'For growing companies',
    monthlyPrice: 799,
    yearlyPrice: 649,
    badge: 'Recommended',
    features: [
      { name: 'Post unlimited roles', included: true },
      { name: 'Advanced AI matching algorithms', included: true },
      { name: 'Detailed Nexus Score analytics', included: true },
      { name: 'Advanced search & filters', included: true },
      { name: 'Priority support', included: true },
      { name: 'Comprehensive reporting', included: true },
      { name: 'Interview scheduling tools', included: true },
      { name: 'Team collaboration features', included: true },
      { name: 'Candidate pipeline management', included: true },
      { name: 'Basic custom branding', included: true },
      { name: 'Dedicated account manager', included: false },
      { name: 'Enterprise integrations', included: false },
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 'Custom',
    yearlyPrice: 'Custom',
    badge: 'Enterprise',
    features: [
      { name: 'Everything in Professional', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom AI model training', included: true },
      { name: 'White-label solutions', included: true },
      { name: 'Enterprise integrations (HRIS, ATS)', included: true },
      { name: 'Advanced security & compliance', included: true },
      { name: 'Custom reporting & analytics', included: true },
      { name: 'SLA guarantees', included: true },
      { name: 'On-premise deployment options', included: true },
      { name: '24/7 phone support', included: true },
      { name: 'Custom onboarding program', included: true },
      { name: 'Volume discounts', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const faqs = [
  {
    question: 'How does the Nexus Score work?',
    answer:
      'Our AI analyzes over 200 data points including experience, skills, cultural fit, and market dynamics to create a compatibility score between candidates and roles. This goes far beyond keyword matching to predict long-term success.',
  },
  {
    question: 'Can I switch plans anytime?',
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments.",
  },
  {
    question: 'Do you offer custom enterprise solutions?',
    answer:
      'Absolutely. Our Enterprise plan includes custom AI model training, white-label solutions, and dedicated support to meet your specific needs.',
  },
  {
    question: 'Is there a free trial available?',
    answer:
      'Yes! We offer a 14-day free trial for all paid plans. No credit card required to start your trial.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, bank transfers, and can accommodate invoice-based billing for Enterprise customers.',
  },
  {
    question: 'How accurate is the AI matching?',
    answer:
      'Our AI maintains a 98% match accuracy rate and improves continuously. We track successful placements and optimize our algorithms based on real-world outcomes.',
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'candidates' | 'organizations'
  >('candidates');

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
          <div className="page-container text-center">
            <motion.div
              variants={itemVariants}
              className="mx-auto max-w-4xl space-y-8"
            >
              <Badge variant="outline" className="mx-auto w-fit">
                <Sparkles className="mr-1 h-3 w-3" />
                AI-Powered Pricing
              </Badge>

              <h1 className="text-4xl font-bold leading-tight text-foreground lg:text-6xl">
                Simple, Transparent{' '}
                <span className="gradient-text">Pricing</span>
              </h1>

              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground lg:text-2xl">
                Choose the perfect plan to unlock the power of AI-driven board
                recruitment. Start free and scale as you grow.
              </p>

              {/* Plan Type Toggle */}
              <div className="mx-auto flex w-fit items-center justify-center space-x-8 rounded-full bg-secondary/20 p-1">
                <button
                  onClick={() => setSelectedTab('candidates')}
                  className={`rounded-full px-6 py-3 font-medium transition-all ${
                    selectedTab === 'candidates'
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="mr-2 inline h-4 w-4" />
                  For Candidates
                </button>
                <button
                  onClick={() => setSelectedTab('organizations')}
                  className={`rounded-full px-6 py-3 font-medium transition-all ${
                    selectedTab === 'organizations'
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building className="mr-2 inline h-4 w-4" />
                  For Organizations
                </button>
              </div>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center space-x-4">
                <span
                  className={`text-base ${!isYearly ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                >
                  Monthly
                </span>
                <Switch checked={isYearly} onCheckedChange={setIsYearly} />
                <span
                  className={`text-base ${isYearly ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                >
                  Yearly
                </span>
                <Badge variant="secondary" className="ml-2">
                  Save 20%
                </Badge>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Pricing Cards */}
        <motion.section
          key={selectedTab} // Force re-render when tab changes
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-background py-16"
        >
          <div className="page-container">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
              {(selectedTab === 'candidates'
                ? candidatePlans
                : organizationPlans
              ).map((plan) => (
                <motion.div key={plan.name} variants={itemVariants}>
                  <Card
                    className={`relative flex h-full flex-col ${
                      plan.popular
                        ? 'scale-105 border-2 border-primary shadow-xl'
                        : 'border border-border hover:border-primary/50'
                    } transition-all duration-300 hover:shadow-lg`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                        <Badge className="bg-primary px-4 py-1 text-primary-foreground">
                          {plan.badge}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="p-8 pb-4 text-center">
                      <CardTitle className="mb-2 text-2xl font-bold">
                        {plan.name}
                      </CardTitle>
                      <p className="mb-6 text-muted-foreground">
                        {plan.description}
                      </p>

                      <div className="space-y-2">
                        {typeof plan.monthlyPrice === 'number' ? (
                          <>
                            <div className="text-4xl font-bold text-foreground">
                              ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                              <span className="text-lg font-normal text-muted-foreground">
                                /month
                              </span>
                            </div>
                            {isYearly &&
                              typeof plan.monthlyPrice === 'number' &&
                              plan.monthlyPrice > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  <span className="line-through">
                                    ${plan.monthlyPrice}/month
                                  </span>
                                  <span className="ml-2 text-green-600">
                                    Save $
                                    {((plan.monthlyPrice as number) -
                                      (plan.yearlyPrice as number)) *
                                      12}
                                    /year
                                  </span>
                                </div>
                              )}
                          </>
                        ) : (
                          <div className="text-4xl font-bold text-foreground">
                            {plan.monthlyPrice}
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-8 pt-4">
                      <Button
                        className={`mb-8 w-full ${
                          plan.popular
                            ? 'bg-primary hover:bg-primary/90'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                        size="lg"
                      >
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <div className="space-y-4">
                        {plan.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-start space-x-3"
                          >
                            {feature.included ? (
                              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                            ) : (
                              <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                            )}
                            <span
                              className={`text-sm ${
                                feature.included
                                  ? 'text-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {feature.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Features Highlight */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="section-spacing bg-gradient-to-br from-secondary/20 to-background"
        >
          <div className="page-container">
            <motion.div variants={itemVariants} className="mb-16 text-center">
              <h2 className="mb-6 text-3xl font-bold text-foreground lg:text-4xl">
                Powered by Advanced AI Technology
              </h2>
              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground">
                Every plan includes our revolutionary Nexus Score technology and
                AI-powered matching
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Brain,
                  title: 'AI Matching',
                  description: '98% accuracy with continuous learning',
                },
                {
                  icon: BarChart3,
                  title: 'Nexus Score',
                  description: 'Detailed compatibility analytics',
                },
                {
                  icon: Zap,
                  title: 'Fast Results',
                  description: '2.5x faster than traditional search',
                },
                {
                  icon: Shield,
                  title: 'Secure & Private',
                  description: 'Enterprise-grade security standards',
                },
              ].map((feature, featureIndex) => (
                <motion.div
                  key={featureIndex}
                  variants={itemVariants}
                  className="h-full"
                >
                  <Card className="flex h-full flex-col border-2 border-transparent p-6 text-center transition-shadow hover:border-primary/10 hover:shadow-lg">
                    <CardContent className="flex flex-1 flex-col space-y-4 p-0">
                      <div className="mx-auto w-fit rounded-full bg-primary/10 p-3 text-primary">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="flex-1 text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="section-spacing border-t border-border/50 bg-background"
        >
          <div className="page-container">
            <motion.div variants={itemVariants} className="mb-16 text-center">
              <h2 className="mb-6 text-3xl font-bold text-foreground lg:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground">
                Everything you need to know about our pricing and features
              </p>
            </motion.div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
              {faqs.map((faq, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="p-6 transition-shadow hover:shadow-lg">
                    <CardContent className="p-0">
                      <h3 className="mb-3 font-semibold text-foreground">
                        {faq.question}
                      </h3>
                      <p className="leading-relaxed text-muted-foreground">
                        {faq.answer}
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
                Ready to Transform Your Board Search?
              </h2>
              <p className="text-xl leading-relaxed text-white/90">
                Join thousands of executives and organizations who trust Nexus
                to make smarter board connections with AI-powered precision.
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
                  Start Free Trial
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
                  Contact Sales
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </MainLayout>
  );
}
