import { HeaderPremium } from './header-premium';
import { BottomNavigation } from './bottom-navigation';
import { Footer } from './footer';
import { Toaster } from '@/components/ui/toaster';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground shadow-lg transition-all duration-200 focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      {/* Live Region for Accessibility Announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="live-region"
      />

      <HeaderPremium />
      <main id="main-content" className="flex-1 pb-20 lg:pb-0" role="main">
        {children}
      </main>
      <Footer />
      <BottomNavigation />
      <Toaster />
    </div>
  );
}
