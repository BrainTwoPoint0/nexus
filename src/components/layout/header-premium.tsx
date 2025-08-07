'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Menu, X, Briefcase, LayoutDashboard, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { UserMenu } from './user-menu';
import { useUserRole } from '@/hooks/use-user-role';
import { simplifiedNavigation } from '@/lib/navigation-config';
import { usePathname } from 'next/navigation';

const iconMap = {
  briefcase: Briefcase,
  'layout-dashboard': LayoutDashboard,
  'plus-circle': PlusCircle,
};

export function HeaderPremium() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const user = useUser();
  const { userProfile } = useUserRole();
  const pathname = usePathname();

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter navigation items based on auth and role
  const navItems = simplifiedNavigation.main.filter((item) => {
    if (item.requiresAuth && !user) return false;
    if (
      item.roles &&
      (!userProfile?.role || !item.roles.includes(userProfile.role))
    )
      return false;
    return true;
  });

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50',
          'border border-primary/5 bg-white/85 backdrop-blur-xl',
          'shadow-lg transition-all duration-300 ease-out',
          scrolled && 'bg-white/95 shadow-xl',
          'dark:border-white/5 dark:bg-primary/85',
          scrolled && 'dark:bg-primary/95'
        )}
        role="banner"
      >
        <nav
          className="mx-auto max-w-7xl px-4 pt-safe-top sm:px-6 lg:px-8"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="bg-gradient-to-br from-primary to-primary/80 bg-clip-text font-['Plus_Jakarta_Sans'] text-3xl font-bold -tracking-wider text-transparent transition-all duration-300 hover:scale-105 hover:brightness-110">
                Nexus
              </h1>
              <Badge variant="secondary" className="inline-flex text-xs">
                Beta
              </Badge>
            </Link>

            {/* Desktop Navigation - Simplified 3 items */}
            <div className="hidden items-center space-x-2 lg:flex">
              {navItems.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      'relative flex items-center space-x-2 rounded-xl px-4 py-2 font-medium transition-all duration-300',
                      'hover:-translate-y-px hover:bg-primary/5',
                      isActive &&
                        'bg-primary/8 font-semibold after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-sm after:bg-gradient-to-r after:from-primary after:to-primary/80'
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-3">
              {user ? (
                <UserMenu />
              ) : (
                <div className="hidden items-center space-x-3 md:flex">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="hover:text-primary-foreground"
                    asChild
                  >
                    <Link href="/sign-up" passHref>
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                id="mobile-menu-button"
                variant="ghost"
                size="sm"
                className="min-h-[48px] min-w-[48px] lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={
                  mobileMenuOpen
                    ? 'Close navigation menu'
                    : 'Open navigation menu'
                }
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">
                  {mobileMenuOpen ? 'Close' : 'Open'} navigation menu
                </span>
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu - Premium Slide-out */}
      <div
        className={cn(
          'fixed top-0 h-screen w-4/5 max-w-sm',
          'border-l border-primary/10 bg-white/95 backdrop-blur-xl',
          'duration-400 z-50 p-6 transition-all ease-out',
          mobileMenuOpen ? 'right-0' : '-right-full'
        )}
        role="menu"
        aria-labelledby="mobile-menu-button"
      >
        <div className="flex h-full flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[48px] min-w-[48px]"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sign in/Sign up buttons at the top for non-authenticated users */}
          {!user && (
            <div className="mb-6 space-y-2 border-b border-border pb-6">
              <Button variant="ghost" size="sm" asChild className="w-full">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="w-full">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto">
            {navItems.map((item, index) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="mobile-nav-item flex items-center space-x-3 rounded-lg p-3 hover:bg-accent"
                  style={{ '--index': index } as React.CSSProperties}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User menu at the bottom for authenticated users */}
          {user && (
            <div className="border-t border-border pt-4">
              <UserMenu />
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
