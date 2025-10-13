import { useTranslation } from 'react-i18next';
import ScrollReveal from '@/components/common/ScrollReveal';
import { Badge } from '@/components/ui/badge';
import { ownerTimeline } from '@/constants/ownerLanding';
import { resolveIcon } from '@/utils/iconResolver';

const OwnerTimelineSection = () => {
  const { t } = useTranslation();

  return (
    <section id="owner-timeline" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <Badge className="rounded-full border border-orange-200 bg-orange-50 text-orange-600">
            {t('owner.timeline.badge')}
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t('owner.timeline.title')}
          </h2>
          <p className="mt-4 text-base text-slate-600">{t('owner.timeline.subtitle')}</p>
        </ScrollReveal>

        <div className="relative mt-16">
          <div className="relative grid gap-8 lg:grid-cols-3">
            <div className="pointer-events-none absolute top-12 hidden h-[2px] w-full translate-y-[-1px] bg-gradient-to-r from-orange-200 via-orange-100 to-transparent lg:block" />
            {ownerTimeline.map((step, index) => {
              const IconComponent = resolveIcon(step.icon);

              return (
                <ScrollReveal
                  key={step.title}
                  delay={index * 140}
                  className="relative rounded-3xl border border-orange-100 bg-white/85 p-6 shadow-[0_30px_60px_-38px_rgba(249,115,22,0.45)] backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex size-12 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-orange-500 shadow-inner">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">Bước {index + 1}</p>
                      <p className="text-sm font-medium text-slate-500">{step.duration}</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                    <p className="text-sm text-slate-600">{step.description}</p>
                    <div className="grid gap-2">
                      {step.highlights.map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-3 text-sm text-slate-600"
                        >
                          <span className="mt-1 inline-flex size-2 rounded-full bg-orange-500" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {index < ownerTimeline.length - 1 && (
                    <div className="pointer-events-none absolute inset-y-0 right-[-18px] hidden w-9 items-center justify-center lg:flex">
                      <div className="h-px w-full bg-gradient-to-r from-orange-200 to-transparent" />
                    </div>
                  )}
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OwnerTimelineSection;
