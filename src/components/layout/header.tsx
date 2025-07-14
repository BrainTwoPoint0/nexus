'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { UserMenu } from './user-menu';
import { useUserRole } from '@/hooks/use-user-role';
import {
  getNavigationForUser,
  canAccessNavItem,
} from '@/lib/navigation-config';

// This component now uses the unified navigation system from navigation-config.ts

interface ListItemProps {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}

const ListItem = ({
  className,
  title,
  children,
  href,
  ...props
}: ListItemProps) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useUser();
  const { userProfile } = useUserRole();

  // Get navigation items based on authentication and role using unified system
  const navigationItems = getNavigationForUser(!!user, userProfile?.role);

  return (
    <header
      className="sticky top-0 z-50 border-b border-border/20 bg-background/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/40"
      role="banner"
    >
      <nav
        className="page-container"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="gradient-text text-2xl font-bold">Nexus</h1>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Beta
            </Badge>
          </Link>

          {/* Desktop Navigation */}
          {navigationItems.length > 0 && (
            <div className="hidden items-center lg:flex">
              <NavigationMenu>
                <NavigationMenuList>
                  {navigationItems.map((item) => (
                    <NavigationMenuItem key={item.title}>
                      <NavigationMenuTrigger className="bg-transparent font-medium hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                          {item.items?.map((subItem) => {
                            // Check if user can access this nav item
                            if (
                              !canAccessNavItem(
                                subItem,
                                !!user,
                                userProfile?.role
                              )
                            ) {
                              return null;
                            }

                            return (
                              <ListItem
                                key={subItem.title}
                                title={subItem.title}
                                href={subItem.href}
                              >
                                {subItem.description}
                              </ListItem>
                            );
                          })}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}

          {/* Auth Section */}
          <div className="hidden items-center space-x-3 md:flex">
            {user ? (
              <UserMenu />
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            id="mobile-menu-button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={
              mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="border-t border-border py-4 lg:hidden"
            role="menu"
            aria-labelledby="mobile-menu-button"
          >
            <div className="space-y-4">
              {navigationItems.map((item) => (
                <div key={item.title} className="space-y-2">
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <div className="space-y-1 pl-4">
                    {item.items?.map((subItem) => {
                      // Check if user can access this nav item
                      if (
                        !canAccessNavItem(subItem, !!user, userProfile?.role)
                      ) {
                        return null;
                      }

                      return (
                        <Link
                          key={subItem.title}
                          href={subItem.href}
                          className="block py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subItem.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex flex-col space-y-2 border-t border-border pt-4">
                {user ? (
                  <UserMenu />
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
