import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const footerLinks = {
  platform: {
    title: 'Platform',
    links: [
      { name: 'For Candidates', href: '/candidates' },
      { name: 'For Organizations', href: '/organizations' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Pricing', href: '/pricing' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { name: 'Learning Center', href: '/learning' },
      { name: 'Blog', href: '/blog' },
      { name: 'Events', href: '/events' },
      { name: 'Help Center', href: '/help' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
      { name: 'Contact', href: '/contact' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'GDPR', href: '/gdpr' },
    ],
  },
};

export function Footer() {
  return (
    <footer
      className="border-t border-border bg-secondary/30"
      role="contentinfo"
    >
      <div className="page-container">
        <div className="py-12">
          <div className="mx-auto max-w-4xl">
            {/* Company Info */}
            <div className="mb-8 lg:mb-12">
              <div className="max-w-2xl">
                <Link href="/" className="mb-4 flex items-center space-x-2">
                  <h3 className="gradient-text text-xl font-bold">Nexus</h3>
                </Link>
                <p className="text-sm text-muted-foreground">
                  The premier platform connecting executive talent with board
                  opportunities through intelligent matching and professional
                  development.
                </p>
              </div>
            </div>

            {/* Footer Links - 2 columns on mobile, 4 on larger screens */}
            <div className="grid grid-cols-2 gap-8 gap-y-8 md:grid-cols-4">
              {Object.values(footerLinks).map((section) => (
                <div key={section.title} className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">
                    {section.title}
                  </h4>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Separator className="my-8" />

            <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
              <div className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Nexus. All rights reserved.
              </div>
              <div className="flex items-center space-x-6">
                <Link
                  href="/accessibility"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Accessibility
                </Link>
                <Link
                  href="/security"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Security
                </Link>
                <Link
                  href="/status"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Status
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
