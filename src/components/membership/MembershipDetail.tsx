import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Users } from 'lucide-react';
import type { MembershipPlan } from '@/types/api/Membership';

interface MembershipDetailProps {
  isOpen: boolean;
  onClose: () => void;
  plan: MembershipPlan | null;
  branchId?: string;
}

export const MembershipDetail: React.FC<MembershipDetailProps> = ({ isOpen, onClose, plan, branchId }) => {
  const { t } = useTranslation();

  if (!plan) return null;

  const formatCurrency = (value: number, currency: string) => {
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      }).format(value);
    } catch {
      return `${value.toLocaleString('vi-VN')} ${currency}`;
    }
  };

  const isOverride = branchId && branchId !== plan.branchId[0]?._id;
  const overrideData = isOverride ? plan.overrides?.find((o) => o.appliesToBranchId === branchId) : null;

  const resolvedPlan = {
    name: overrideData?.name || plan.name,
    description: overrideData?.description || plan.description,
    price: overrideData?.price || plan.price,
    currency: overrideData?.currency || plan.currency,
    durationInMonths: overrideData?.durationInMonths || plan.durationInMonths,
    benefits: overrideData?.benefits || plan.benefits,
    isActive: overrideData?.isActive ?? plan.isActive
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : onClose)}>
      <DialogContent className="w-[95vw] max-w-2xl h-[95vh] max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-orange-800">Membership plan details</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-slate-600">
            {isOverride ? 'Viewing the custom version configuration.' : 'Viewing the base template configuration.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          {/* Status and Type Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={isOverride ? 'outline' : 'default'}
              className={isOverride ? 'border-orange-200 text-orange-600' : 'bg-orange-500 text-white'}
            >
              {isOverride ? t('membershipManager.detail.customVersion') : t('membershipManager.detail.basePlan')}
            </Badge>

            <Badge
              variant={resolvedPlan.isActive ? 'default' : 'secondary'}
              className={resolvedPlan.isActive ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}
            >
              {resolvedPlan.isActive ? 'Visible' : 'Hidden'}
            </Badge>

            <Badge variant="outline" className="border-gray-200 text-gray-600 text-xs sm:text-sm">
              <span className="hidden sm:inline">Updated </span>
              {new Date(plan.updatedAt).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
              })}
              ,{' '}
              {new Date(plan.updatedAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </Badge>
          </div>

          {/* Plan Overview */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-orange-800 mb-2">{resolvedPlan.name}</h3>
                <p className="text-slate-600 text-base sm:text-lg">
                  {resolvedPlan.description || t('membershipManager.detail.noDescription')}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">
                  {formatCurrency(resolvedPlan.price, resolvedPlan.currency)}
                </div>
                <div className="text-sm text-slate-500">
                  {t('membershipManager.card.duration', { months: resolvedPlan.durationInMonths })}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <Card className="border-orange-100">
            <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-base sm:text-lg text-orange-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                Detailed benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              {resolvedPlan.benefits && resolvedPlan.benefits.length > 0 ? (
                <ul className="space-y-2">
                  {resolvedPlan.benefits.map((benefit, index) => (
                    <li key={`benefit-${index}-${benefit.slice(0, 10)}`} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-slate-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm sm:text-base text-slate-500 italic">{t('membershipManager.detail.noBenefits')}</p>
              )}
            </CardContent>
          </Card>

          {/* Assigned Branches */}
          <Card className="border-orange-100">
            <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-base sm:text-lg text-orange-800 flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Assigned branches
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-3">
                {plan.branchId.map((branch) => {
                  const isCurrentBranch = branch._id === branchId;
                  const hasOverride = plan.overrides?.some((o) => o.appliesToBranchId === branch._id);

                  return (
                    <div key={branch._id} className="p-3 sm:p-4 border border-orange-200 rounded-lg bg-orange-50/30">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-orange-800 mb-1 text-sm sm:text-base truncate">
                            {branch.branchName}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 mb-2 line-clamp-2">{branch.location}</p>
                          <div className="flex items-center gap-2">
                            {hasOverride ? (
                              <>
                                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs">⚙️</span>
                                </div>
                                <span className="text-xs sm:text-sm text-orange-600 font-medium">
                                  Uses a custom version
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs">↩️</span>
                                </div>
                                <span className="text-xs sm:text-sm text-orange-600 font-medium">
                                  Using the base template
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {isCurrentBranch && (
                          <Badge
                            variant="outline"
                            className="border-orange-300 text-orange-700 text-xs self-start sm:self-auto"
                          >
                            Current View
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-4 flex-shrink-0" />

        <div className="px-6 pb-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto order-1 sm:order-2">
              {t('membershipManager.detail.editPlan')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
