'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    MapPin,
    Building,
    Calendar,
    Clock,
    DollarSign,
    Users,
    Share2,
    Bookmark,
    ArrowLeft,
    ExternalLink,
    CheckCircle
} from 'lucide-react'

// Sample opportunity data
const opportunity = {
    id: 'opp-123',
    title: 'Non-Executive Director',
    company: {
        name: 'TechGrowth Ventures Ltd',
        logo: '/placeholder-logo.png',
        website: 'https://techgrowthventures.com',
        size: '250-500 employees',
        industry: 'Technology & Software',
        location: 'London, UK',
        description: 'A leading venture capital firm focused on early-stage technology companies across Europe.'
    },
    location: 'London, UK',
    type: 'Non-Executive Director',
    sector: 'Financial Services',
    compensation: '£45,000 - £60,000',
    timeCommitment: '12-15 days per year',
    postedDate: '2024-01-15',
    applicationDeadline: '2024-02-28',
    matchScore: 92,
    status: 'Active',
    requirements: {
        essential: [
            'Proven track record as a senior executive in technology or financial services',
            'Previous board experience preferred but not essential',
            'Strong understanding of venture capital and investment principles',
            'Experience in scaling technology businesses',
            'Excellent strategic thinking and analytical skills'
        ],
        desirable: [
            'Network within the European technology ecosystem',
            'Experience with ESG and sustainable investing',
            'Background in M&A or corporate development',
            'International market experience'
        ]
    },
    responsibilities: [
        'Provide strategic guidance to portfolio companies',
        'Participate in investment committee decisions',
        'Mentor portfolio company leadership teams',
        'Support due diligence on new investment opportunities',
        'Contribute to firm\'s strategic planning and direction'
    ],
    description: `
TechGrowth Ventures is seeking an experienced Non-Executive Director to join our board and contribute to our mission of backing Europe's most promising technology companies.

As a NED, you will play a crucial role in our governance structure while providing valuable strategic input to both our firm and our portfolio companies. This is an excellent opportunity for a senior executive looking to leverage their experience in a dynamic venture capital environment.

We are particularly interested in candidates who can bring deep technology sector knowledge, combined with strong commercial acumen and a passion for supporting entrepreneurial ventures.
    `,
    applicationProcess: {
        steps: [
            'Submit application with CV and cover letter',
            'Initial screening call with our executive search partner',
            'Panel interview with existing board members',
            'Reference checks and background verification',
            'Final decision and offer'
        ],
        timeline: '4-6 weeks from application deadline',
        contact: 'Sarah Mitchell, Executive Search Consultant'
    },
    benefits: [
        'Competitive director fees',
        'Opportunity to work with cutting-edge technology companies',
        'Access to exclusive investment opportunities',
        'Professional development and networking',
        'D&O insurance coverage'
    ]
}

export default function OpportunityDetailsPage({ params }: { params: { id: string } }) {
    const [isBookmarked, setIsBookmarked] = useState(false)

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="page-container py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/opportunities" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Search
                            </Link>
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            Opportunity Details
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-container py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Opportunity Header */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start gap-6">
                                    <Avatar className="h-16 w-16 rounded-lg">
                                        <AvatarImage src={opportunity.company.logo} alt={opportunity.company.name} />
                                        <AvatarFallback className="rounded-lg text-lg font-semibold bg-primary text-primary-foreground">
                                            {opportunity.company.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div>
                                                <h1 className="text-2xl font-bold text-foreground mb-2">
                                                    {opportunity.title}
                                                </h1>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Building className="h-4 w-4" />
                                                    <span className="font-medium">{opportunity.company.name}</span>
                                                    <Badge variant="secondary" className="ml-2">
                                                        {opportunity.matchScore}% Match
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsBookmarked(!isBookmarked)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                                                    {isBookmarked ? 'Saved' : 'Save'}
                                                </Button>
                                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                                    <Share2 className="h-4 w-4" />
                                                    Share
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span>{opportunity.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                <span>{opportunity.compensation}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{opportunity.timeCommitment}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span>Apply by {new Date(opportunity.applicationDeadline).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Job Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle>About This Opportunity</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="prose prose-sm max-w-none">
                                    {opportunity.description.split('\n\n').map((paragraph, index) => (
                                        <p key={index} className="text-muted-foreground leading-relaxed">
                                            {paragraph.trim()}
                                        </p>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Key Responsibilities */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Key Responsibilities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {opportunity.responsibilities.map((responsibility, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                            <span className="text-muted-foreground">{responsibility}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Requirements */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Requirements</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-foreground mb-3">Essential Requirements</h4>
                                    <ul className="space-y-2">
                                        {opportunity.requirements.essential.map((requirement, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                                <span className="text-muted-foreground text-sm">{requirement}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-foreground mb-3">Desirable Requirements</h4>
                                    <ul className="space-y-2">
                                        {opportunity.requirements.desirable.map((requirement, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <div className="h-2 w-2 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                                                <span className="text-muted-foreground text-sm">{requirement}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Benefits */}
                        <Card>
                            <CardHeader>
                                <CardTitle>What We Offer</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {opportunity.benefits.map((benefit, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-muted-foreground">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Apply Card */}
                        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <h3 className="font-semibold text-foreground mb-2">Ready to Apply?</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Join {opportunity.company.name} as their next {opportunity.title}
                                        </p>
                                        <Button size="lg" className="w-full" asChild>
                                            <Link href={`/opportunities/${opportunity.id}/apply`}>
                                                Apply Now
                                            </Link>
                                        </Button>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Application Deadline:</span>
                                            <span className="font-medium">
                                                {new Date(opportunity.applicationDeadline).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Expected Timeline:</span>
                                            <span className="font-medium">{opportunity.applicationProcess.timeline}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Company Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    About {opportunity.company.name}
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={opportunity.company.website} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    {opportunity.company.description}
                                </p>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Industry:</span>
                                        <span className="font-medium">{opportunity.company.industry}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Company Size:</span>
                                        <span className="font-medium">{opportunity.company.size}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Location:</span>
                                        <span className="font-medium">{opportunity.company.location}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Application Process */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Application Process</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <ol className="space-y-3">
                                        {opportunity.applicationProcess.steps.map((step, index) => (
                                            <li key={index} className="flex gap-3 text-sm">
                                                <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                                                    {index + 1}
                                                </div>
                                                <span className="text-muted-foreground">{step}</span>
                                            </li>
                                        ))}
                                    </ol>

                                    <Separator />

                                    <div className="text-sm">
                                        <p className="text-muted-foreground">
                                            <strong>Contact:</strong> {opportunity.applicationProcess.contact}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
} 