import { ArrowRight, Sparkles, Users2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ScrollReveal from '@/components/common/ScrollReveal';
import TypingEffect from '@/components/ui/typing-effect';
import YouTubeBackground from '@/components/ui/youtube-background';

const OwnerHeroSection = () => {
  const { t } = useTranslation();

  const heroHighlights = [
    {
      icon: Sparkles,
      title: t('owner.hero.highlight_1.title'),
      description: t('owner.hero.highlight_1.description')
    },
    {
      icon: Users2,
      title: t('owner.hero.highlight_2.title'),
      description: t('owner.hero.highlight_2.description')
    }
  ];
  return (
    <section id="owner-hero" className="relative overflow-hidden text-slate-900 min-h-[60vh] flex items-center">
      {/* Background YouTube Video */}
      <YouTubeBackground videoId="cqhsByqdKg8" overlay={true} blur={true} className="z-0" />

      <div className="relative z-30 mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          <ScrollReveal delay={100}>
            <Badge className="border border-orange-100 bg-white text-sm font-medium uppercase tracking-wider text-orange-600 shadow-sm">
              {t('owner.hero.badge')}
            </Badge>
          </ScrollReveal>

          <ScrollReveal>
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl min-h-[160px] sm:min-h-[180px] lg:min-h-[200px] flex flex-col justify-center">
              <div className="min-h-[1.2em] flex items-center">
                <TypingEffect
                  texts={[t('owner.hero.typing_text_1'), t('owner.hero.typing_text_2'), t('owner.hero.typing_text_3')]}
                  speed={80}
                  deleteSpeed={40}
                  pauseTime={3000}
                  className="block"
                />
              </div>
              <span className="block bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 bg-clip-text text-transparent mt-2">
                {t('owner.hero.with_gymsmart')}
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <p className="max-w-2xl mx-auto text-lg text-slate-600">{t('owner.hero.description')}</p>
          </ScrollReveal>

          <ScrollReveal className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-8 text-base font-semibold text-white shadow-[0_18px_36px_-12px_rgba(37,99,235,0.45)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.6)]"
            >
              {t('owner.hero.try_button')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-12 rounded-full border-2 border-orange-500 bg-white px-8 text-base font-semibold text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300"
            >
              {t('owner.hero.demo_button')}
            </Button>
          </ScrollReveal>

          {/* Simplified social proof */}
          <ScrollReveal className="flex justify-center gap-8">
            {heroHighlights.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white/80 px-4 py-3 shadow-lg"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex size-8 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </div>

      {/* Decorative connector line */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent via-orange-100/30 to-orange-200/50">
        <div className="flex items-center justify-center h-full">
          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
        </div>
      </div>
    </section>
  );
};

export default OwnerHeroSection;
