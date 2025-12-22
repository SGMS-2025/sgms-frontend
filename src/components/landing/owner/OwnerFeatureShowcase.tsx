import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollReveal from '@/components/common/ScrollReveal';
import { Badge } from '@/components/ui/badge';
import { resolveIcon } from '@/utils/iconResolver';

const OwnerFeatureShowcase = () => {
  const { t } = useTranslation();

  // Lấy dữ liệu features từ translation keys
  const ownerFeatures = [
    {
      title: t('owner.features.item_1.title'),
      description: t('owner.features.item_1.description'),
      icon: 'LayoutDashboard',
      highlights: [t('owner.features.item_1.highlight_1'), t('owner.features.item_1.highlight_2')]
    },
    {
      title: t('owner.features.item_2.title'),
      description: t('owner.features.item_2.description'),
      icon: 'Workflow',
      highlights: [t('owner.features.item_2.highlight_1'), t('owner.features.item_2.highlight_2')]
    },
    {
      title: t('owner.features.item_3.title'),
      description: t('owner.features.item_3.description'),
      icon: 'CalendarRange',
      highlights: [t('owner.features.item_3.highlight_1'), t('owner.features.item_3.highlight_2')]
    }
  ];

  // Lấy dữ liệu integrations từ translation keys
  const ownerIntegrations = [
    {
      name: t('owner.features.integration.item_1.name'),
      description: t('owner.features.integration.item_1.description')
    },
    {
      name: t('owner.features.integration.item_2.name'),
      description: t('owner.features.integration.item_2.description')
    },
    {
      name: t('owner.features.integration.item_3.name'),
      description: t('owner.features.integration.item_3.description')
    }
  ];

  return (
    <section id="owner-features" className="bg-gradient-to-b from-slate-50 via-white to-orange-50/30 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-orange-500">
            {t('owner.features.badge')}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t('owner.features.title')}
          </h2>
          <p className="mt-4 text-base text-slate-600">{t('owner.features.subtitle')}</p>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {ownerFeatures.map((feature, index) => {
            const IconComponent = resolveIcon(feature.icon);

            return (
              <ScrollReveal key={feature.title} delay={index * 120}>
                <Card className="h-full border border-orange-100/70 bg-white/80 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.45)]">
                  <CardHeader className="space-y-4">
                    <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-slate-900">{feature.title}</CardTitle>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    {feature.highlights.map((item) => (
                      <div key={item} className="flex items-start gap-2 rounded-xl bg-orange-50/70 p-3 text-left">
                        <span className="mt-0.5 inline-flex size-2.5 shrink-0 rounded-full bg-orange-500" />
                        <p>{item}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal className="mt-20 rounded-3xl border border-orange-100 bg-white/90 p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <Badge className="rounded-full border border-orange-200 bg-orange-50 text-orange-600">
                {t('owner.features.integration.badge')}
              </Badge>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">{t('owner.features.integration.title')}</h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{t('owner.features.integration.description')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {ownerIntegrations.map((integration) => (
                <div key={integration.name} className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <p className="text-sm font-semibold text-orange-600">{integration.name}</p>
                  <p className="mt-2 text-xs text-orange-700/80">{integration.description}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default OwnerFeatureShowcase;
