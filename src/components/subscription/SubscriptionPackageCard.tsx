import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users } from 'lucide-react';
import type { SubscriptionPackage } from '@/types/api/Subscription';

interface SubscriptionPackageCardProps {
  package: SubscriptionPackage;
  isCurrentPackage?: boolean;
  isLowerTier?: boolean;
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

  return (
    <Card
      className={`group relative overflow-hidden bg-white rounded-2xl shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
        isPopular ? 'ring-2 ring-orange-500 scale-105 hover:scale-110' : 'hover:scale-105'
      } ${isCurrentPackage ? 'ring-2 ring-green-500' : ''}`}
    >
      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-100/0 group-hover:from-orange-50/50 group-hover:to-orange-100/30 transition-all duration-500 pointer-events-none"></div>

      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-b-lg shadow-lg animate-pulse hover:animate-none">
          <span className="inline-block animate-bounce">⭐</span> {t('subscription.card.popular')}
        </div>
      )}

      {/* Current Package Badge */}
      {isCurrentPackage && (
        <div className="absolute top-0 left-0 z-10 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-br-lg shadow-lg animate-pulse">
          ✓ {t('subscription.card.currentPackage')}
        </div>
      )}

      {/* Header */}
      <CardHeader className="pt-6 pb-4 relative z-10">
        <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
          {pkg.name}
        </CardTitle>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-orange-600 group-hover:scale-110 inline-block transition-transform duration-300">
              {formatPrice(pkg.price)}
            </span>
            <span className="text-gray-600 text-sm">{t('subscription.card.perMonth')}</span>
          </div>
        </div>
        {pkg.description && (
          <CardDescription className="text-gray-600 mt-2 text-sm group-hover:text-gray-700 transition-colors duration-300">
            {pkg.description}
          </CardDescription>
        )}
      </CardHeader>

      {/* Features */}
      <CardContent className="py-4 px-6 relative z-10">
        <div className="space-y-4">
          {/* Branch & Customer Limits - Enhanced Design */}
          <div className="grid grid-cols-2 gap-3 pb-4 border-b border-gray-200 group-hover:border-orange-300 transition-colors duration-300">
            {/* Branch Limit */}
            <div className="group/limit relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent rounded-xl opacity-0 group-hover/limit:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-600 font-medium mb-0.5">{t('subscription.card.branch')}</div>
                  <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {pkg.maxBranches}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Limit */}
            <div className="group/limit relative bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-3 border border-green-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-green-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent rounded-xl opacity-0 group-hover/limit:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-sm">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-600 font-medium mb-0.5">{t('subscription.card.customer')}</div>
                  <div className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                    {pkg.maxCustomers.toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          {pkg.features && pkg.features.length > 0 && (
            <div className="space-y-3">
              {pkg.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 group/feature opacity-0 animate-fade-in"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0 group-hover/feature:scale-150 group-hover/feature:bg-orange-600 transition-all duration-300 group-hover/feature:shadow-lg group-hover/feature:shadow-orange-500/50"></div>
                  <span className="text-sm text-gray-700 leading-relaxed group-hover/feature:text-gray-900 group-hover/feature:font-medium transition-all duration-300">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer with CTA */}
      <CardFooter className="pt-4 pb-6 px-6 relative z-10">
        <Button
          onClick={() => onSelect?.(pkg._id)}
          disabled={disabled}
          className={`w-full h-12 text-base font-semibold transition-all duration-300 transform group/btn ${
            isCurrentPackage
              ? 'bg-green-600 hover:bg-green-700 text-white cursor-not-allowed hover:scale-100'
              : isPopular
                ? 'bg-orange-500 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/50 text-white hover:scale-105 active:scale-95'
                : 'bg-white hover:bg-orange-50 text-gray-700 border-2 border-orange-500 hover:border-orange-600 hover:shadow-md hover:scale-105 active:scale-95'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          size="lg"
        >
          <span className="relative inline-block">
            {isCurrentPackage ? (
              t('subscription.card.renew')
            ) : (
              <>
                <span className="group-hover/btn:opacity-0 transition-opacity duration-300">
                  {t('subscription.card.buyNow')}
                </span>
                <span className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">
                  {t('subscription.card.buyNowArrow')}
                </span>
              </>
            )}
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
};
