import { Header } from './header'
import { Footer } from './footer'
import { Toaster } from '@/components/ui/toaster'

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Skip Navigation Link */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[60] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium transition-all duration-200 shadow-lg"
            >
                Skip to main content
            </a>

            {/* Live Region for Accessibility Announcements */}
            <div aria-live="polite" aria-atomic="true" className="sr-only" id="live-region" />

            <Header />
            <main id="main-content" className="flex-1" role="main">
                {children}
            </main>
            <Footer />
            <Toaster />
        </div>
    )
} 