import { useTranslation } from 'react-i18next';
import ScrollReveal from '@/components/common/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const OwnerPricingSection = () => {
  const { t } = useTranslation();

  // Lấy dữ liệu pricing từ translation keys
  const ownerPricing = [
    {
      name: t('owner.pricing.item_1.name'),
      price: t('owner.pricing.item_1.price'),
      description: t('owner.pricing.item_1.description'),
      features: [
        t('owner.pricing.item_1.feature_1'),
        t('owner.pricing.item_1.feature_2'),
        t('owner.pricing.item_1.feature_3'),
        t('owner.pricing.item_1.feature_4')
      ],
      cta: t('owner.pricing.item_1.cta')
    },
    {
      name: t('owner.pricing.item_2.name'),
      price: t('owner.pricing.item_2.price'),
      description: t('owner.pricing.item_2.description'),
      badge: t('owner.pricing.item_2.badge'),
      features: [
        t('owner.pricing.item_2.feature_1'),
        t('owner.pricing.item_2.feature_2'),
        t('owner.pricing.item_2.feature_3'),
        t('owner.pricing.item_2.feature_4'),
        t('owner.pricing.item_2.feature_5')
      ],
      cta: t('owner.pricing.item_2.cta'),
      mostPopular: true
    },
    {
      name: t('owner.pricing.item_3.name'),
      price: t('owner.pricing.item_3.price'),
      description: t('owner.pricing.item_3.description'),
      features: [
        t('owner.pricing.item_3.feature_1'),
        t('owner.pricing.item_3.feature_2'),
        t('owner.pricing.item_3.feature_3'),
        t('owner.pricing.item_3.feature_4'),
        t('owner.pricing.item_3.feature_5')
      ],
      cta: t('owner.pricing.item_3.cta')
    }
  ];

  return (
    <section
      id="owner-pricing"
      className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-white to-white py-24"
    >
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-orange-200/40 to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <Badge className="rounded-full border border-orange-200 bg-white text-orange-600 shadow-sm">
            {t('owner.pricing.badge')}
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t('owner.pricing.title')}
          </h2>
          <p className="mt-4 text-base text-slate-600">{t('owner.pricing.subtitle')}</p>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {ownerPricing.map((plan, index) => (
            <ScrollReveal
              key={plan.name}
              delay={index * 100}
              className={`pricing-card group relative flex h-full flex-col rounded-3xl border border-orange-100 bg-white p-8 shadow-[0_35px_80px_-45px_rgba(249,115,22,0.55)] ${
                plan.mostPopular ? 'ring-2 ring-orange-400 scale-105' : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 w-max -translate-x-1/2 rounded-full border border-orange-100 bg-orange-500 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-lg">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-3 transition-all duration-300">
                <h3 className="text-2xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-orange-700">
                  {plan.name}
                </h3>
                <p className="text-3xl font-bold text-orange-600 transition-all duration-300 group-hover:scale-105">
                  {plan.price}
                </p>
                <p className="text-sm text-slate-500 transition-colors duration-300 group-hover:text-slate-600">
                  {plan.description}
                </p>
              </div>

              <div className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <div
                    key={feature}
                    className="feature-item flex items-start gap-3 text-sm text-slate-600"
                    style={{ transitionDelay: `${featureIndex * 50}ms` }}
                  >
                    <span className="mt-1 inline-flex size-2.5 rounded-full bg-orange-500 transition-all duration-300 group-hover:scale-110 group-hover:bg-orange-600" />
                    <span className="transition-all duration-300 group-hover:translate-x-1">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className={`mt-8 h-12 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  plan.mostPopular
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_25px_45px_-25px_rgba(249,115,22,0.75)] hover:from-orange-600 hover:to-orange-700'
                    : 'bg-white text-orange-600 shadow-[0_18px_40px_-30px_rgba(249,115,22,0.4)] hover:bg-orange-50 hover:text-orange-700'
                }`}
              >
                {plan.cta}
              </Button>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OwnerPricingSection;
