'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingSpinner } from '@/components/ui/loading'
import {
    User,
    MapPin,
    Phone,
    Mail,
    Building,
    Briefcase,
    GraduationCap,
    Award,
    Settings,
    Upload,
    Plus,
    X
} from 'lucide-react'

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

// Mock data
const mockProfile = {
    firstName: 'Sarah',
    lastName: 'Johnson',
    title: 'Former VP of Technology',
    email: 'sarah.johnson@email.com',
    phone: '+44 20 7123 4567',
    location: 'London, UK',
    bio: 'Experienced technology executive with over 15 years leading digital transformation initiatives. Passionate about sustainable technology and governance best practices.',
    company: 'Tech Corp',
    experience: '15+ years',
    skills: ['Digital Transformation', 'Strategic Planning', 'Team Leadership', 'Financial Oversight', 'Risk Management', 'ESG'],
    certifications: ['IoD Certificate in Company Direction', 'ACCA Qualified'],
    preferences: {
        sectors: ['Technology', 'Healthcare', 'Finance'],
        locations: ['London', 'Remote', 'Europe'],
        roles: ['Non-Executive Director', 'Committee Chair'],
        availability: 'immediate',
        emailNotifications: true,
        profileVisible: true,
    }
}

export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [profile, setProfile] = useState(mockProfile)
    const [newSkill, setNewSkill] = useState('')

    const handleSave = async () => {
        setIsLoading(true)
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false)
            setIsEditing(false)
            console.log('Profile saved:', profile)
        }, 1500)
    }

    const handleInputChange = (field: string, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }))
    }

    const handlePreferenceChange = (field: string, value: any) => {
        setProfile(prev => ({
            ...prev,
            preferences: { ...prev.preferences, [field]: value }
        }))
    }

    const addSkill = () => {
        if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
            setProfile(prev => ({
                ...prev,
                skills: [...prev.skills, newSkill.trim()]
            }))
            setNewSkill('')
        }
    }

    const removeSkill = (skillToRemove: string) => {
        setProfile(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }))
    }

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
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                                        {profile.firstName[0]}{profile.lastName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                                    >
                                        <Upload className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">
                                    {profile.firstName} {profile.lastName}
                                </h1>
                                <p className="text-lg text-muted-foreground">
                                    {profile.title}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                    <div className="flex items-center space-x-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{profile.location}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Building className="h-4 w-4" />
                                        <span>{profile.company}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <LoadingSpinner size="sm" className="mr-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={() => setIsEditing(true)}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </motion.div>

                    {/* Profile Content */}
                    <motion.div variants={itemVariants}>
                        <Tabs defaultValue="personal" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                                <TabsTrigger value="experience">Experience</TabsTrigger>
                                <TabsTrigger value="skills">Skills & Certs</TabsTrigger>
                                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                            </TabsList>

                            {/* Personal Information */}
                            <TabsContent value="personal" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Personal Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="firstName"
                                                        value={profile.firstName}
                                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                        className="pl-10"
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name</Label>
                                                <Input
                                                    id="lastName"
                                                    value={profile.lastName}
                                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="title">Professional Title</Label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="title"
                                                    value={profile.title}
                                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                                    className="pl-10"
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={profile.email}
                                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                                        className="pl-10"
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="phone"
                                                        value={profile.phone}
                                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                                        className="pl-10"
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="location"
                                                    value={profile.location}
                                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                                    className="pl-10"
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="bio">Professional Bio</Label>
                                            <Textarea
                                                id="bio"
                                                value={profile.bio}
                                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                                rows={4}
                                                disabled={!isEditing}
                                                placeholder="Tell us about your professional background and board interests..."
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Experience */}
                            <TabsContent value="experience" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Professional Experience</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="company">Current/Recent Company</Label>
                                                <div className="relative">
                                                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="company"
                                                        value={profile.company}
                                                        onChange={(e) => handleInputChange('company', e.target.value)}
                                                        className="pl-10"
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="experience">Years of Experience</Label>
                                                <Select
                                                    value={profile.experience}
                                                    onValueChange={(value) => handleInputChange('experience', value)}
                                                    disabled={!isEditing}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0-5 years">0-5 years</SelectItem>
                                                        <SelectItem value="5-10 years">5-10 years</SelectItem>
                                                        <SelectItem value="10-15 years">10-15 years</SelectItem>
                                                        <SelectItem value="15+ years">15+ years</SelectItem>
                                                        <SelectItem value="20+ years">20+ years</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Board Experience Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold">Board Experience</h3>
                                                {isEditing && (
                                                    <Button variant="outline" size="sm">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Add Position
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="border rounded-lg p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="font-medium">Non-Executive Director</h4>
                                                            <p className="text-sm text-muted-foreground">TechStartup Ltd • 2020 - Present</p>
                                                            <p className="text-sm mt-2">Oversight of technology strategy and digital transformation initiatives.</p>
                                                        </div>
                                                        {isEditing && (
                                                            <Button variant="ghost" size="sm">
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Skills & Certifications */}
                            <TabsContent value="skills" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Skills & Expertise</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2">
                                                {profile.skills.map((skill, index) => (
                                                    <Badge key={index} variant="secondary" className="text-sm">
                                                        {skill}
                                                        {isEditing && (
                                                            <button
                                                                onClick={() => removeSkill(skill)}
                                                                className="ml-2 text-muted-foreground hover:text-foreground"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </Badge>
                                                ))}
                                            </div>

                                            {isEditing && (
                                                <div className="flex space-x-2">
                                                    <Input
                                                        placeholder="Add a skill..."
                                                        value={newSkill}
                                                        onChange={(e) => setNewSkill(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                                    />
                                                    <Button onClick={addSkill} variant="outline">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Certifications & Qualifications</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {profile.certifications.map((cert, index) => (
                                            <div key={index} className="flex items-center space-x-3">
                                                <Award className="h-5 w-5 text-primary" />
                                                <span>{cert}</span>
                                                {isEditing && (
                                                    <Button variant="ghost" size="sm">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {isEditing && (
                                            <Button variant="outline" size="sm">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Certification
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Preferences */}
                            <TabsContent value="preferences" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Opportunity Preferences</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-base font-medium">Preferred Sectors</Label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {profile.preferences.sectors.map((sector, index) => (
                                                        <Badge key={index} variant="outline">
                                                            {sector}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-base font-medium">Preferred Locations</Label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {profile.preferences.locations.map((location, index) => (
                                                        <Badge key={index} variant="outline">
                                                            {location}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-base font-medium">Role Types</Label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {profile.preferences.roles.map((role, index) => (
                                                        <Badge key={index} variant="outline">
                                                            {role}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Privacy & Notifications</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Email Notifications</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receive emails about new opportunities and updates
                                                </p>
                                            </div>
                                            <Switch
                                                checked={profile.preferences.emailNotifications}
                                                onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                                                disabled={!isEditing}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Profile Visibility</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Allow organizations to find and view your profile
                                                </p>
                                            </div>
                                            <Switch
                                                checked={profile.preferences.profileVisible}
                                                onCheckedChange={(checked) => handlePreferenceChange('profileVisible', checked)}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </motion.div>
            </div>
        </MainLayout>
    )
} 