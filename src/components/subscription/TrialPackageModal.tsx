import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, Sparkles, Calendar, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import { extractAndTranslateApiError } from '@/utils/errorHandler';
import type { SubscriptionPackage } from '@/types/api/Subscription';

interface TrialPackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: SubscriptionPackage | null;
  onSuccess?: () => void;
}

export const TrialPackageModal = ({ open, onOpenChange, package: pkg, onSuccess }: TrialPackageModalProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!pkg) return;

    setIsSubmitting(true);

    subscriptionApi
      .purchaseSubscription({
        packageId: pkg._id,
        paymentMethod: 'CASH', // Trial is always CASH
        months: 1 // Not used for trial, but required by API
      })
      .then((result) => {
        if (result.success) {
          toast.success(t('subscription.trial.success.title', 'Trial activated successfully!'), {
            description: t(
              'subscription.trial.success.description',
              'Your 7-day free trial has been activated. Enjoy exploring all features!'
            )
          });
          onOpenChange(false);
          onSuccess?.();
        }
      })
      .catch((error) => {
        const errorMessage = extractAndTranslateApiError(error, t, 'subscription.trial.error');
        toast.error(errorMessage);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (!pkg) return null;

  const features = Array.isArray(pkg.features) ? pkg.features : [];
  const durationText =
    pkg.durationUnit === 'DAY'
      ? `${pkg.duration} ${pkg.duration === 1 ? 'day' : 'days'}`
      : `${pkg.duration} ${pkg.durationUnit.toLowerCase()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-none bg-transparent p-0 shadow-none">
        <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-white/90 shadow-[0_32px_90px_rgba(244,114,36,0.18)] backdrop-blur">
          <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-orange-100/50 blur-3xl"></div>
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-72 w-72 rounded-full bg-amber-100/60 blur-3xl"></div>

          <DialogHeader className="relative z-10 flex flex-col gap-1 border-b border-orange-100/80 px-8 pt-7 pb-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {t('subscription.trial.modal.title', 'Start Your Free Trial')}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-gray-600">
                  {t('subscription.trial.modal.description', 'Activate your 7-day free trial and explore all features')}
                </DialogDescription>
              </div>
              <div className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-orange-500/30">
                {t('subscription.trial.modal.badge', 'Free Trial')}
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="relative z-10 max-h-[70vh]">
            <div className="px-8 py-6">
              <div className="space-y-6">
                {/* Package Info Card */}
                <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-orange-100 shadow-[0_20px_60px_rgba(244,114,36,0.14)]">
                  <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-orange-200/40 blur-3xl"></div>
                  <div className="pointer-events-none absolute left-10 bottom-0 h-24 w-24 rounded-full bg-amber-200/40 blur-2xl"></div>
                  <div className="relative z-10 space-y-5 p-6">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-600">
                        {t('subscription.card.planLabel', 'GYMSMART PLAN')}
                      </p>
                      <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                    </div>

                    {/* Duration */}
                    <div className="rounded-xl border border-orange-100 bg-white/80 p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-2">
                          <Calendar className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-orange-600">
                            {t('subscription.trial.modal.duration', 'Trial Duration')}
                          </p>
                          <p className="text-lg font-bold text-gray-900">{durationText}</p>
                        </div>
                      </div>
                    </div>

                    {/* Limits */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/70 bg-white/70 p-3 shadow-inner shadow-orange-50">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-orange-600" />
                          <p className="text-xs font-medium text-orange-600">
                            {t('subscription.modal.branches', 'Branches')}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {t('subscription.modal.max', 'Max')} {pkg.maxBranches}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/70 bg-white/70 p-3 shadow-inner shadow-orange-50">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-orange-600" />
                          <p className="text-xs font-medium text-orange-600">
                            {t('subscription.modal.customers', 'Customers')}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {t('subscription.modal.max', 'Max')} {pkg.maxCustomers}
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    {features.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                          {t('subscription.modal.includes', 'What you get')}
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {features.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 rounded-lg border border-orange-100 bg-white/80 p-2.5 text-sm text-gray-800 shadow-sm"
                            >
                              <Check className="h-4 w-4 flex-shrink-0 mt-0.5 text-orange-600" />
                              <span className="text-xs font-medium">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="relative z-10 flex flex-col gap-3 border-t border-orange-100/80 bg-white/80 px-8 py-5 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-11 border-gray-200 bg-white/90 font-semibold hover:bg-gray-50"
            >
              {t('subscription.modal.button.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-11 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40 transition-all duration-300 hover:shadow-orange-500/60 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  {t('subscription.trial.modal.button.activating', 'Activating...')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {t('subscription.trial.modal.button.confirm', 'Start Free Trial')}
                </span>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
