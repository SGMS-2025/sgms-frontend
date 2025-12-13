import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  HeartPulse,
  IdCard,
  Sparkles,
  TrendingUp,
  UserCircle
} from 'lucide-react';

const highlightCards = [
  {
    title: 'Profile',
    value: 'Complete',
    description: 'Profile and health info are up to date',
    icon: UserCircle,
    accent: 'bg-emerald-50 text-emerald-700',
    iconRing: 'bg-emerald-100 text-emerald-600',
    meta: '+100% completeness'
  },
  {
    title: 'Membership',
    value: 'Active',
    description: 'Premium membership • Renew in 12 days',
    icon: IdCard,
    accent: 'bg-orange-50 text-orange-700',
    iconRing: 'bg-orange-100 text-orange-600',
    meta: 'Auto-renew on'
  },
  {
    title: 'Schedule',
    value: '3 Sessions',
    description: '2 PT sessions • 1 class booked',
    icon: CalendarClock,
    accent: 'bg-sky-50 text-sky-700',
    iconRing: 'bg-sky-100 text-sky-600',
    meta: 'Next: Today 6:00 PM'
  },
  {
    title: 'Progress',
    value: '+12%',
    description: 'Weekly performance vs last week',
    icon: TrendingUp,
    accent: 'bg-indigo-50 text-indigo-700',
    iconRing: 'bg-indigo-100 text-indigo-600',
    meta: 'On track'
  }
];

const wellnessMetrics = [
  { label: 'Calories burned', value: '1,240 kcal', progress: 72, icon: Flame, color: 'text-orange-600' },
  { label: 'Training volume', value: '8.4k kg', progress: 64, icon: Dumbbell, color: 'text-emerald-600' },
  { label: 'Active time', value: '4h 20m', progress: 58, icon: Activity, color: 'text-sky-600' },
  { label: 'Recovery score', value: '82 / 100', progress: 82, icon: HeartPulse, color: 'text-indigo-600' }
];

const upcomingSessions = [
  { title: 'Strength PT', time: 'Today · 6:00 PM', coach: 'Coach Linh', location: 'Room B2', tone: 'text-orange-600' },
  {
    title: 'HIIT Class',
    time: 'Tomorrow · 7:30 AM',
    coach: 'Coach Minh',
    location: 'Studio 1',
    tone: 'text-emerald-600'
  },
  {
    title: 'Recovery & Stretch',
    time: 'Thu · 6:45 PM',
    coach: 'Coach Lan',
    location: 'Wellness Zone',
    tone: 'text-indigo-600'
  }
];

const quickActions = [
  { title: 'Book a Session', description: 'Schedule your next workout', icon: CalendarClock },
  { title: 'View Progress', description: 'Track your fitness journey', icon: TrendingUp },
  { title: 'Update Profile', description: 'Keep your data current', icon: UserCircle }
];

const activities = [
  { title: 'Workout completed', time: '2 hours ago', color: 'bg-emerald-500' },
  { title: 'Session booked', time: '1 day ago', color: 'bg-blue-500' },
  { title: 'Membership renewed', time: '1 week ago', color: 'bg-orange-500' }
];

const CustomerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,_#F97316_0,_transparent_35%)]" />
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/80">
              <Sparkles className="h-4 w-4" />
              Personalized for you
            </div>
            <h1 className="text-3xl font-semibold leading-tight">Customer Dashboard</h1>
            <p className="text-white/80">Welcome to your gym management portal. Keep everything in one place.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-white/15 text-white hover:bg-white/20">Premium Access</Badge>
            <Button variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
              View Insights
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlightCards.map((card) => (
          <Card key={card.title} className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
                <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
                <p className="text-xs text-gray-500">{card.description}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.iconRing}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge className={`${card.accent} border-none`}>{card.meta}</Badge>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-gray-200 shadow-sm lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Wellness Snapshot</CardTitle>
              <p className="text-sm text-gray-500">Daily overview of your training and recovery</p>
            </div>
            <Badge variant="outline" className="border-orange-100 bg-orange-50 text-orange-700">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              On track
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {wellnessMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_4px_14px_-6px_rgba(15,23,42,0.25)]"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500">{metric.label}</p>
                    <div className="text-lg font-semibold text-gray-900">{metric.value}</div>
                  </div>
                  <div className={`rounded-full bg-gray-50 p-2 ${metric.color}`}>
                    <metric.icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Progress value={metric.progress} className="h-2 bg-gray-100" />
                  <div className="text-xs text-gray-500">{metric.progress}% of weekly target</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Schedule</CardTitle>
              <p className="text-sm text-gray-500">Stay ahead with your bookings</p>
            </div>
            <Badge variant="secondary" className="bg-orange-50 text-orange-700">
              <Clock3 className="mr-1 h-4 w-4" />3 events
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingSessions.map((session) => (
              <div key={session.title} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{session.title}</p>
                    <p className={`text-xs font-medium ${session.tone}`}>{session.time}</p>
                  </div>
                  <Badge variant="outline" className="border-gray-200 text-gray-700">
                    {session.location}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-gray-500">Coach {session.coach}</p>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-orange-600 hover:bg-orange-50">
              Manage schedule
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-gray-200 shadow-sm lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Badge variant="outline" className="border-gray-200 text-gray-600">
              Updated live
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.title}
                className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
              >
                <span className={`h-2 w-2 rounded-full ${activity.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <Badge variant="secondary" className="bg-gray-50 text-gray-700">
                  Logged
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-gray-500">Shortcuts for frequent tasks</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.title}
                className="group flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <action.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{action.title}</div>
                    <div className="text-sm text-gray-500">{action.description}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-orange-500" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDashboard;
