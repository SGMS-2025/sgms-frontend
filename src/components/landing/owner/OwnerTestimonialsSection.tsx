import { Quote, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ScrollReveal from '@/components/common/ScrollReveal';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ownerTestimonials } from '@/constants/ownerLanding';

const OwnerTestimonialsSection = () => {
  const { t } = useTranslation();

  return (
    <section
      id="owner-testimonials"
      className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-white to-orange-100/40 py-24"
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-orange-200/30 to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-orange-500">
            {t('owner.testimonials.badge')}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t('owner.testimonials.title')}
          </h2>
          <p className="mt-4 text-base text-slate-600">{t('owner.testimonials.subtitle')}</p>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {ownerTestimonials.map((testimonial, index) => (
            <ScrollReveal
              key={testimonial.name}
              delay={index * 140}
              className="h-full rounded-3xl border border-orange-100 bg-white/90 p-8 shadow-[0_35px_70px_-45px_rgba(249,115,22,0.45)] backdrop-blur"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback className="bg-orange-100 text-orange-500">
                        <Quote className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 text-left">
                      <p className="text-base font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
                <blockquote className="text-lg font-medium leading-relaxed text-slate-800">
                  “{testimonial.quote}”
                </blockquote>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-orange-600">{testimonial.result}</span>
                  <div className="flex items-center gap-1 text-orange-500">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={`star-${testimonial.name}-${starIndex}`}
                        className={`h-4 w-4 ${starIndex < Math.round(testimonial.rating) ? 'fill-orange-500 text-orange-500' : 'text-orange-200'}`}
                      />
                    ))}
                    <span className="ml-1 text-xs font-medium text-slate-500">{testimonial.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OwnerTestimonialsSection;
