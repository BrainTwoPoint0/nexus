'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MainLayout } from '@/components/layout/main-layout'
import {
    Users,
    TrendingUp,
    Bell,
    Search,
    FileText,
    Calendar,
    Plus,
    ExternalLink
} from 'lucide-react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useState, useEffect } from 'react'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

interface Profile {
    first_name: string | null
    last_name: string | null
    title: string | null
    company: string | null
}

const mockStats = [
    { title: 'Applications Sent', value: '12', icon: FileText, change: '+2 this week' },
    { title: 'Profile Views', value: '34', icon: Users, change: '+8 this week' },
    { title: 'Opportunities Matched', value: '6', icon: TrendingUp, change: '3 new today' },
    { title: 'Upcoming Events', value: '2', icon: Calendar, change: 'This month' },
]

const mockOpportunities = [
    {
        id: 1,
        title: 'Non-Executive Director',
        company: 'GreenTech Solutions',
        sector: 'Technology',
        location: 'London, UK',
        postedDate: '2 days ago',
        matchScore: 95,
        status: 'New',
    },
    {
        id: 2,
        title: 'Board Chair',
        company: 'Healthcare Innovations Ltd',
        sector: 'Healthcare',
        location: 'Remote',
        postedDate: '5 days ago',
        matchScore: 88,
        status: 'Applied',
    },
    {
        id: 3,
        title: 'Audit Committee Member',
        company: 'Financial Services Group',
        sector: 'Finance',
        location: 'New York, USA',
        postedDate: '1 week ago',
        matchScore: 82,
        status: 'Reviewing',
    },
]

const mockRecentActivity = [
    { type: 'application', message: 'You applied for Non-Executive Director at GreenTech Solutions', time: '2 hours ago' },
    { type: 'view', message: 'Your profile was viewed by Healthcare Innovations Ltd', time: '5 hours ago' },
    { type: 'match', message: 'New opportunity matched: Audit Committee Member', time: '1 day ago' },
    { type: 'event', message: 'Reminder: Board Governance Webinar tomorrow at 2 PM', time: '1 day ago' },
]

export default function DashboardPage() {
    const supabase = useSupabaseClient()
    const user = useUser()

    const [profile, setProfile] = useState<Profile | null>(null)

    useEffect(() => {
        if (!user) return
        supabase
            .from('profiles')
            .select('first_name, last_name, title, company')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
                if (data) setProfile(data as Profile)
            })
    }, [user, supabase])

    const displayName = (profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : user?.email) || 'User'
    const initials = (profile?.first_name?.[0] ?? '') + (profile?.last_name?.[0] ?? '') || (user?.email?.[0] ?? 'U')
    const titleAndCompany = profile?.title ? `${profile.title}${profile.company ? ' at ' + profile.company : ''}` : ''

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
                    <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">
                                    Welcome back, {displayName.split(' ')[0]}
                                </h1>
                                <p className="text-muted-foreground">
                                    {titleAndCompany}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button variant="outline" size="sm">
                                <Bell className="h-4 w-4 mr-2" />
                                Notifications
                            </Button>
                            <Button size="sm">
                                <Search className="h-4 w-4 mr-2" />
                                Browse Opportunities
                            </Button>
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {mockStats.map((stat, index) => {
                            const Icon = stat.icon
                            return (
                                <Card key={index} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    {stat.title}
                                                </p>
                                                <p className="text-2xl font-bold text-foreground">
                                                    {stat.value}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {stat.change}
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Icon className="h-6 w-6 text-primary" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Opportunities */}
                        <motion.div variants={itemVariants} className="lg:col-span-2">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <CardTitle>Recent Opportunities</CardTitle>
                                    <Button variant="ghost" size="sm">
                                        View All
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {mockOpportunities.map((opportunity) => (
                                        <div
                                            key={opportunity.id}
                                            className="border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold text-foreground">
                                                            {opportunity.title}
                                                        </h3>
                                                        <Badge
                                                            variant={opportunity.status === 'New' ? 'default' : 'secondary'}
                                                        >
                                                            {opportunity.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {opportunity.company} • {opportunity.sector}
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                                        <span>{opportunity.location}</span>
                                                        <span>•</span>
                                                        <span>{opportunity.postedDate}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right space-y-2">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-sm font-medium text-primary">
                                                            {opportunity.matchScore}% match
                                                        </span>
                                                    </div>
                                                    <Button size="sm" variant="outline">
                                                        View Details
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Recent Activity & Quick Actions */}
                        <motion.div variants={itemVariants} className="space-y-6">
                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button className="w-full justify-start" variant="outline">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Update Profile
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline">
                                        <Search className="h-4 w-4 mr-2" />
                                        Search Opportunities
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        View Events
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Download CV
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
                                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                            <div className="space-y-1 flex-1">
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
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </MainLayout>
    )
} 