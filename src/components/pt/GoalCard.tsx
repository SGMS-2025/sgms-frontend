import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Calendar, Edit, CheckCircle2 } from 'lucide-react';
import type { CustomerGoalDisplay } from '@/types/api/CustomerGoal';
import type { TrainingProgressDisplay as ProgressDisplay } from '@/types/api/TrainingProgress';

interface GoalCardProps {
  goal: CustomerGoalDisplay | null;
  currentProgress: ProgressDisplay | null;
  baselineProgress?: ProgressDisplay | null;
  onEdit?: () => void;
}

interface MetricProgress {
  current: number;
  target: number;
  percentage: number;
  direction: 'up' | 'down';
  isHigherBetter: boolean;
  unit: string;
  label: string;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, currentProgress, baselineProgress, onEdit }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to calculate progress percentage
  const calculateProgress = (
    current: number,
    target: number,
    isHigherBetter: boolean,
    initialValue?: number
  ): { percentage: number; isAchieved: boolean } => {
    // If we have initial value, calculate progress from initial to target
    if (initialValue !== undefined && initialValue !== target) {
      const totalChange = Math.abs(target - initialValue);
      // If current equals initial (no actual progress yet), return 0%
      if (Math.abs(current - initialValue) < 0.01) {
        return { percentage: 0, isAchieved: false };
      }

      const currentChange = current - initialValue;
      const targetDirection = target - initialValue; // Positive = tăng, Negative = giảm

      // Check if moving in the right direction (towards target)
      const isMovingTowardsTarget =
        (targetDirection > 0 && currentChange > 0) || // Tăng: cả target và current đều tăng
        (targetDirection < 0 && currentChange < 0); // Giảm: cả target và current đều giảm

      let percentage: number;
      if (isMovingTowardsTarget) {
        // Moving towards target: positive progress
        percentage = Math.min(100, Math.max(0, (Math.abs(currentChange) / totalChange) * 100));
      } else {
        // Moving away from target: negative progress
        percentage = -Math.min(100, (Math.abs(currentChange) / totalChange) * 100);
      }

      const isAchieved = isHigherBetter ? current >= target : current <= target;
      return { percentage, isAchieved };
    }

    // Otherwise, calculate based on how close current is to target
    // For "higher is better": percentage = (current / target) * 100, capped at 100
    // For "lower is better": percentage = (1 - (current - target) / target) * 100, but this is complex
    // Simple approach: calculate how close we are to target
    if (isHigherBetter) {
      const percentage = Math.min(100, Math.max(0, (current / target) * 100));
      const isAchieved = current >= target;
      return { percentage, isAchieved };
    } else {
      // For lower is better (weight, body fat), we need initial value
      // If no initial value provided, return 0% (cannot calculate progress without baseline)
      return { percentage: 0, isAchieved: false };
    }
  };

  // Calculate progress for each target metric
  const targetProgress = useMemo(() => {
    if (!goal || !currentProgress || !goal.targets) return {};

    // If no baseline progress, cannot calculate progress (need initial values)
    if (!baselineProgress) return {};

    const progress: Record<string, MetricProgress> = {};
    const getInitialValue = <K extends keyof ProgressDisplay>(key: K) => baselineProgress?.[key];

    // Weight - lower is better
    if (goal.targets.weight != null && currentProgress.weight != null) {
      const initial = baselineProgress?.weight;
      const { percentage } = calculateProgress(currentProgress.weight, goal.targets.weight, false, initial);
      progress.weight = {
        current: currentProgress.weight,
        target: goal.targets.weight,
        percentage,
        direction: goal.targets.weight < currentProgress.weight ? 'down' : 'up',
        isHigherBetter: false,
        unit: 'kg',
        label: t('progress_form.weight', 'Weight')
      };
    }

    // Body Fat - lower is better
    if (goal.targets.bodyFatPercentage != null && currentProgress.bodyFatPercentage != null) {
      const initial = baselineProgress?.bodyFatPercentage;
      const { percentage } = calculateProgress(
        currentProgress.bodyFatPercentage,
        goal.targets.bodyFatPercentage,
        false,
        initial
      );
      progress.bodyFatPercentage = {
        current: currentProgress.bodyFatPercentage,
        target: goal.targets.bodyFatPercentage,
        percentage,
        direction: goal.targets.bodyFatPercentage < currentProgress.bodyFatPercentage ? 'down' : 'up',
        isHigherBetter: false,
        unit: '%',
        label: t('progress_form.body_fat', 'Body Fat')
      };
    }

    // Muscle Mass - higher is better
    if (goal.targets.muscleMassPercentage != null && currentProgress.muscleMassPercentage != null) {
      const initial = baselineProgress?.muscleMassPercentage;
      const { percentage } = calculateProgress(
        currentProgress.muscleMassPercentage,
        goal.targets.muscleMassPercentage,
        true,
        initial
      );
      progress.muscleMassPercentage = {
        current: currentProgress.muscleMassPercentage,
        target: goal.targets.muscleMassPercentage,
        percentage,
        direction: goal.targets.muscleMassPercentage > currentProgress.muscleMassPercentage ? 'up' : 'down',
        isHigherBetter: true,
        unit: '%',
        label: t('progress_form.muscle_mass', 'Muscle Mass')
      };
    }

    // Strength - higher is better
    if (goal.targets.strength != null && currentProgress.strength != null) {
      const initial = baselineProgress?.strength;
      const { percentage } = calculateProgress(currentProgress.strength, goal.targets.strength, true, initial);
      progress.strength = {
        current: currentProgress.strength,
        target: goal.targets.strength,
        percentage,
        direction: goal.targets.strength > currentProgress.strength ? 'up' : 'down',
        isHigherBetter: true,
        unit: '',
        label: t('progress_form.strength', 'Strength')
      };
    }

    // BMI - depends on target (usually lower is better)
    if (goal.targets.bmi != null && currentProgress.bmi != null) {
      const initial = baselineProgress?.bmi;
      const { percentage } = calculateProgress(currentProgress.bmi, goal.targets.bmi, false, initial);
      progress.bmi = {
        current: currentProgress.bmi,
        target: goal.targets.bmi,
        percentage,
        direction: goal.targets.bmi < currentProgress.bmi ? 'down' : 'up',
        isHigherBetter: false,
        unit: '',
        label: t('progress_form.bmi', 'BMI')
      };
    }

    // Circumference measurements - higher is better (for chest, hips, arms, thighs)
    const circumferenceMetrics = [
      { key: 'chest', label: t('progress_form.chest', 'Chest'), unit: 'cm' },
      { key: 'waist', label: t('progress_form.waist', 'Waist'), unit: 'cm', isHigherBetter: false },
      { key: 'hips', label: t('progress_form.hips', 'Hips'), unit: 'cm' },
      { key: 'arms', label: t('progress_form.arms', 'Arms'), unit: 'cm' },
      { key: 'thighs', label: t('progress_form.thighs', 'Thighs'), unit: 'cm' }
    ];

    circumferenceMetrics.forEach(({ key, label, unit, isHigherBetter = true }) => {
      const targetKey = key as keyof typeof goal.targets;
      const progressKey = key as keyof typeof currentProgress;
      if (goal.targets[targetKey] != null && currentProgress[progressKey] != null) {
        const initialValue = getInitialValue(progressKey as keyof ProgressDisplay);
        const initial = typeof initialValue === 'number' ? initialValue : undefined;
        const { percentage } = calculateProgress(
          currentProgress[progressKey] as number,
          goal.targets[targetKey] as number,
          isHigherBetter,
          initial
        );
        progress[key] = {
          current: currentProgress[progressKey] as number,
          target: goal.targets[targetKey] as number,
          percentage,
          direction: (goal.targets[targetKey] as number) > (currentProgress[progressKey] as number) ? 'up' : 'down',
          isHigherBetter,
          unit,
          label
        };
      }
    });

    // Body Water - higher is better
    if (goal.targets.bodyWaterPercentage != null && currentProgress.bodyWaterPercentage != null) {
      const initial = baselineProgress?.bodyWaterPercentage;
      const { percentage } = calculateProgress(
        currentProgress.bodyWaterPercentage,
        goal.targets.bodyWaterPercentage,
        true,
        initial
      );
      progress.bodyWaterPercentage = {
        current: currentProgress.bodyWaterPercentage,
        target: goal.targets.bodyWaterPercentage,
        percentage,
        direction: goal.targets.bodyWaterPercentage > currentProgress.bodyWaterPercentage ? 'up' : 'down',
        isHigherBetter: true,
        unit: '%',
        label: t('progress_form.body_water', 'Body Water')
      };
    }

    // Metabolic Age - lower is better
    if (goal.targets.metabolicAge != null && currentProgress.metabolicAge != null) {
      const initial = baselineProgress?.metabolicAge;
      const { percentage } = calculateProgress(currentProgress.metabolicAge, goal.targets.metabolicAge, false, initial);
      progress.metabolicAge = {
        current: currentProgress.metabolicAge,
        target: goal.targets.metabolicAge,
        percentage,
        direction: goal.targets.metabolicAge < currentProgress.metabolicAge ? 'down' : 'up',
        isHigherBetter: false,
        unit: '',
        label: t('progress_form.metabolic_age', 'Metabolic Age')
      };
    }

    return progress;
  }, [goal, currentProgress, baselineProgress, t]);

  // Calculate overall progress percentage (average of all metrics)
  const overallProgress = useMemo(() => {
    const progresses = Object.values(targetProgress);
    if (progresses.length === 0) return 0; // No metrics = 0% (not time-based)

    // Check if we have any actual progress (not just initial values)
    const hasActualProgress = progresses.some((p) => Math.abs(p.percentage) > 0.01);
    if (!hasActualProgress) return 0; // Only initial progress = 0%

    const avg = progresses.reduce((sum, p) => sum + p.percentage, 0) / progresses.length;
    return Math.round(avg * 10) / 10; // Round to 1 decimal place, can be negative
  }, [targetProgress]);

  if (!goal) {
    return (
      <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 hover:border-gray-400 transition-colors">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('goal_card.no_goal_title', 'No Active Goal')}</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm">
              {t('goal_card.no_goal_description', 'Set a goal to track your progress and stay motivated!')}
            </p>
            {onEdit && (
              <Button
                onClick={onEdit}
                className="bg-[#F05A29] hover:bg-[#E04A1F] text-white shadow-md hover:shadow-lg transition-all"
                size="lg"
              >
                <Target className="h-5 w-5 mr-2" />
                {t('goal_card.set_goal', 'Set Goal')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Get top metrics for compact view
  const topMetrics = Object.entries(targetProgress)
    .slice(0, 4)
    .map(([key, value]) => ({ key, ...value }));

  return (
    <Card className="border-2 border-[#F05A29]/30 bg-gradient-to-br from-white via-orange-50/30 to-white shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-4 bg-gradient-to-r from-[#F05A29]/5 to-transparent border-b border-[#F05A29]/10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-8 w-8 rounded-full bg-[#F05A29]/10 flex items-center justify-center flex-shrink-0">
                  <Target className="h-5 w-5 text-[#F05A29]" />
                </div>
                <h3 className="text-lg font-bold text-[#101D33] break-words">{goal.name}</h3>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-300 font-semibold px-2 py-0.5 flex-shrink-0"
                >
                  {goal.status}
                </Badge>
              </div>
            </div>
            {goal.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2 break-words">{goal.description}</p>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-md w-fit">
                <Calendar className="h-3.5 w-3.5 text-[#F05A29] flex-shrink-0" />
                <span className="font-medium break-words">
                  {formatDate(goal.startDate)} → {formatDate(goal.endDate)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 sm:self-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 hover:bg-[#F05A29]/10"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-[#F05A29]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#F05A29]" />
              )}
            </Button>
            {onEdit && (
              <Button
                size="sm"
                onClick={onEdit}
                className="bg-[#F05A29] hover:bg-[#E04A1F] text-white shadow-md hover:shadow-lg transition-all h-8 px-3"
              >
                <Edit className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{t('goal_card.edit_goal', 'Edit Goal')}</span>
                <span className="sm:hidden">{t('goal_card.edit', 'Edit')}</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Overall Progress Bar */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#F05A29] flex-shrink-0" />
              {t('goal_card.overall_progress', 'Overall Progress')}
            </span>
            <span className={`text-lg font-bold ${overallProgress < 0 ? 'text-red-600' : 'text-[#F05A29]'}`}>
              {overallProgress < 0 ? '-' : ''}
              {Math.abs(overallProgress).toFixed(1)}%
            </span>
          </div>
          <Progress value={Math.max(0, overallProgress)} className="h-3 bg-gray-200" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{t('goal_card.completed', 'Completed')}</span>
            <span>
              {overallProgress >= 100 ? '🎉 ' : ''}
              {t('goal_card.achieved', 'Achieved')}
            </span>
          </div>
        </div>

        {/* Compact View - Top metrics */}
        {!isExpanded && topMetrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {topMetrics.map((metric) => {
              const isAchieved = metric.isHigherBetter
                ? metric.current >= metric.target
                : metric.current <= metric.target;

              return (
                <div
                  key={metric.key}
                  className="bg-white/60 rounded-lg p-3 border border-gray-200 hover:border-[#F05A29]/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">{metric.label}</span>
                    {isAchieved && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isAchieved
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : metric.isHigherBetter
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                              : 'bg-gradient-to-r from-orange-500 to-orange-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, metric.percentage))}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-800 sm:min-w-[70px] sm:text-right break-words">
                      {metric.current != null ? metric.current.toFixed(1) : 'N/A'}
                      {metric.unit} / {metric.target != null ? metric.target.toFixed(1) : 'N/A'}
                      {metric.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${metric.percentage != null && metric.percentage < 0 ? 'text-red-600' : 'text-gray-500'}`}
                    >
                      {metric.percentage != null
                        ? `${metric.percentage < 0 ? '-' : ''}${Math.abs(metric.percentage).toFixed(1)}%`
                        : '0%'}
                    </span>
                    {metric.direction === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Expanded View - All metrics */}
        {isExpanded && (
          <div className="space-y-4 mb-4">
            {Object.entries(targetProgress).map(([key, metric]) => {
              const isAchieved = metric.isHigherBetter
                ? metric.current >= metric.target
                : metric.current <= metric.target;

              return (
                <div
                  key={key}
                  className="bg-white/60 rounded-lg p-4 border border-gray-200 hover:border-[#F05A29]/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{metric.label}</span>
                      {isAchieved && (
                        <Badge className="bg-green-500 text-white text-xs px-1.5 py-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t('goal_card.achieved', 'Achieved')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {metric.direction === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                      <span className="text-sm font-bold text-gray-800 break-words">
                        {metric.current != null ? metric.current.toFixed(1) : 'N/A'}
                        {metric.unit} / {metric.target != null ? metric.target.toFixed(1) : 'N/A'}
                        {metric.unit}
                      </span>
                      <span
                        className={`text-xs ${metric.percentage != null && metric.percentage < 0 ? 'text-red-600' : 'text-gray-500'}`}
                      >
                        (
                        {metric.percentage != null
                          ? `${metric.percentage < 0 ? '-' : ''}${Math.abs(metric.percentage).toFixed(1)}%`
                          : '0%'}
                        )
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(100, Math.max(0, metric.percentage))}
                    className={`h-2.5 ${
                      isAchieved ? 'bg-green-100' : metric.isHigherBetter ? 'bg-blue-100' : 'bg-orange-100'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
