'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Check,
  X,
  Settings,
  Calendar,
  Users,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Archive,
  Trash2,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

export type NotificationType =
  | 'application_received'
  | 'application_reviewed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_extended'
  | 'offer_accepted'
  | 'offer_declined'
  | 'candidate_withdrew'
  | 'deadline_approaching'
  | 'system_update';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  archived: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  action_label?: string;
  related_entity?: {
    type: 'application' | 'job' | 'candidate' | 'interview';
    id: string;
    name: string;
  };
  metadata?: Record<string, string | number | boolean>;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  application_updates: boolean;
  interview_reminders: boolean;
  deadline_alerts: boolean;
  system_updates: boolean;
  digest_frequency: 'immediate' | 'daily' | 'weekly' | 'none';
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationSystemProps {
  organizationId: string;
}

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    category: string;
  }
> = {
  application_received: {
    icon: Users,
    color: 'text-blue-600',
    category: 'Applications',
  },
  application_reviewed: {
    icon: Eye,
    color: 'text-purple-600',
    category: 'Applications',
  },
  interview_scheduled: {
    icon: Calendar,
    color: 'text-green-600',
    category: 'Interviews',
  },
  interview_completed: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    category: 'Interviews',
  },
  offer_extended: { icon: Star, color: 'text-yellow-600', category: 'Offers' },
  offer_accepted: {
    icon: CheckCircle,
    color: 'text-green-600',
    category: 'Offers',
  },
  offer_declined: { icon: X, color: 'text-red-600', category: 'Offers' },
  candidate_withdrew: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    category: 'Applications',
  },
  deadline_approaching: {
    icon: Clock,
    color: 'text-red-600',
    category: 'Deadlines',
  },
  system_update: { icon: Settings, color: 'text-gray-600', category: 'System' },
};

const PRIORITY_CONFIG: Record<
  NotificationPriority,
  { color: string; label: string }
