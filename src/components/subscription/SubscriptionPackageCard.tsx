import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { SubscriptionPackage } from '@/types/api/Subscription';

interface SubscriptionPackageCardProps {
  package: SubscriptionPackage;
  isCurrentPackage?: boolean;
  onSelect?: (packageId: string) => void;
  disabled?: boolean;
}

export const SubscriptionPackageCard = ({
  package: pkg,
  isCurrentPackage = false,
  onSelect,
  disabled = false
}: SubscriptionPackageCardProps) => {
  const { t } = useTranslation();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const isPopular = pkg.tier === 2;
  const [expanded, setExpanded] = useState(false);
  const features = Array.isArray(pkg.features) ? pkg.features : [];
  const MAX_VISIBLE_FEATURES = 6;
  const hasMoreFeatures = features.length > MAX_VISIBLE_FEATURES;
  const visibleFeatures = expanded ? features : features.slice(0, MAX_VISIBLE_FEATURES);

  return (
    <Card
      className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] border bg-gradient-to-b from-white via-orange-50/20 to-orange-100/20 transition-all duration-500 ${
        isPopular
          ? 'border-orange-300/70 shadow-[0_24px_70px_rgba(244,114,36,0.22)] hover:shadow-[0_30px_90px_rgba(244,114,36,0.28)] hover:-translate-y-2'
          : 'border-gray-100 shadow-[0_18px_60px_rgba(15,23,42,0.08)] hover:shadow-[0_24px_80px_rgba(15,23,42,0.12)] hover:-translate-y-2'
      } ${isCurrentPackage ? 'ring-2 ring-green-500/70' : ''}`}
    >
      {/* Soft glow background */}
      <div className="pointer-events-none absolute inset-x-6 -top-24 h-64 rounded-full bg-gradient-to-b from-orange-200/40 via-orange-100/30 to-transparent blur-3xl"></div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white to-orange-50/70 opacity-90"></div>

      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-orange-500/40">
          {t('subscription.card.popular')}
        </div>
      )}

      {/* Current Package Badge */}
      {isCurrentPackage && (
        <div className="absolute top-4 right-4 z-20 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 shadow-sm">
          {t('subscription.card.currentPackage')}
        </div>
      )}

      {/* Header */}
      <CardHeader className="relative z-10 space-y-4 pt-8 pb-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-orange-500">
          {t('subscription.card.planLabel')}
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-orange-600">
          {pkg.name}
        </CardTitle>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="inline-block text-4xl font-extrabold text-orange-600 transition-transform duration-300 group-hover:scale-105">
              {formatPrice(pkg.price)}
            </span>
            <span className="text-sm text-gray-600">{t('subscription.card.perMonth')}</span>
          </div>
        </div>
        {pkg.description && (
          <CardDescription className="mt-2 text-base text-gray-600 transition-colors duration-300 group-hover:text-gray-700">
            {pkg.description}
          </CardDescription>
        )}
      </CardHeader>

      {/* Features */}
      <CardContent className="relative z-10 flex-1 px-6 pb-2">
        <div className="mb-5 h-px bg-gradient-to-r from-transparent via-orange-200/70 to-transparent"></div>
        {features.length > 0 && (
          <>
            <div className="relative overflow-hidden">
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                {visibleFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 opacity-0 animate-fade-in"
                    style={{
                      animationDelay: `${index * 80}ms`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <span className="mt-2 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-orange-500 shadow-[0_0_0_6px_rgba(244,114,36,0.14)] transition-transform duration-300 group-hover:scale-105"></span>
                    <span className="flex-1 text-sm leading-relaxed text-gray-700 transition-colors duration-300 group-hover:text-gray-900">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {hasMoreFeatures && !expanded && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/70 to-transparent"></div>
              )}
            </div>

            {hasMoreFeatures && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full border-orange-200 bg-white text-orange-600 hover:bg-orange-50"
                  onClick={() => setExpanded((prev) => !prev)}
                >
                  {expanded
                    ? t('subscription.card.showLess', 'Show less')
                    : t('subscription.card.showMore', 'View all features')}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Footer with CTA */}
      <CardFooter className="relative z-10 px-6 pb-6 pt-4">
        <div className="w-full space-y-2">
          <Button
            onClick={() => onSelect?.(pkg._id)}
            disabled={disabled}
            className={`group/button w-full rounded-full text-base font-semibold transition-all duration-300 ${
              isCurrentPackage
                ? 'bg-green-600 text-white shadow-md shadow-green-500/30 hover:bg-green-700 disabled:hover:translate-y-0'
                : isPopular
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 hover:-translate-y-0.5'
                  : 'bg-white text-orange-700 border-2 border-orange-500 hover:bg-orange-50 hover:-translate-y-0.5 shadow-md shadow-orange-200/60'
            } disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none`}
            size="lg"
          >
            <span className="relative inline-block">
              {isCurrentPackage ? (
                t('subscription.card.renew')
              ) : (
                <>
                  <span className="transition-opacity duration-300 group-hover/button:opacity-0">
                    {t('subscription.card.buyNow')}
                  </span>
                  <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/button:opacity-100">
                    {t('subscription.card.buyNowArrow')}
                  </span>
                </>
              )}
            </span>
          </Button>

          {disabled && (
            <p className="text-center text-xs text-gray-500">
              {t('subscription.card.downgradeDisabled', 'You are already on a higher package')}
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
