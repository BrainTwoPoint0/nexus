'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorMessage } from '@/components/ui/error-states';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOAuth } from '@/hooks/use-oauth';

function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const supabase = useSupabaseClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    signInWithOAuth,
    isLoading: oauthLoading,
    error: oauthError,
  } = useOAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    // Basic validation
    const newErrors: string[] = [];
    if (!formData.email) newErrors.push('Email is required');
    if (!formData.password) newErrors.push('Password is required');
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.push('Please enter a valid email address');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // Supabase sign-in
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    }, {
      shouldCreateUser: false,
      // Set session persistence based on remember me checkbox
      // If remember me is checked, session persists across browser sessions
      // If not checked, session only lasts for the current browser session
      persistSession: formData.rememberMe
    });

    if (error) {
      setErrors([error.message]);
      setIsLoading(false);
      return;
    }

    // LinkedIn-style: Everyone goes to unified dashboard
    const redirectPath = searchParams.get('redirect') || '/dashboard';

    // Add a small delay to ensure auth state is properly set
    setTimeout(() => {
      router.push(redirectPath);
    }, 100);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) setErrors([]);
  };

  const handleOAuthSignIn = async () => {
    try {
      await signInWithOAuth('linkedin_oidc');
    } catch (error) {
      console.error('LinkedIn sign-in error:', error);
    }
  };

  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-foreground">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Sign In Form */}
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Messages */}
                {(errors.length > 0 || oauthError) && (
                  <div className="space-y-2">
                    {errors.map((error, index) => (
                      <ErrorMessage key={index} message={error} />
                    ))}
                    {oauthError && <ErrorMessage message={oauthError} />}
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange('password', e.target.value)
                      }
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) =>
                        handleInputChange('rememberMe', checked as boolean)
                      }
                      disabled={isLoading}
                      className="h-4 w-4 min-h-4 min-w-4 flex-shrink-0"
                    />
                    <Label htmlFor="remember" className="text-sm leading-relaxed cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm leading-relaxed text-primary transition-colors hover:text-primary/80 flex-shrink-0 self-center"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || oauthLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Sign In */}
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleOAuthSignIn}
                  disabled={isLoading || oauthLoading}
                  className="w-full"
                >
                  {oauthLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  )}
                  Continue with LinkedIn
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/sign-up"
                className="text-sm leading-relaxed font-medium text-primary transition-colors hover:text-primary/80"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
