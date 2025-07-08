'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Users,
  HelpCircle,
  Building,
  Send,
  CheckCircle,
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

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description:
      'Get help with your account, technical issues, or general inquiries',
    contact: 'support@nexus.com',
    subtitle: 'Response within 24 hours',
    action: 'mailto:support@nexus.com',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak directly with our customer success team',
    contact: '+44 20 7123 4567',
    subtitle: 'Mon-Fri, 9:00 AM - 6:00 PM GMT',
    action: 'tel:+442071234567',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Get instant answers to your questions',
    contact: 'Available 24/7',
    subtitle: 'Average response time: 2 minutes',
    action: '#',
  },
  {
    icon: Users,
    title: 'Dedicated Account Manager',
    description: 'For Enterprise clients and organizations',
    contact: 'enterprise@nexus.com',
    subtitle: 'Personalized support',
    action: 'mailto:enterprise@nexus.com',
  },
];

const officeLocations = [
  {
    city: 'London',
    address: '123 Finsbury Circus, London EC2M 7AD, United Kingdom',
    phone: '+44 20 7123 4567',
    isPrimary: true,
  },
  {
    city: 'New York',
    address: '350 5th Avenue, New York, NY 10118, United States',
    phone: '+1 (555) 123-4567',
    isPrimary: false,
  },
  {
    city: 'Singapore',
    address: '1 Raffles Place, Singapore 048616',
    phone: '+65 6123 4567',
    isPrimary: false,
  },
];

const supportTopics = [
  'General Inquiry',
  'Account & Billing',
  'Technical Support',
  'Partnership Opportunities',
  'Media & Press',
  'Feature Request',
  'Bug Report',
  'Other',
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    topic: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <MainLayout>
        <div className="page-container py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-2xl space-y-6 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Message Sent Successfully!
            </h1>
            <p className="text-lg text-muted-foreground">
              Thank you for contacting us. We&apos;ve received your message and
              will get back to you within 24 hours.
            </p>
            <Button onClick={() => setIsSubmitted(false)} className="mt-6">
              Send Another Message
            </Button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-container section-spacing">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Header */}
          <motion.section
            variants={itemVariants}
            className="space-y-6 text-center"
          >
            <h1 className="text-5xl font-bold text-foreground">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              We&apos;re here to help you succeed. Whether you have a question
              about our platform, need technical support, or want to explore
              partnership opportunities, our team is ready to assist.
            </p>
          </motion.section>

          {/* Contact Methods */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="h-full"
              >
                <Card className="group h-full border-2 border-transparent p-6 transition-all duration-300 hover:border-primary/10 hover:shadow-lg">
                  <CardContent className="flex h-full flex-col justify-between p-0 text-center">
                    <div className="space-y-4">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <method.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="mb-2 font-semibold text-foreground">
                          {method.title}
                        </h3>
                        <p className="mb-3 text-sm text-muted-foreground">
                          {method.description}
                        </p>
                        <div className="space-y-1">
                          <p className="font-medium text-primary">
                            {method.contact}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {method.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                      onClick={() => {
                        if (method.action.startsWith('#')) {
                          // Handle live chat or other special actions
                          alert('Live chat would open here');
                        } else {
                          window.location.href = method.action;
                        }
                      }}
                    >
                      {method.title === 'Live Chat'
                        ? 'Start Chat'
                        : 'Contact Now'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.section>

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={itemVariants}>
                <Card className="p-8">
                  <CardHeader className="mb-6 p-0">
                    <CardTitle className="text-2xl">
                      Send us a Message
                    </CardTitle>
                    <p className="text-muted-foreground">
                      Fill out the form below and we&apos;ll get back to you as
                      soon as possible.
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) =>
                              handleInputChange('firstName', e.target.value)
                            }
                            required
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) =>
                              handleInputChange('lastName', e.target.value)
                            }
                            required
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange('email', e.target.value)
                          }
                          required
                          placeholder="your.email@company.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company (Optional)</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) =>
                            handleInputChange('company', e.target.value)
                          }
                          placeholder="Your company name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="topic">Topic</Label>
                        <Select
                          onValueChange={(value) =>
                            handleInputChange('topic', value)
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {supportTopics.map((topic) => (
                              <SelectItem key={topic} value={topic}>
                                {topic}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          rows={5}
                          value={formData.message}
                          onChange={(e) =>
                            handleInputChange('message', e.target.value)
                          }
                          required
                          placeholder="Tell us how we can help you..."
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner className="h-4 w-4" />
                            Sending Message...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Office Locations & Additional Info */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Office Locations */}
              <motion.div variants={itemVariants}>
                <Card className="p-8">
                  <CardHeader className="mb-6 p-0">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Building className="h-6 w-6 text-primary" />
                      Our Offices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-0">
                    {officeLocations.map((office, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {office.city}
                          </h3>
                          {office.isPrimary && (
                            <Badge variant="outline" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>{office.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{office.phone}</span>
                          </div>
                        </div>
                        {index < officeLocations.length - 1 && (
                          <div className="mt-4 border-b border-border" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Business Hours */}
              <motion.div variants={itemVariants}>
                <Card className="p-8">
                  <CardHeader className="mb-6 p-0">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Clock className="h-6 w-6 text-primary" />
                      Support Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-0">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Monday - Friday
                        </span>
                        <span className="font-medium">
                          9:00 AM - 6:00 PM GMT
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Saturday</span>
                        <span className="font-medium">
                          10:00 AM - 2:00 PM GMT
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sunday</span>
                        <span className="font-medium">Closed</span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground">
                        Live chat and emergency support available 24/7 for
                        Enterprise clients.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Links */}
              <motion.div variants={itemVariants}>
                <Card className="p-8">
                  <CardHeader className="mb-6 p-0">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <HelpCircle className="h-6 w-6 text-primary" />
                      Need Help?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-0">
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => window.open('/help', '_blank')}
                      >
                        Visit Help Center
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => window.open('/faq', '_blank')}
                      >
                        Browse FAQ
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => window.open('/api-docs', '_blank')}
                      >
                        API Documentation
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
