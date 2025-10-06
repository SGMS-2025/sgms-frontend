import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Edit, Power, Loader2, MoreHorizontal, CheckCircle, Circle, Clock3 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import type { MembershipPlan, MembershipPlanBranchInfo, MembershipPlanOverride } from '@/types/api/Membership';
import { formatCurrency } from '@/utils/membership';

interface PlanResolvedData {
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationInMonths: number;
  benefits: string[];
  isActive: boolean;
  source: 'template' | 'override';
  override?: MembershipPlanOverride;
}

interface MembershipCardProps {
  plan: MembershipPlan;
  resolved: PlanResolvedData;
  overrideCount: number;
  assignedBranches: MembershipPlanBranchInfo[];
  branchMap: Record<string, MembershipPlanBranchInfo>;
  branchesWithAccess: Set<string>;
  mutatingPlanId?: string;
  currentBranchId?: string;
  onPreview: (plan: MembershipPlan, branchId?: string) => void;
  onEdit: (plan: MembershipPlan, branchId?: string) => void;
  onToggleStatus: (plan: MembershipPlan) => void;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
  plan,
  resolved,
  overrideCount,
  assignedBranches,
  branchMap,
  branchesWithAccess,
  mutatingPlanId,
  currentBranchId,
  onPreview,
  onEdit,
  onToggleStatus
}) => {
  const { t } = useTranslation();

  const getBranchName = (branch: MembershipPlanBranchInfo, branchMap: Record<string, MembershipPlanBranchInfo>) => {
    const branchInfo = branchMap[branch._id] || branch;
    return {
      name: branchInfo.branchName || 'Unknown Branch',
      location: branchInfo.location
    };
  };

  const formattedPrice = formatCurrency(resolved.price, resolved.currency);
  const lastUpdated = new Date(plan.updatedAt).toLocaleDateString();

  const accentClass = resolved.isActive
    ? 'from-orange-400 via-orange-300 to-orange-400'
    : 'from-slate-400 via-slate-300 to-slate-400';

  const statusTone = resolved.isActive
    ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
    : 'border border-slate-200 bg-slate-100 text-slate-500';

  // Determine which branches to display based on whether this is an override or template
  const branchesToDisplay = React.useMemo(() => {
    // If viewing an override (custom plan for specific branch)
    if (resolved.source === 'override' && resolved.override) {
      // Only show the branch this override applies to
      const overrideBranch = assignedBranches.find((branch) => branch._id === resolved.override?.appliesToBranchId);
      return overrideBranch ? [overrideBranch] : [];
    }

    // If viewing template, show all assigned branches
    return assignedBranches;
  }, [resolved.source, resolved.override, assignedBranches]);

  return (
    <Card className="group flex flex-col overflow-hidden border border-orange-100 shadow-sm transition hover:border-orange-200 hover:shadow-md h-full">
      <div className={`h-0.5 w-full bg-gradient-to-r ${accentClass}`} />
      <CardContent className="flex flex-1 flex-col h-full pt-3 pb-4 px-4 sm:px-5">
        {/* Header with title, price and menu */}
        <div className="relative flex-shrink-0 mb-3">
          <div className="absolute right-0 top-[-20px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:text-orange-500 flex-shrink-0"
                  title={t('membershipManager.card.moreActions')}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onPreview(plan, currentBranchId)} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {t('membershipManager.card.viewDetails')}
                </DropdownMenuItem>
                {branchesWithAccess.size > 0 && (
                  <DropdownMenuItem onClick={() => onEdit(plan, currentBranchId)} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    {t('membershipManager.card.edit')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onToggleStatus(plan)}
                  disabled={mutatingPlanId === plan._id}
                  className="flex items-center gap-2"
                >
                  {mutatingPlanId === plan._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Power className={`h-4 w-4 ${plan.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  )}
                  {t('membershipManager.card.toggle')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-1">{resolved.name}</CardTitle>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xl font-bold text-orange-600">{formattedPrice}</span>
              <span className="text-sm text-slate-500">
                {t('membershipManager.card.duration', { months: resolved.durationInMonths })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {/* Type Badge: TEMPLATE or CUSTOM */}
            {plan.isTemplate ? (
              <Badge
                variant="secondary"
                className="rounded-full border border-slate-200 bg-white/90 uppercase text-[10px] px-2 py-1 font-semibold"
              >
                {t('membershipManager.card.templateBadge')}
              </Badge>
            ) : (
              <Badge className="rounded-full border border-amber-200 bg-amber-50 text-amber-700 uppercase text-[10px] px-2 py-1 font-semibold">
                {t('membershipManager.card.customBadge')}
              </Badge>
            )}

            {/* Status Badge: Active or Inactive */}
            <Badge className={`rounded-full text-[10px] font-medium px-2 py-1 ${statusTone}`}>
              {resolved.isActive
                ? t('membershipManager.card.statusActive')
                : t('membershipManager.card.statusInactive')}
            </Badge>

            {/* Override Count Badge: Only for templates with overrides */}
            {plan.isTemplate && overrideCount > 0 && (
              <Badge className="rounded-full border border-purple-200 bg-purple-50 text-[10px] font-medium text-purple-600 px-2 py-1">
                {t('membershipManager.card.customCount', { count: overrideCount })}
              </Badge>
            )}
          </div>
        </div>

        {/* Description with more spacing */}
        <p className="line-clamp-2 text-sm text-slate-600 mb-4">
          {resolved.description ?? t('membershipManager.dialog.noDescription')}
        </p>

        {/* Benefits section - takes remaining space */}
        <div className="flex-1 space-y-2 min-h-0">
          <span className="text-sm font-semibold text-slate-700">{t('membershipManager.card.benefitsTitle')}</span>
          {resolved.benefits.length ? (
            <ul className="space-y-1">
              {resolved.benefits.slice(0, 3).map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{benefit}</span>
                </li>
              ))}
              {resolved.benefits.length > 3 && (
                <li className="flex items-center gap-2 text-sm text-orange-600 font-medium">
                  <Circle className="h-4 w-4 flex-shrink-0" />
                  <span>{t('membershipManager.card.moreBenefits', { count: resolved.benefits.length - 3 })}</span>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">{t('membershipManager.card.noBenefits')}</p>
          )}
        </div>

        {/* Branches section */}
        <div className="space-y-2 flex-shrink-0 mb-1">
          <span className="text-sm font-semibold text-slate-700">{t('membershipManager.card.branchesLabel')}</span>
          {branchesToDisplay.length ? (
            <ul className="space-y-1">
              {branchesToDisplay.slice(0, 2).map((branch) => {
                const { name } = getBranchName(branch, branchMap);
                return (
                  <li key={branch._id} className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="h-2 w-2 rounded-full flex-shrink-0 bg-slate-400" />
                    <span className="line-clamp-1">{name}</span>
                  </li>
                );
              })}
              {branchesToDisplay.length > 2 && (
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <Circle className="h-4 w-4 flex-shrink-0" />
                  <span>{t('membershipManager.card.moreBranches', { count: branchesToDisplay.length - 2 })}</span>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">{t('membershipManager.card.noBranches')}</p>
          )}
        </div>

        {/* Updated time info - moved to bottom with minimal spacing */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0 mt-1 pt-1 border-t border-slate-100">
          <Clock3 className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{t('membershipManager.card.updatedAt', { value: lastUpdated })}</span>
        </div>
      </CardContent>
    </Card>
  );
};
