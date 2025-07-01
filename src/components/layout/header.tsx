'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import { UserMenu } from './user-menu'

const navigationItems = [
    {
        title: 'For Candidates',
        href: '/candidates',
        description: 'Find board opportunities and advance your career',
        items: [
            { title: 'Browse Opportunities', href: '/opportunities', description: 'Discover board positions across all sectors' },
            { title: 'My Applications', href: '/applications', description: 'Track your application progress' },
            { title: 'Profile', href: '/profile', description: 'Manage your professional profile' },
            { title: 'Learning Center', href: '/learning', description: 'Professional development resources' },
        ],
    },
    {
        title: 'For Organizations',
        href: '/organizations',
        description: 'Find exceptional board talent for your organization',
        items: [
            { title: 'Post a Role', href: '/post-role', description: 'Create a new board position listing' },
            { title: 'Browse Talent', href: '/talent', description: 'Search our curated candidate database' },
            { title: 'Manage Searches', href: '/searches', description: 'Track your active searches' },
            { title: 'Organization Profile', href: '/org-profile', description: 'Manage your organization details' },
        ],
    },
    {
        title: 'Community',
        href: '/community',
        description: 'Connect with fellow board professionals',
        items: [
            { title: 'Events', href: '/events', description: 'Networking events and webinars' },
            { title: 'Resources', href: '/resources', description: 'Governance guides and templates' },
            { title: 'Mentorship', href: '/mentorship', description: 'Connect with experienced board members' },
            { title: 'Discussions', href: '/discussions', description: 'Join professional conversations' },
        ],
    },
]

interface ListItemProps {
    className?: string
    title: string
    children: React.ReactNode
    href: string
}

const ListItem = ({ className, title, children, href, ...props }: ListItemProps) => {
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
    )
}

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const user = useUser()

    return (
        <header className="border-b border-border/20 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/40 sticky top-0 z-50 shadow-sm" role="banner">
            <nav className="page-container" role="navigation" aria-label="Main navigation">
                <div className="flex items-center justify-between py-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold gradient-text">Nexus</h1>
                        <Badge variant="secondary" className="hidden sm:inline-flex">
                            Beta
                        </Badge>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center">
                        <NavigationMenu>
                            <NavigationMenuList>
                                {navigationItems.map((item) => (
                                    <NavigationMenuItem key={item.title}>
                                        <NavigationMenuTrigger className="font-medium bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                            {item.title}
                                        </NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                                {item.items.map((subItem) => (
                                                    <ListItem
                                                        key={subItem.title}
                                                        title={subItem.title}
                                                        href={subItem.href}
                                                    >
                                                        {subItem.description}
                                                    </ListItem>
                                                ))}
                                            </ul>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    {/* Auth Section */}
                    <div className="hidden md:flex items-center space-x-3">
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
                        className="lg:hidden min-h-[44px] min-w-[44px]"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-menu"
                        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        <span className="sr-only">{mobileMenuOpen ? "Close" : "Open"} navigation menu</span>
                    </Button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div id="mobile-menu" className="lg:hidden border-t border-border py-4" role="menu"
                        aria-labelledby="mobile-menu-button">
                        <div className="space-y-4">
                            {navigationItems.map((item) => (
                                <div key={item.title} className="space-y-2">
                                    <h3 className="font-medium text-foreground">{item.title}</h3>
                                    <div className="space-y-1 pl-4">
                                        {item.items.map((subItem) => (
                                            <Link
                                                key={subItem.title}
                                                href={subItem.href}
                                                className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                {subItem.title}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="flex flex-col space-y-2 pt-4 border-t border-border">
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
    )
} 