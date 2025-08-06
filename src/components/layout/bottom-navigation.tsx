'use client';

import Link from 'next/link';
import { Home, Briefcase, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useUser } from '@supabase/auth-helpers-react';
import { simplifiedNavigation } from '@/lib/navigation-config';

const iconMap = {
  'home': Home,
  'briefcase': Briefcase,
  'file-text': FileText,
  'user': User,
};

export function BottomNavigation() {
  const pathname = usePathname();
  const user = useUser();

  // Filter mobile navigation items based on auth
  const navItems = simplifiedNavigation.mobile.filter(item => {
    if (item.requiresAuth && !user) return false;
    return true;
  });

  // Don't show on certain pages
  const hiddenPaths = ['/sign-in', '/sign-up', '/onboarding'];
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-primary/10 py-2 pb-safe-bottom z-40 lg:hidden dark:bg-primary/95 dark:border-white/10" aria-label="Mobile navigation">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 min-h-14 transition-all duration-200 active:scale-95",
                isActive && "text-primary"
              )}
            >
              {Icon && <Icon className="h-5 w-5 mb-1" />}
              <span className="text-xs">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}