> = {
  low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
  medium: { color: 'bg-blue-100 text-blue-800', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' },
};

const defaultPreferences: NotificationPreferences = {
  email_notifications: true,
  push_notifications: true,
  application_updates: true,
  interview_reminders: true,
  deadline_alerts: true,
  system_updates: false,
  digest_frequency: 'daily',
  quiet_hours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

export function NotificationSystem({
  organizationId, // eslint-disable-line @typescript-eslint/no-unused-vars
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'archived'>(
    'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Mock notifications - in real app, these would come from API/websocket
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'application_received',
        title: 'New Application Received',
        message: 'John Smith applied for Senior Board Director position',
        priority: 'high',
        read: false,
        archived: false,
        created_at: new Date().toISOString(),
        action_url: '/applications/123',
        action_label: 'Review Application',
        related_entity: {
          type: 'application',
          id: '123',
          name: 'John Smith - Senior Board Director',
        },
      },
      {
        id: '2',
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: 'Interview with Jane Doe scheduled for tomorrow at 2:00 PM',
        priority: 'medium',
        read: false,
        archived: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        action_url: '/interviews/456',
        action_label: 'View Interview',
        related_entity: {
          type: 'interview',
          id: '456',
          name: 'Jane Doe - Interview',
        },
      },
      {
        id: '3',
        type: 'deadline_approaching',
        title: 'Application Deadline Approaching',
        message: 'CFO position applications close in 3 days',
        priority: 'urgent',
        read: true,
        archived: false,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        action_url: '/jobs/789',
        action_label: 'View Job',
        related_entity: {
          type: 'job',
          id: '789',
          name: 'CFO Position',
        },
      },
      {
        id: '4',
        type: 'offer_accepted',
        title: 'Offer Accepted!',
        message:
          'Michael Brown accepted the offer for Non-Executive Director role',
        priority: 'high',
        read: false,
        archived: false,
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        action_url: '/applications/321',
        action_label: 'View Details',
        related_entity: {
          type: 'application',
          id: '321',
          name: 'Michael Brown - Non-Executive Director',
        },
      },
      {
        id: '5',
        type: 'system_update',
        title: 'System Maintenance',
        message: 'Scheduled maintenance this Sunday from 2-4 AM',
        priority: 'low',
        read: true,
        archived: false,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAsUnread = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: false } : n))
    );
  };

  const archiveNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, archived: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesStatus =
      filter === 'all' ||
      (filter === 'unread' && !notification.read) ||
      (filter === 'read' && notification.read) ||
      (filter === 'archived' && notification.archived);

    const matchesCategory =
      categoryFilter === 'all' ||
      NOTIFICATION_CONFIG[notification.type].category === categoryFilter;

    return (
      matchesStatus &&
      matchesCategory &&
      (filter !== 'archived' ? !notification.archived : true)
    );
  });

  const unreadCount = notifications.filter(
    (n) => !n.read && !n.archived
  ).length;
  const categories = Array.from(
    new Set(Object.values(NOTIFICATION_CONFIG).map((config) => config.category))
  );

  const NotificationCard = ({
    notification,
  }: {
    notification: Notification;
  }) => {
    const config = NOTIFICATION_CONFIG[notification.type];
    const priorityConfig = PRIORITY_CONFIG[notification.priority];
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={`cursor-pointer transition-shadow hover:shadow-md ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 ${config.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center space-x-2">
                    <h3 className="text-sm font-semibold">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                    <Badge className={priorityConfig.color} variant="outline">
                      {priorityConfig.label}
                    </Badge>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{formatDate(notification.created_at)}</span>
                    <span>•</span>
                    <span>{config.category}</span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.read ? (
                    <DropdownMenuItem
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Mark as Read
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => markAsUnread(notification.id)}
                    >
                      <EyeOff className="mr-2 h-4 w-4" />
                      Mark as Unread
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => archiveNotification(notification.id)}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          {(notification.action_url || notification.related_entity) && (
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                {notification.related_entity && (
                  <div className="text-xs text-muted-foreground">
                    Related: {notification.related_entity.name}
                  </div>
                )}
                {notification.action_url && (
                  <Button variant="outline" size="sm">
                    {notification.action_label || 'View Details'}
                  </Button>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    );
  };

  const NotificationSettings = () => (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      email_notifications: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive browser push notifications
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={preferences.push_notifications}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      push_notifications: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="application-updates">
                    Application Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    New applications and status changes
                  </p>
                </div>
                <Switch
                  id="application-updates"
                  checked={preferences.application_updates}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      application_updates: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="interview-reminders">
                    Interview Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Upcoming interview notifications
                  </p>
                </div>
                <Switch
                  id="interview-reminders"
                  checked={preferences.interview_reminders}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      interview_reminders: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="deadline-alerts">Deadline Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Application and job posting deadlines
                  </p>
                </div>
                <Switch
                  id="deadline-alerts"
                  checked={preferences.deadline_alerts}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      deadline_alerts: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="system-updates">System Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Maintenance and feature announcements
                  </p>
                </div>
                <Switch
                  id="system-updates"
                  checked={preferences.system_updates}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      system_updates: checked,
                    }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="digest-frequency">Digest Frequency</Label>
                <p className="mb-2 text-sm text-muted-foreground">
                  How often to receive summary emails
                </p>
                <select
                  id="digest-frequency"
                  value={preferences.digest_frequency}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      digest_frequency: e.target.value as 'immediate' | 'daily' | 'weekly' | 'none',
                    }))
                  }
                  className="w-full rounded border p-2"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="quiet-hours"
                    checked={preferences.quiet_hours.enabled}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        quiet_hours: { ...prev.quiet_hours, enabled: checked },
                      }))
                    }
                  />
                  <Label htmlFor="quiet-hours">Quiet Hours</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Don&apos;t send notifications during these hours
                </p>

                {preferences.quiet_hours.enabled && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={preferences.quiet_hours.start}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          quiet_hours: {
                            ...prev.quiet_hours,
                            start: e.target.value,
                          },
                        }))
                      }
                      className="rounded border p-2"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={preferences.quiet_hours.end}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          quiet_hours: {
                            ...prev.quiet_hours,
                            end: e.target.value,
                          },
                        }))
                      }
                      className="rounded border p-2"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setSettingsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Save preferences
              console.log('Saving preferences:', preferences);
              setSettingsOpen(false);
            }}
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-muted-foreground">
              Stay updated on your hiring activities
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-2 py-1">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({notifications.filter((n) => !n.archived).length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('read')}
          >
            Read ({notifications.filter((n) => n.read && !n.archived).length})
          </Button>
          <Button
            variant={filter === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('archived')}
          >
            Archived ({notifications.filter((n) => n.archived).length})
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded border px-3 py-1 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-semibold">No notifications</h3>
                <p className="text-muted-foreground">
                  {filter === 'all'
                    ? "You don&apos;t have any notifications yet."
                    : `No ${filter} notifications found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <NotificationSettings />
    </div>
  );
}
