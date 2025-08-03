import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SupabaseProvider } from '@/components/providers/supabase-provider';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Nexus',
    default: 'Nexus - Premier Board Opportunities Platform',
  },
  description:
    'Connect executive talent with board opportunities through intelligent matching and professional development.',
  keywords: [
    'board positions',
    'executive search',
    'board directors',
    'governance',
    'non-executive directors',
  ],
  authors: [{ name: 'Nexus Team' }],
  creator: 'Nexus',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://nexus.app',
    siteName: 'Nexus',
    title: 'Nexus - Premier Board Opportunities Platform',
    description:
      'Connect executive talent with board opportunities through intelligent matching and professional development.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus - Premier Board Opportunities Platform',
    description:
      'Connect executive talent with board opportunities through intelligent matching and professional development.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider>
          {children}
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}
