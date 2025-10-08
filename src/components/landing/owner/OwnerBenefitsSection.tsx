import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollReveal from '@/components/common/ScrollReveal';
import { ownerBenefits } from '@/constants/ownerLanding';

const OwnerBenefitsSection = () => {
  const { t } = useTranslation();

  return (
    <section id="owner-benefits" className="bg-white py-24 relative">
      {/* Decorative connector line from hero */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-orange-200/50 via-orange-100/30 to-transparent">
        <div className="flex items-center justify-center h-full">
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-orange-500">
            {t('owner.benefits.badge')}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t('owner.benefits.title')}
          </h2>
          <p className="mt-4 text-base text-slate-600">{t('owner.benefits.subtitle')}</p>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {ownerBenefits.map((benefit, index) => (
            <ScrollReveal key={benefit.title} delay={index * 120}>
              <Card className="h-full border border-orange-100/80 shadow-[0_18px_36px_-24px_rgba(249,115,22,0.45)] transition-transform hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-slate-900">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-slate-600">
                  <p>{benefit.description}</p>
                  <div className="rounded-2xl bg-orange-50/80 p-4 text-sm text-orange-700">
                    <p className="font-semibold uppercase tracking-wide text-[11px] text-orange-500">
                      {t('owner.benefits.gymsmart_handles')}
                    </p>
                    <p className="mt-1 font-medium">{benefit.painPoint}</p>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OwnerBenefitsSection;
