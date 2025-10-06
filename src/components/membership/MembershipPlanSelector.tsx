import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MembershipPlan } from '@/types/api/Membership';

interface MembershipPlanSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  plans: MembershipPlan[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onJoinPlan: (plan: MembershipPlan) => void;
  branchName: string;
  branchLocation: string;
  branchImage?: string;
}

export const MembershipPlanSelector: React.FC<MembershipPlanSelectorProps> = ({
  isOpen,
  onClose,
  plans,
  loading,
  error,
  onRetry,
  onJoinPlan,
  branchName,
  branchLocation,
  branchImage
}) => {
  const { t } = useTranslation();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showAllBenefits, setShowAllBenefits] = useState(false);

  // Maximum benefits to show initially
  const MAX_BENEFITS_PREVIEW = 4;

  // Auto-select first plan when plans are loaded
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0]._id);
    }
  }, [plans, selectedPlanId]);

  // Reset selection and benefits view when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPlanId(null);
      setShowAllBenefits(false);
    }
  }, [isOpen]);

  const selectedPlan = useMemo(() => {
    if (!selectedPlanId || !plans.length) return null;
    return plans.find((plan: MembershipPlan) => plan._id === selectedPlanId) || null;
  }, [selectedPlanId, plans]);

  const formatPrice = useCallback((value: number, currency: string) => {
    // Validate inputs
    if (typeof value !== 'number' || isNaN(value)) {
      return '0 VND';
    }

    // Normalize currency code (fallback to VND if invalid)
    const currencyCode = currency?.toUpperCase().trim() || 'VND';

    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleJoinClick = () => {
    if (selectedPlan) {
      onJoinPlan(selectedPlan);
    }
  };

  // Clean and deduplicate benefits
  const cleanBenefits = useCallback((benefits: string[]) => {
    if (!benefits || !Array.isArray(benefits)) return [];

    // Remove empty strings, null, undefined
    const filtered = benefits.filter((benefit) => benefit && typeof benefit === 'string' && benefit.trim().length > 0);

    // Remove duplicates
    const unique = [...new Set(filtered)];

    // Remove "Test" entries
    return unique.filter((benefit) => benefit.toLowerCase() !== 'test' && benefit.trim() !== 'Test');
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl h-[85vh] max-h-[700px] overflow-hidden border border-border/80 bg-background/95 p-0 text-foreground shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/80 flex flex-col"
        showCloseButton={false}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="flex items-start gap-4 border-b border-border bg-gradient-to-r from-orange-500/15 via-orange-400/10 to-background px-6 py-6 dark:from-orange-500/25 dark:via-orange-400/15">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-border bg-card">
              <img
                src={branchImage || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200'}
                alt={branchName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{branchName}</span>
                <span>•</span>
                <span>{branchLocation}</span>
              </div>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">{t('gymDetail.membership.dialog.title')}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('gymDetail.membership.dialog.subtitle', { branchName })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{t('common.close')}</span>
            </button>
          </header>

          <div className="grid gap-6 px-6 pb-6 lg:grid-cols-[240px_minmax(0,1fr)] flex-1 overflow-hidden">
            {/* Sidebar - Plan List */}
            <aside className="space-y-3 rounded-2xl border border-border bg-muted/70 p-4 overflow-y-auto max-h-full">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('gymDetail.membership.sidebar.title')}
              </h3>
              <div className="space-y-2">
                {loading && (
                  <div className="rounded-lg border border-border/80 bg-card px-4 py-3 text-sm text-muted-foreground">
                    {t('gymDetail.membership.sidebar.loading')}
                  </div>
                )}

                {error && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="w-full rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-left text-sm text-destructive transition hover:bg-destructive/20"
                  >
                    {`${error} - ${t('gymDetail.membership.sidebar.retry')}`}
                  </button>
                )}

                {!loading && !error && plans.length === 0 && (
                  <div className="rounded-lg border border-border/70 bg-card px-4 py-5 text-center text-sm text-muted-foreground">
                    {t('gymDetail.membership.sidebar.empty')}
                  </div>
                )}

                {plans.map((plan: MembershipPlan) => {
                  const isActive = selectedPlanId === plan._id;
                  return (
                    <button
                      key={plan._id}
                      type="button"
                      onClick={() => handlePlanSelect(plan._id)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                        isActive
                          ? 'border-orange-500 bg-orange-500/10 text-foreground shadow-lg shadow-orange-500/25'
                          : 'border-transparent bg-transparent text-muted-foreground hover:border-orange-400/60 hover:bg-orange-500/5 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-foreground">{plan.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(plan.price, plan.currency || 'VND')} /{' '}
                            {t('gymDetail.membership.intervals.monthShort')}
                          </p>
                        </div>
                        {isActive && (
                          <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white shadow-sm">
                            {t('gymDetail.membership.sidebar.activeBadge')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Main Content - Selected Plan Details */}
            <section className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm overflow-y-auto max-h-full">
              {selectedPlan ? (
                <>
                  {/* Plan Header */}
                  <header className="flex flex-col gap-2 flex-shrink-0">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('gymDetail.membership.plan.selectedLabel')}</p>
                        <h3 className="text-xl font-semibold text-foreground line-clamp-2">{selectedPlan.name}</h3>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-semibold text-foreground">
                          {formatPrice(selectedPlan.price, selectedPlan.currency || 'VND')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('gymDetail.membership.plan.duration', { count: selectedPlan.durationInMonths })}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleJoinClick}
                      className="mt-2 w-fit rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-400"
                    >
                      {t('gymDetail.membership.plan.joinButton')}
                    </Button>
                  </header>

                  {/* Benefits */}
                  {(() => {
                    const cleanBenefitList = cleanBenefits(selectedPlan.benefits);
                    if (cleanBenefitList.length === 0) return null;

                    const hasMoreBenefits = cleanBenefitList.length > MAX_BENEFITS_PREVIEW;
                    const displayedBenefits = showAllBenefits
                      ? cleanBenefitList
                      : cleanBenefitList.slice(0, MAX_BENEFITS_PREVIEW);

                    return (
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <h4 className="font-semibold text-foreground">
                          {t('gymDetail.membership.plan.benefitsTitle')}
                        </h4>
                        <ul className="space-y-2">
                          {displayedBenefits.map((benefit, index) => (
                            <li key={`${selectedPlan._id}-benefit-${index}`} className="flex items-start gap-2">
                              <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-orange-500" />
                              <span className="line-clamp-3">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                        {hasMoreBenefits && (
                          <button
                            type="button"
                            onClick={() => setShowAllBenefits(!showAllBenefits)}
                            className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-400 transition-colors mt-2"
                          >
                            {showAllBenefits ? (
                              <>
                                <span>{t('gymDetail.membership.plan.showLessBenefits', 'Thu gọn')}</span>
                                <svg
                                  className="h-3 w-3 rotate-180 transition-transform"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M5 8l5 5 5-5H5z" />
                                </svg>
                              </>
                            ) : (
                              <>
                                <span>
                                  {t('gymDetail.membership.plan.moreBenefitsCta')} (
                                  {cleanBenefitList.length - MAX_BENEFITS_PREVIEW}{' '}
                                  {t('gymDetail.membership.plan.moreBenefits', 'thêm')})
                                </span>
                                <svg className="h-3 w-3 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M5 8l5 5 5-5H5z" />
                                </svg>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Description */}
                  {selectedPlan.description && (
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <h4 className="font-semibold text-foreground">
                        {t('gymDetail.membership.plan.descriptionTitle', 'Mô tả')}
                      </h4>
                      <p className="line-clamp-4">{selectedPlan.description}</p>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4 mt-4">
                    <p className="line-clamp-2">{t('gymDetail.membership.plan.disclaimerRecurring')}</p>
                    <p className="line-clamp-2">{t('gymDetail.membership.plan.disclaimerPolicy')}</p>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  {t('gymDetail.membership.plan.emptyState')}
                </div>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
