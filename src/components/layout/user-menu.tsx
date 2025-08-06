'use client';

import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  LayoutDashboard,
  LogOut,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useUserRole } from '@/hooks/use-user-role';
import { getUserQuickActions } from '@/lib/navigation-config';

export function UserMenu() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { userProfile } = useUserRole();

  // Get quick actions for the user based on their role
  const quickActions = getUserQuickActions(userProfile?.role);

  if (!user) return null;

  const displayName = userProfile?.first_name
    ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
    : user.email?.split('@')[0] || 'User';
  const initials =
    userProfile?.first_name?.[0] && userProfile?.last_name?.[0]
      ? userProfile.first_name[0] + userProfile.last_name[0]
      : user.email?.[0]?.toUpperCase() || 'U';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 border-2 border-white/20 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-white/30">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Simplified menu - 4 essential items */}
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
