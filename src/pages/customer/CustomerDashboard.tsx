import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Dumbbell,
  HeartPulse,
  IdCard,
  Sparkles,
  TrendingUp,
  UserCircle
} from 'lucide-react';
import { useAuthState } from '@/hooks/useAuth';
import { userApi } from '@/services/api/userApi';
import { useCustomerMembershipContract } from '@/hooks/useCustomerMembershipContract';
import { useCustomerClassSchedule } from '@/hooks/useCustomerClassSchedule';
import { useProgressStats } from '@/hooks/useCustomerTrainingProgress';
import { useTrainingProgress } from '@/hooks/useTrainingProgress';
import { useCustomerGoal } from '@/hooks/useCustomerGoal';
import { calculateRemainingDays } from '@/utils/membership';
import { format } from 'date-fns';
import type { MembershipContract } from '@/types/api/Membership';

// quickActions will be defined inside component to use translation

const CustomerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthState();

  // Quick actions with translation
  const quickActions = useMemo(
    () => [
      {
        title: t('customer.dashboard.view_my_classes', 'View My Classes'),
        description: t('customer.dashboard.view_my_classes_desc', 'View your class schedule'),
        icon: CalendarClock,
        path: '/customer/my-classes'
      },
      {
        title: t('customer.dashboard.view_progress', 'View Progress'),
        description: t('customer.dashboard.view_progress_desc', 'Track your fitness journey'),
        icon: TrendingUp,
        path: '/customer/progress'
      },
      {
        title: t('customer.dashboard.update_profile_action', 'Update Profile'),
        description: t('customer.dashboard.update_profile_desc', 'Keep your data current'),
        icon: UserCircle,
        path: '/customer/profile'
      }
    ],
    [t]
  );

  // Get branch ID from user
  const branchId = useMemo(() => {
    if (!user?.customer?.branchId) return undefined;
    const branchField = user.customer.branchId;
    if (Array.isArray(branchField)) {
      const first = branchField[0];
      if (!first) return undefined;
      return typeof first === 'object' && first !== null && '_id' in first
        ? (first as { _id: string })._id
        : (first as string);
    }
    return typeof branchField === 'object' && branchField !== null && '_id' in branchField
      ? (branchField as { _id: string })._id
      : (branchField as string);
  }, [user?.customer?.branchId]);

  // Fetch user profile for completion calculation
  interface UserProfile {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: string;
    bio?: string;
  }
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch membership contract
  const { contract: membershipContract, loading: membershipLoading } = useCustomerMembershipContract({
    branchId: branchId as string,
    enabled: Boolean(branchId)
  });

  // Fetch class schedule (next 7 days)
  const scheduleStartDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }, []);

  const scheduleEndDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  }, []);

  const { data: classScheduleData, isLoading: scheduleLoading } = useCustomerClassSchedule({
    startDate: scheduleStartDate,
    endDate: scheduleEndDate,
    enabled: true
  });

  // Get customer ID for progress list
  const customerId = useMemo(() => {
    if (!user?.customer?._id && !user?.customerId) return '';
    return (user.customer?._id || user.customerId) as string;
  }, [user?.customer?._id, user?.customerId]);

  // Fetch progress stats for sessions info (sessionsDone, sessionsTotal)
  const { stats: progressStats, loading: progressStatsLoading } = useProgressStats('all', 'all');

  // Fetch progress list to get latest progress (including initial) if stats don't have data
  const { progressList, getCustomerStats } = useTrainingProgress({
    customerId,
    limit: 10,
    sortBy: 'trackingDate',
    sortOrder: 'desc'
  });

  // Fetch customer stats (same as CustomerProgress page) to get currentWeight/currentBMI
  const [customerStats, setCustomerStats] = useState<{
    currentWeight: number | null;
    currentBMI: number | null;
    currentStrengthScore: number | null;
  } | null>(null);
  const [customerStatsLoading, setCustomerStatsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      if (!customerId) {
        setCustomerStats(null);
        return;
      }

      setCustomerStatsLoading(true);
      try {
        const res = await getCustomerStats(customerId, { days: 30 });
        if (!cancelled && res.success && res.data) {
          setCustomerStats({
            currentWeight: res.data.currentWeight ?? null,
            currentBMI: res.data.currentBMI ?? null,
            currentStrengthScore: res.data.currentStrengthScore ?? null
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load customer stats:', err);
        }
      } finally {
        if (!cancelled) {
          setCustomerStatsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [customerId, getCustomerStats]);

  // Fetch active goal to calculate progress based on actual goal targets
  const { activeGoal } = useCustomerGoal(customerId || undefined);

  // Calculate profile completion
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?._id) {
        setProfileLoading(false);
        return;
      }
      try {
        setProfileLoading(true);
        const response = await userApi.getProfile();
        if (response.success && response.data) {
          setUserProfile(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user?._id]);

  // Calculate profile completion percentage
  const profileCompletion = useMemo(() => {
    if (!userProfile) return 0;
    const fields = [
      userProfile.fullName,
      userProfile.phoneNumber,
      userProfile.address,
      userProfile.dateOfBirth,
      userProfile.gender,
      userProfile.bio
    ];
    const completedFields = fields.filter((field) => field && field.toString().trim()).length;
    return Math.round((completedFields / fields.length) * 100);
  }, [userProfile]);

  // Process upcoming sessions from class schedule
  const upcomingSessions = useMemo(() => {
    // Define interface for class schedule item
    interface ClassScheduleItem {
      scheduleDate?: string;
      date?: string;
      startTime?: string;
      className?: string;
      trainers?: Array<{ name?: string; fullName?: string }>;
      branch?: { branchName?: string; name?: string; address?: string } | string;
      branchName?: string;
      location?: string;
    }

    // API returns array directly or wrapped in data property
    let scheduleArray: ClassScheduleItem[] = [];
    if (Array.isArray(classScheduleData)) {
      scheduleArray = classScheduleData as ClassScheduleItem[];
    } else if (classScheduleData && typeof classScheduleData === 'object' && 'data' in classScheduleData) {
      scheduleArray = Array.isArray(classScheduleData.data) ? (classScheduleData.data as ClassScheduleItem[]) : [];
    }

    // Debug: log để kiểm tra dữ liệu
    if (process.env.NODE_ENV === 'development' && scheduleArray.length > 0) {
      console.log('Class schedule data:', scheduleArray);
      console.log('First item structure:', scheduleArray[0]);
      console.log('First item branch:', scheduleArray[0]?.branch);
      console.log('First item location:', scheduleArray[0]?.location);
    }

    if (scheduleArray.length === 0) return [];

    const now = new Date();
    const sessions: Array<{
      title: string;
      time: string;
      coach: string;
      location: string;
      tone: string;
      date: Date;
    }> = [];

    scheduleArray.forEach((item: ClassScheduleItem) => {
      // API returns scheduleDate, not date
      const scheduleDateStr = item.scheduleDate || item.date;
      if (!scheduleDateStr || !item.className) return;

      // Use startTime if available, otherwise use scheduleDate
      const sessionDateTime = item.startTime ? new Date(item.startTime) : new Date(scheduleDateStr);

      if (sessionDateTime < now) return; // Only future sessions

      const trainers = item.trainers || [];
      const trainerNames =
        trainers
          .map((t: { name?: string; fullName?: string }) => {
            // API returns name, not fullName
            return t.name || t.fullName || 'Coach';
          })
          .join(', ') || 'Coach';

      // API returns location directly, or branch object
      // Priority: branchName > class location > branch address > "Studio"
      let location = 'Studio';

      // PT Schedule: branch object is formatted with { name: branchName, address: location }
      // Class Schedule: branch object is populated with 'name address' but branch model has 'branchName'
      // So class.branch will have { _id, address } but NOT 'name' or 'branchName'
      if (item.branch) {
        const branch = item.branch;
        if (typeof branch === 'object' && branch !== null) {
          // For PT: branch.name exists (mapped from branchName in backend)
          // For Class: branch.name doesn't exist, branch only has address
          // Try all possible field names
          location = branch.branchName || branch.name || branch.address || item.location || 'Studio';
        } else {
          // Branch might be just an ID string
          location = item.location || 'Studio';
        }
      } else if (item.branchName) {
        location = item.branchName;
      }
      // Then try class location (e.g., "Studio A", "Room B2")
      // Only use if it's not empty and not too long (likely an address)
      else if (item.location && item.location.trim() !== '' && item.location.length < 50) {
        location = item.location;
      }
      // If still no location, use "Studio" as fallback

      // Truncate location if too long (for badge display)
      // But don't truncate if it's a short name like "Studio A"
      if (location.length > 25) {
        location = location.substring(0, 22) + '...';
      }

      sessions.push({
        title: item.className || 'Class',
        time: format(sessionDateTime, 'EEE · h:mm a'),
        coach: trainerNames,
        location,
        tone: 'text-sky-600',
        date: sessionDateTime
      });
    });

    // Sort by date and take first 3
    return sessions.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 3);
  }, [classScheduleData]);

  // Get membership plan name
  const membershipPlanName = useMemo(() => {
    if (!membershipContract) return null;

    // Try to get name from membershipPlanSnapshot (if exists)
    const contractWithSnapshot = membershipContract as MembershipContract & {
      membershipPlanSnapshot?: { name?: string };
      membershipPlanId?: { name?: string } | string;
    };

    // First try snapshot (if contract was created with snapshot)
    if (contractWithSnapshot.membershipPlanSnapshot?.name) {
      return contractWithSnapshot.membershipPlanSnapshot.name;
    }

    // Then try populated membershipPlanId (if backend populated it)
    const planId = contractWithSnapshot.membershipPlanId;
    if (planId && typeof planId === 'object' && planId !== null && 'name' in planId) {
      const planObj = planId as { name?: string };
      if (planObj.name) {
        return planObj.name;
      }
    }

    // Fallback - will be translated in membershipInfo
    return null;
  }, [membershipContract]);

  // Calculate membership info
  const membershipInfo = useMemo(() => {
    if (!membershipContract) {
      return {
        status: t('customer.dashboard.no_membership', 'No Membership'),
        description: t('customer.dashboard.no_active_membership', 'No active membership'),
        daysRemaining: null,
        meta: t('customer.dashboard.get_started', 'Get started')
      };
    }

    const daysRemaining = membershipContract.endDate ? calculateRemainingDays(membershipContract.endDate) : null;

    const status =
      membershipContract.status === 'ACTIVE' ? t('customer.dashboard.active', 'Active') : membershipContract.status;
    const planName = membershipPlanName || t('customer.dashboard.membership', 'Membership');

    return {
      status,
      description:
        daysRemaining !== null && daysRemaining > 0
          ? `${planName} • ${daysRemaining} ${t('customer.dashboard.days_remaining', 'days remaining')}`
          : planName,
      daysRemaining,
      meta:
        daysRemaining !== null && daysRemaining <= 10
          ? t('customer.dashboard.renew_soon', 'Renew soon')
          : t('customer.dashboard.active', 'Active')
    };
  }, [membershipContract, membershipPlanName, t]);

  // Calculate schedule summary
  const scheduleSummary = useMemo(() => {
    const totalSessions = upcomingSessions.length;
    if (totalSessions === 0) {
      return {
        count: t('customer.dashboard.no_sessions', '0 Sessions'),
        description: t('customer.dashboard.no_upcoming_sessions', 'No upcoming sessions'),
        nextSession: null,
        meta: t('customer.dashboard.book_now', 'Book now')
      };
    }

    const nextSession = upcomingSessions[0];
    const nextSessionTime = nextSession ? format(nextSession.date, 'EEE · h:mm a') : null;

    const sessionLabel =
      totalSessions > 1 ? t('customer.dashboard.sessions', 'Sessions') : t('customer.dashboard.session', 'Session');
    const upcomingLabel =
      totalSessions > 1
        ? t('customer.dashboard.upcoming_sessions', 'upcoming sessions')
        : t('customer.dashboard.upcoming_session', 'upcoming session');

    return {
      count: `${totalSessions} ${sessionLabel}`,
      description: `${totalSessions} ${upcomingLabel}`,
      nextSession: nextSessionTime,
      meta: nextSessionTime || t('customer.dashboard.view_schedule', 'View schedule')
    };
  }, [upcomingSessions, t]);

  // Calculate progress info from stats
  const progressInfo = useMemo(() => {
    if (!progressStats) {
      return {
        value: t('customer.dashboard.n_a', 'N/A'),
        description: t('customer.dashboard.no_progress_data', 'No progress data available'),
        meta: t('customer.dashboard.start_tracking', 'Start tracking')
      };
    }

    // Use sessionsDone and sessionsTotal from TrainingProgressStats
    const sessionsDone = progressStats.sessionsDone || 0;
    const sessionsTotal = progressStats.sessionsTotal || 0;

    return {
      value: `${sessionsDone} ${t('customer.dashboard.sessions', 'Sessions')}`,
      description: `${sessionsDone} ${t('customer.dashboard.sessions_completed', 'of')} ${sessionsTotal} ${t('customer.dashboard.completion', 'completed')}`,
      meta: t('customer.dashboard.on_track', 'On track')
    };
  }, [progressStats, t]);

  // Build highlight cards with real data
  const highlightCards = useMemo(
    () => [
      {
        title: t('customer.dashboard.profile', 'Profile'),
        value: `${profileCompletion}%`,
        description:
          profileCompletion === 100
            ? t('customer.dashboard.profile_complete', 'Profile and health info are up to date')
            : `${100 - profileCompletion}% ${t('customer.dashboard.profile_incomplete', 'incomplete')}`,
        icon: UserCircle,
        accent: profileCompletion === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
        iconRing: profileCompletion === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600',
        meta:
          profileCompletion === 100
            ? t('customer.dashboard.complete', 'Complete')
            : t('customer.dashboard.update_profile', 'Update profile'),
        path: '/customer/profile'
      },
      {
        title: t('customer.dashboard.membership', 'Membership'),
        value: membershipInfo.status,
        description: membershipInfo.description,
        icon: IdCard,
        accent: membershipContract ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-700',
        iconRing: membershipContract ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600',
        meta: membershipInfo.meta,
        path: '/customer/membership'
      },
      {
        title: t('customer.dashboard.schedule', 'Schedule'),
        value: scheduleSummary.count,
        description: scheduleSummary.description,
        icon: CalendarClock,
        accent: 'bg-sky-50 text-sky-700',
        iconRing: 'bg-sky-100 text-sky-600',
        meta: scheduleSummary.meta,
        path: '/customer/my-classes'
      },
      {
        title: t('customer.dashboard.progress', 'Progress'),
        value: progressInfo.value,
        description: progressInfo.description,
        icon: TrendingUp,
        accent: 'bg-indigo-50 text-indigo-700',
        iconRing: 'bg-indigo-100 text-indigo-600',
        meta: progressInfo.meta,
        path: '/customer/progress'
      }
    ],
    [profileCompletion, membershipInfo, scheduleSummary, progressInfo, membershipContract, t]
  );

  // Wellness metrics - health-focused metrics instead of sessions
  const wellnessMetrics = useMemo(() => {
    // Get latest progress from progressList if stats don't have data
    const latestProgress = progressList && progressList.length > 0 ? progressList[0] : null;

    // Use customerStats (currentWeight/currentBMI) - same as CustomerProgress page
    // This ensures both pages show the same data
    let currentWeight: number | null = null;
    let currentBMI: number | null = null;

    // First try customerStats (latest values, same as CustomerProgress page)
    if (customerStats) {
      currentWeight = customerStats.currentWeight ?? null;
      currentBMI = customerStats.currentBMI ?? null;
    }

    // If no data from customerStats, fallback to latest progress from progressList
    if (currentWeight == null && currentBMI == null && latestProgress) {
      currentWeight = latestProgress.weight ?? null;
      currentBMI = latestProgress.bmi ?? null;
    }

    if (!currentWeight && !currentBMI) {
      return [
        {
          label: t('customer.dashboard.current_weight', 'Current Weight'),
          value: t('customer.dashboard.no_data', 'N/A'),
          progress: 0,
          icon: Dumbbell,
          color: 'text-emerald-600'
        },
        {
          label: t('customer.dashboard.bmi', 'BMI'),
          value: t('customer.dashboard.no_data', 'N/A'),
          progress: 0,
          icon: Activity,
          color: 'text-sky-600'
        },
        {
          label: t('customer.dashboard.weight_change', 'Weight Change'),
          value: t('customer.dashboard.no_data', 'N/A'),
          progress: 0,
          icon: TrendingUp,
          color: 'text-orange-600'
        },
        {
          label: t('customer.dashboard.health_status', 'Health Status'),
          value: t('customer.dashboard.tracking', 'Not Tracking'),
          progress: 0,
          icon: HeartPulse,
          color: 'text-indigo-600'
        }
      ];
    }

    // Calculate weight change from baseline (initial) to current weight
    // Get baseline (initial) progress from progressList (the oldest one, which is usually the initial)
    const baselineProgress = progressList && progressList.length > 0 ? progressList[progressList.length - 1] : null;
    const baselineWeight = baselineProgress?.weight ?? null;

    let weightChange: number | null = null;
    // Calculate change from baseline to current (not from min to max)
    if (currentWeight != null && baselineWeight != null) {
      weightChange = currentWeight - baselineWeight;
      // Only show if there's a meaningful change (more than 0.1kg difference)
      if (Math.abs(weightChange) < 0.1) {
        weightChange = null;
      }
    }

    // Calculate BMI status (normal range: 18.5-24.9)
    const getBMIStatus = (bmi: number | null) => {
      if (!bmi) return t('customer.dashboard.tracking', 'Not Tracking');
      if (bmi < 18.5) return t('customer.dashboard.underweight', 'Underweight');
      if (bmi <= 24.9) return t('customer.dashboard.normal', 'Normal');
      if (bmi <= 29.9) return t('customer.dashboard.overweight', 'Overweight');
      return t('customer.dashboard.obese', 'Obese');
    };

    // Calculate progress percentages based on actual goal targets (not arbitrary values)
    // If no goal or no actual progress (only initial), progress = 0%
    let weightProgress = 0;
    let bmiProgress = 0;
    let changeProgress = 0;

    const baselineBMI = baselineProgress?.bmi ?? null;

    // Only calculate progress if we have a goal and actual progress (not just initial)
    if (activeGoal && currentWeight != null && baselineWeight != null) {
      // Check if current weight is different from baseline (has actual progress)
      const hasActualProgress = Math.abs(currentWeight - baselineWeight) > 0.01;

      if (hasActualProgress && activeGoal.targets?.weight != null) {
        // Weight goal: calculate progress from initial to target
        const targetWeight = activeGoal.targets.weight;
        const totalChange = Math.abs(targetWeight - baselineWeight);
        if (totalChange > 0) {
          const currentChange = currentWeight - baselineWeight;
          const targetDirection = targetWeight - baselineWeight; // Positive = tăng cân, Negative = giảm cân

          // Check if moving in the right direction (towards target)
          const isMovingTowardsTarget =
            (targetDirection > 0 && currentChange > 0) || // Tăng cân: cả target và current đều tăng
            (targetDirection < 0 && currentChange < 0); // Giảm cân: cả target và current đều giảm

          if (isMovingTowardsTarget) {
            // Moving towards target: positive progress
            weightProgress = Math.min(100, Math.max(0, (Math.abs(currentChange) / totalChange) * 100));
          } else {
            // Moving away from target: negative progress
            weightProgress = -Math.min(100, (Math.abs(currentChange) / totalChange) * 100);
          }
        }
      }
    }

    if (activeGoal && currentBMI != null && baselineBMI != null) {
      // Check if current BMI is different from baseline (has actual progress)
      const hasActualProgress = Math.abs(currentBMI - baselineBMI) > 0.01;

      if (hasActualProgress && activeGoal.targets?.bmi != null) {
        // BMI goal: calculate progress from initial to target
        const targetBMI = activeGoal.targets.bmi;
        const totalChange = Math.abs(targetBMI - baselineBMI);
        if (totalChange > 0) {
          const currentChange = currentBMI - baselineBMI;
          const targetDirection = targetBMI - baselineBMI; // Positive = tăng BMI, Negative = giảm BMI

          // Check if moving in the right direction (towards target)
          const isMovingTowardsTarget =
            (targetDirection > 0 && currentChange > 0) || // Tăng BMI: cả target và current đều tăng
            (targetDirection < 0 && currentChange < 0); // Giảm BMI: cả target và current đều giảm

          if (isMovingTowardsTarget) {
            // Moving towards target: positive progress
            bmiProgress = Math.min(100, Math.max(0, (Math.abs(currentChange) / totalChange) * 100));
          } else {
            // Moving away from target: negative progress
            bmiProgress = -Math.min(100, (Math.abs(currentChange) / totalChange) * 100);
          }
        }
      }
    }

    // Weight change progress: only if we have actual change
    if (weightChange != null && Math.abs(weightChange) > 0.1) {
      // If there's a weight goal, calculate based on goal
      if (activeGoal?.targets?.weight != null && baselineWeight != null) {
        const targetWeight = activeGoal.targets.weight;
        const targetChange = Math.abs(targetWeight - baselineWeight);
        if (targetChange > 0) {
          const targetDirection = targetWeight - baselineWeight; // Positive = tăng cân, Negative = giảm cân

          // Check if moving in the right direction (towards target)
          const isMovingTowardsTarget =
            (targetDirection > 0 && weightChange > 0) || // Tăng cân: cả target và change đều dương
            (targetDirection < 0 && weightChange < 0); // Giảm cân: cả target và change đều âm

          if (isMovingTowardsTarget) {
            // Moving towards target: positive progress
            changeProgress = Math.min(100, Math.max(0, (Math.abs(weightChange) / targetChange) * 100));
          } else {
            // Moving away from target: negative progress
            changeProgress = -Math.min(100, (Math.abs(weightChange) / targetChange) * 100);
          }
        }
      } else {
        // Otherwise, use a reasonable scale (0-10kg = 0-100%)
        // Without goal, we can't determine direction, so always positive
        changeProgress = Math.min(100, (Math.abs(weightChange) / 10) * 100);
      }
    }

    return [
      {
        label: t('customer.dashboard.current_weight', 'Current Weight'),
        value: currentWeight ? `${currentWeight.toFixed(1)} kg` : t('customer.dashboard.no_data', 'N/A'),
        progress: weightProgress,
        icon: Dumbbell,
        color: 'text-emerald-600'
      },
      {
        label: t('customer.dashboard.bmi', 'BMI'),
        value: currentBMI ? `${currentBMI.toFixed(1)}` : t('customer.dashboard.no_data', 'N/A'),
        progress: bmiProgress,
        icon: Activity,
        color: 'text-sky-600'
      },
      {
        label: t('customer.dashboard.weight_change', 'Weight Change'),
        value:
          weightChange !== null
            ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`
            : t('customer.dashboard.no_data', 'N/A'),
        progress: changeProgress,
        icon: TrendingUp,
        color: 'text-orange-600'
      },
      {
        label: t('customer.dashboard.health_status', 'Health Status'),
        value: getBMIStatus(currentBMI),
        progress: (() => {
          // Health Status progress: only calculate if we have goal and actual progress
          if (!activeGoal || !currentBMI || !baselineBMI) return 0;

          // Check if we have actual progress (not just initial)
          const hasActualProgress = Math.abs(currentBMI - baselineBMI) > 0.01;
          if (!hasActualProgress) return 0;

          // If there's a BMI goal, calculate based on goal
          if (activeGoal.targets?.bmi != null) {
            const targetBMI = activeGoal.targets.bmi;
            const totalChange = Math.abs(targetBMI - baselineBMI);
            if (totalChange > 0) {
              const currentChange = Math.abs(currentBMI - baselineBMI);
              return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
            }
          }

          // If no BMI goal, return 0% (can't calculate progress without goal)
          return 0;
        })(),
        icon: HeartPulse,
        color: 'text-indigo-600'
      }
    ];
  }, [customerStats, progressList, activeGoal, customerId, t]);

  const isLoading =
    authLoading ||
    profileLoading ||
    membershipLoading ||
    scheduleLoading ||
    progressStatsLoading ||
    customerStatsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] p-6 text-white shadow-lg">
          <Skeleton className="h-32 w-full bg-white/10" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-gray-200 shadow-sm">
              <CardHeader>
                <Skeleton className="h-20 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,_#F97316_0,_transparent_35%)]" />
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/80">
              <Sparkles className="h-4 w-4" />
              {t('customer.dashboard.personalized', { defaultValue: 'Personalized for you' })}
            </div>
            <h1 className="text-3xl font-semibold leading-tight">
              {t('customer.dashboard.title', { defaultValue: 'Customer Dashboard' })}
            </h1>
            <p className="text-white/80">
              {t('customer.dashboard.welcome', {
                defaultValue: 'Welcome to your gym management portal. Keep everything in one place.'
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {membershipContract && membershipPlanName && (
              <Badge className="bg-white/15 text-white hover:bg-white/20">{membershipPlanName}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlightCards.map((card) => (
          <Card
            key={card.title}
            className="group border-gray-200 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-gray-300"
            onClick={() => card.path && navigate(card.path)}
          >
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
              <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-gray-600" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-gray-200 shadow-sm lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>{t('customer.dashboard.wellness_snapshot', { defaultValue: 'Wellness Snapshot' })}</CardTitle>
              <p className="text-sm text-gray-500">
                {t('customer.dashboard.daily_overview', {
                  defaultValue: 'Daily overview of your training and recovery'
                })}
              </p>
            </div>
            <Badge variant="outline" className="border-orange-100 bg-orange-50 text-orange-700">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {t('customer.dashboard.on_track', { defaultValue: 'On track' })}
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
                  <Progress value={Math.max(0, metric.progress)} className="h-2 bg-gray-100" />
                  <div className="text-xs text-gray-500">
                    {metric.progress < 0 ? '-' : ''}
                    {Math.round(Math.abs(metric.progress) * 10) / 10}%{' '}
                    {t('customer.dashboard.of_target', { defaultValue: 'of target' })}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>{t('customer.dashboard.upcoming_schedule', { defaultValue: 'Upcoming Schedule' })}</CardTitle>
              <p className="text-sm text-gray-500">
                {t('customer.dashboard.stay_ahead', { defaultValue: 'Stay ahead with your bookings' })}
              </p>
            </div>
            <Badge variant="secondary" className="bg-orange-50 text-orange-700">
              <Clock3 className="mr-1 h-4 w-4" />
              {upcomingSessions.length} {t('customer.dashboard.events', { defaultValue: 'events' })}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingSessions.length > 0 ? (
              <>
                {upcomingSessions.map((session, index) => (
                  <div
                    key={`${session.title}-${index}`}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{session.title}</p>
                        <p className={`text-xs font-medium ${session.tone}`}>{session.time}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-gray-200 text-gray-700 whitespace-nowrap flex-shrink-0"
                      >
                        {session.location}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 truncate">{session.coach}</p>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="w-full text-orange-600 hover:bg-orange-50"
                  onClick={() => navigate('/customer/my-classes')}
                >
                  {t('customer.dashboard.manage_schedule', { defaultValue: 'Manage schedule' })}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <CalendarClock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-4">
                  {t('customer.dashboard.no_upcoming_sessions', { defaultValue: 'No upcoming sessions' })}
                </p>
                <Button
                  variant="outline"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={() => navigate('/customer/my-classes')}
                >
                  {t('customer.dashboard.view_classes', { defaultValue: 'View My Classes' })}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-gray-200 shadow-sm lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{t('customer.dashboard.recent_activity', { defaultValue: 'Recent Activity' })}</CardTitle>
            <Badge variant="outline" className="border-gray-200 text-gray-600">
              {t('customer.dashboard.updated_live', { defaultValue: 'Updated live' })}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              // Check if there's any activity to show
              const hasSessionsDone = progressStats && progressStats.sessionsDone > 0;
              const hasMembership = !!membershipContract;
              const hasUpcomingSessions = upcomingSessions.length > 0;
              const hasAnyActivity = hasSessionsDone || hasMembership || hasUpcomingSessions;

              if (!hasAnyActivity) {
                return (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {t('customer.dashboard.no_activity', { defaultValue: 'No recent activity' })}
                    </p>
                  </div>
                );
              }

              return (
                <>
                  {hasSessionsDone && (
                    <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {t('customer.dashboard.workout_completed', { defaultValue: 'Workout completed' })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {progressStats.sessionsDone}{' '}
                          {t('customer.dashboard.sessions_completed', { defaultValue: 'sessions completed' })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-gray-50 text-gray-700">
                        {t('customer.dashboard.logged', { defaultValue: 'Logged' })}
                      </Badge>
                    </div>
                  )}
                  {hasMembership && (
                    <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {t('customer.dashboard.membership_active', { defaultValue: 'Membership active' })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {membershipInfo.daysRemaining !== null && membershipInfo.daysRemaining > 0
                            ? `${membershipInfo.daysRemaining} ${t('customer.dashboard.days_remaining', { defaultValue: 'days remaining' })}`
                            : t('customer.dashboard.active', { defaultValue: 'Active membership' })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-gray-50 text-gray-700">
                        {t('customer.dashboard.active', { defaultValue: 'Active' })}
                      </Badge>
                    </div>
                  )}
                  {hasUpcomingSessions && (
                    <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {t('customer.dashboard.classes_enrolled', { defaultValue: 'Classes enrolled' })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {upcomingSessions.length}{' '}
                          {t('customer.dashboard.upcoming_classes', { defaultValue: 'upcoming classes' })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-gray-50 text-gray-700">
                        {t('customer.dashboard.enrolled', { defaultValue: 'Enrolled' })}
                      </Badge>
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t('customer.dashboard.quick_actions', { defaultValue: 'Quick Actions' })}</CardTitle>
            <p className="text-sm text-gray-500">
              {t('customer.dashboard.shortcuts', { defaultValue: 'Shortcuts for frequent tasks' })}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => action.path && navigate(action.path)}
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
