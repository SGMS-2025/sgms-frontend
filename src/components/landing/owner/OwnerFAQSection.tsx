import { useTranslation } from 'react-i18next';
import ScrollReveal from '@/components/common/ScrollReveal';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ownerFaqs } from '@/constants/ownerLanding';

const OwnerFAQSection = () => {
  const { t } = useTranslation();

  return (
    <section id="owner-faq" className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <Badge className="rounded-full border border-orange-200 bg-orange-50 text-orange-600">
            {t('owner.faq.badge')}
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{t('owner.faq.title')}</h2>
          <p className="mt-4 text-base text-slate-600">{t('owner.faq.subtitle')}</p>
        </ScrollReveal>

        <ScrollReveal className="mt-14 rounded-3xl border border-orange-100 bg-white/80 p-6 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.35)] backdrop-blur">
          <Accordion type="single" collapsible className="space-y-3">
            {ownerFaqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${index}`}
                className="overflow-hidden rounded-2xl border border-orange-100 bg-white transition-all duration-300 hover:shadow-md"
              >
                <AccordionTrigger className="px-6 py-5 text-left text-base font-semibold text-slate-900 hover:text-orange-600 transition-colors duration-200 group">
                  <span className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 text-sm leading-relaxed text-slate-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default OwnerFAQSection;
