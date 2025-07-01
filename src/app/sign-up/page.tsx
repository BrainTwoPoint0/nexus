'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingSpinner } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error-states'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function SignUpPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<string[]>([])
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
    })
    const supabase = useSupabaseClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setErrors([])

        // Basic validation
        const newErrors: string[] = []
        if (!formData.firstName) newErrors.push('First name is required')
        if (!formData.lastName) newErrors.push('Last name is required')
        if (!formData.email) newErrors.push('Email is required')
        if (!formData.password) newErrors.push('Password is required')
        if (!formData.confirmPassword) newErrors.push('Please confirm your password')
        if (!formData.agreeToTerms) newErrors.push('You must agree to the Terms of Service')

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.push('Please enter a valid email address')
        }
        if (formData.password && formData.password.length < 8) {
            newErrors.push('Password must be at least 8 characters long')
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.push('Passwords do not match')
        }

        if (newErrors.length > 0) {
            setErrors(newErrors)
            setIsLoading(false)
            return
        }

        // Supabase sign-up
        const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                },
            },
        })

        if (error) {
            setErrors([error.message])
            setIsLoading(false)
            return
        }

        // Redirect to dashboard or show confirmation
        window.location.href = "/dashboard"
    }

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors.length > 0) setErrors([])
    }

    return (
        <MainLayout>
            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md space-y-8"
                >
                    {/* Header */}
                    <div className="text-center">
                        <Link href="/" className="inline-block">
                            <h1 className="text-3xl font-bold gradient-text">Nexus</h1>
                        </Link>
                        <h2 className="mt-6 text-3xl font-bold text-foreground">
                            Join Nexus today
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Connect with board opportunities and executive talent
                        </p>
                    </div>

                    {/* Sign Up Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Create your account</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Error Messages */}
                                {errors.length > 0 && (
                                    <div className="space-y-2">
                                        {errors.map((error, index) => (
                                            <ErrorMessage key={index} message={error} />
                                        ))}
                                    </div>
                                )}

                                {/* Name Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="firstName"
                                                placeholder="First name"
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                className="pl-10"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last name</Label>
                                        <Input
                                            id="lastName"
                                            placeholder="Last name"
                                            value={formData.lastName}
                                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Password Fields */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Create a password"
                                                value={formData.password}
                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                                className="pl-10 pr-10"
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                                disabled={isLoading}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Must be at least 8 characters
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                placeholder="Confirm your password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                                className="pl-10"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Terms Checkbox */}
                                <div className="flex items-start space-x-2">
                                    <Checkbox
                                        id="terms"
                                        checked={formData.agreeToTerms}
                                        onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                                        disabled={isLoading}
                                        className="mt-1"
                                    />
                                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                                        I agree to the{' '}
                                        <Link href="/terms" className="text-primary hover:text-primary/80">
                                            Terms of Service
                                        </Link>{' '}
                                        and{' '}
                                        <Link href="/privacy" className="text-primary hover:text-primary/80">
                                            Privacy Policy
                                        </Link>
                                    </Label>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <LoadingSpinner size="sm" className="mr-2" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Sign In Link */}
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link
                                href="/sign-in"
                                className="font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </MainLayout>
    )
} 