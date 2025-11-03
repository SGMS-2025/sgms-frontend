import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SubscriptionPackageCard } from '@/components/subscription/SubscriptionPackageCard';
import { PurchaseSubscriptionModal } from '@/components/subscription/PurchaseSubscriptionModal';
import { BusinessVerificationAlert } from '@/components/business/BusinessVerificationAlert';
import BusinessVerificationModal from '@/components/business/BusinessVerificationModal';
import { useSubscriptionPackages } from '@/hooks/useSubscriptionPackages';

export const SubscriptionPackagesPage = () => {
  const { t } = useTranslation();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const {
    packages,
    stats,
    isLoading,
    selectedPackage,
    isPurchaseModalOpen,
    currentPackageTier,
    handleSelectPackage,
    closePurchaseModal,
    handlePurchaseSuccess,
    getDaysRemaining,
    getBranchUsage,
    getCustomerUsage
  } = useSubscriptionPackages();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50/30 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">{t('subscription.page.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen from-orange-50/30 via-orange-50/20 to-white">
      <div className="relative container mx-auto px-4 pt-4 pb-12 max-w-7xl">
        {/* Business Verification Alert */}
        <div className="mb-8">
          <BusinessVerificationAlert onOpenVerificationModal={() => setIsVerificationModalOpen(true)} />
        </div>

        {/* Business Verification Modal */}
        <BusinessVerificationModal
          open={Boolean(isVerificationModalOpen)}
          onOpenChange={(value: boolean) => setIsVerificationModalOpen(value)}
        />

        {/* Current Subscription Status - Glassmorphism Design */}
        {(() => {
          if (!stats || !('hasActiveSubscription' in stats) || !stats.hasActiveSubscription) return null;

          const daysRemaining = getDaysRemaining();
          const branchUsage = getBranchUsage();
          const customerUsage = getCustomerUsage();

          return (
            <Card className="mb-10 backdrop-blur-xl bg-gradient-to-br from-orange-50/90 via-amber-50/80 to-orange-50/90 border-orange-300/50 shadow-2xl shadow-orange-500/10 transition-all duration-500 hover:shadow-orange-500/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/30">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-orange-900 text-xl font-bold mb-1">
                        {t('subscription.page.currentPackage')}:{' '}
                        {typeof stats.packageName === 'string' ? stats.packageName : ''}
                      </CardTitle>
                      <CardDescription className="text-orange-700">
                        {t('subscription.page.activePackage')}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Days Remaining */}
                  <div className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {t('subscription.page.daysRemaining')}
                        </span>
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        {String(daysRemaining)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{t('subscription.page.days')}</div>
                    </div>
                  </div>

                  {/* Branch Usage */}
                  {branchUsage && (
                    <div className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                            <Package className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{t('subscription.page.branches')}</span>
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                          {String(branchUsage.current)} / {String(branchUsage.max)}
                        </div>
                        <Progress value={branchUsage.percentage} className="h-2.5 bg-orange-100" />
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(branchUsage.percentage)}% {t('subscription.page.used')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Usage */}
                  {customerUsage && (
                    <div className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{t('subscription.page.customers')}</span>
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                          {String(customerUsage.current)} / {String(customerUsage.max)}
                        </div>
                        <Progress value={customerUsage.percentage} className="h-2.5 bg-orange-100" />
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(customerUsage.percentage)}% {t('subscription.page.used')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <style>{`
            @keyframes fade-in {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fade-in {
              animation: fade-in 0.5s ease-out;
            }
          `}</style>
          {packages.map((pkg) => {
            const isCurrentPackage = currentPackageTier === pkg.tier;
            const isLowerTier = currentPackageTier !== null && pkg.tier < currentPackageTier;
            // Allow renew (same tier) and upgrade (higher tier), but disable downgrade (lower tier)
            const isDisabled = isLowerTier;

            return (
              <SubscriptionPackageCard
                key={pkg._id}
                package={pkg}
                isCurrentPackage={isCurrentPackage}
                isLowerTier={isLowerTier}
                onSelect={handleSelectPackage}
                disabled={isDisabled}
              />
            );
          })}
        </div>

        {/* Purchase Modal */}
        <PurchaseSubscriptionModal
          open={isPurchaseModalOpen}
          onOpenChange={(open) => {
            if (!open) closePurchaseModal();
          }}
          package={selectedPackage}
          onSuccess={handlePurchaseSuccess}
        />
      </div>
    </div>
  );
};
