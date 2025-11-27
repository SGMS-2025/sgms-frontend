import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LucideIcon, Package, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { SubscriptionPackageCard } from '@/components/subscription/SubscriptionPackageCard';
import { PurchaseSubscriptionModal } from '@/components/subscription/PurchaseSubscriptionModal';
import { BusinessVerificationAlert } from '@/components/business/BusinessVerificationAlert';
import BusinessVerificationModal from '@/components/business/BusinessVerificationModal';
import { useSubscriptionPackages } from '@/hooks/useSubscriptionPackages';
import { Button } from '@/components/ui/button';

export const SubscriptionPackagesPage = () => {
  const { t } = useTranslation();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const packagesRef = useRef<HTMLDivElement | null>(null);

  const heroHighlights: { icon: LucideIcon; title: string; description: string }[] = [
    {
      icon: Package,
      title: t('subscription.hero.highlightMembers'),
      description: t('subscription.hero.highlightMembersHint')
    },
    {
      icon: TrendingUp,
      title: t('subscription.hero.highlightStrategy'),
      description: t('subscription.hero.highlightStrategyHint')
    },
    {
      icon: CheckCircle2,
      title: t('subscription.hero.highlightSupport'),
      description: t('subscription.hero.highlightSupportHint')
    }
  ];

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

  const handleScrollToPackages = () => {
    packagesRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

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
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-orange-100/40 via-orange-50/10 to-transparent blur-[120px] pointer-events-none"></div>
      <div className="relative w-full max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 pt-4 pb-12">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-orange-100/60 bg-gradient-to-r from-orange-50 via-white to-amber-50 px-5 py-8 md:px-12 md:py-10 shadow-[0_16px_60px_rgba(244,114,40,0.16)]">
          <div className="absolute -top-12 -right-10 h-48 w-48 rounded-full bg-orange-200/40 blur-3xl"></div>
          <div className="absolute bottom-4 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-amber-100/50 blur-2xl"></div>
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-600 shadow-sm">
                {t('subscription.hero.tag')}
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900 md:text-4xl md:leading-tight">
                  {t('subscription.hero.title')}
                </h1>
                <p className="text-sm text-gray-600 md:text-base">{t('subscription.hero.subtitle')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {heroHighlights.map(({ icon: Icon, title }) => (
                  <div
                    key={title}
                    className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm"
                  >
                    <Icon className="h-4 w-4 text-orange-600" />
                    <span>{title}</span>
                  </div>
                ))}
              </div>
              {stats?.hasActiveSubscription && (
                <div className="mt-1 flex flex-wrap items-center gap-2 rounded-2xl border border-orange-100 bg-white/80 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm backdrop-blur">
                  <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-orange-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t('subscription.page.currentPackage')}</span>
                    <span className="font-semibold text-gray-900">{stats.packageName}</span>
                  </div>
                  <div className="h-3 w-[1px] bg-orange-100" />
                  <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1">
                    <Clock className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-gray-800 font-semibold">{getDaysRemaining()}</span>
                    <span className="text-gray-500">{t('subscription.page.days')}</span>
                  </div>
                  {getBranchUsage() && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1">
                      <Package className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-gray-800 font-semibold">
                        {getBranchUsage()?.current}/{getBranchUsage()?.max}
                      </span>
                      <span className="text-gray-500">{t('subscription.page.branches')}</span>
                    </div>
                  )}
                  {getCustomerUsage() && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1">
                      <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-gray-800 font-semibold">
                        {getCustomerUsage()?.current}/{getCustomerUsage()?.max}
                      </span>
                      <span className="text-gray-500">{t('subscription.page.customers')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={handleScrollToPackages}
                className="h-11 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
              >
                {t('subscription.hero.ctaTrial')}
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-full border border-orange-200 bg-white px-6 text-sm font-semibold text-orange-600 hover:border-orange-300 hover:bg-orange-50"
                asChild
              >
                <a href="https://gymsmart.site/contact" target="_blank" rel="noreferrer">
                  {t('subscription.hero.ctaContact')}
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Business Verification Alert */}
        <div className="mt-8 mb-8">
          <BusinessVerificationAlert onOpenVerificationModal={() => setIsVerificationModalOpen(true)} />
        </div>

        {/* Business Verification Modal */}
        <BusinessVerificationModal
          open={Boolean(isVerificationModalOpen)}
          onOpenChange={(value: boolean) => setIsVerificationModalOpen(value)}
        />

        {/* Packages Grid */}
        <section
          ref={packagesRef}
          id="subscription-packages"
          className="relative mb-12 mt-12 overflow-hidden rounded-[32px] border border-orange-100/70 bg-gradient-to-b from-white via-orange-50/50 to-orange-100/30 p-4 sm:p-6 lg:p-10 shadow-[0_32px_90px_rgba(244,114,40,0.12)] backdrop-blur"
        >
          <div className="pointer-events-none absolute inset-x-10 -top-12 h-24 rounded-full bg-gradient-to-b from-orange-200/40 via-orange-100/30 to-transparent blur-3xl"></div>
          <div className="pointer-events-none absolute inset-x-16 bottom-0 h-32 rounded-full bg-gradient-to-t from-orange-100/40 to-transparent blur-3xl"></div>
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
          <div className="relative">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                    onSelect={handleSelectPackage}
                    disabled={isDisabled}
                  />
                );
              })}
            </div>
          </div>
        </section>

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
