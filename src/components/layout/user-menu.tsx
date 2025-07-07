'use client';

import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/Button';
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
  CheckCircle,
  AlertCircle,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { useUserRole } from '@/hooks/use-user-role';

export function UserMenu() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { userProfile, navigation } = useUserRole();

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
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              {userProfile?.role === 'platform_admin' && (
                <Crown className="h-3 w-3 text-yellow-500" />
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {userProfile && (
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="px-1 py-0 text-xs">
                  {userProfile.role_display_name}
                </Badge>
                <div className="flex items-center space-x-1">
                  {userProfile.onboarding_completed ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {userProfile.onboarding_completed
                      ? 'Setup Complete'
                      : 'Setup Incomplete'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Dynamic navigation based on role */}
        {navigation.slice(0, 4).map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="flex cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile & Settings</span>
          </Link>
        </DropdownMenuItem>

        {userProfile?.role === 'platform_admin' && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex cursor-pointer">
              <Crown className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </Link>
          </DropdownMenuItem>
        )}

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
