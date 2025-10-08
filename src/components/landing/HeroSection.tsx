import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import type { LandingPageProps } from '@/types/pages/landing';
import backgroundImage from '@/assets/images/background1.png';

const HeroSection: React.FC<LandingPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userGoal, setUserGoal] = useState('');

  return (
    <section
      id="hero"
      className={`relative py-20 px-4 overflow-hidden min-h-[90vh] flex items-center bg-gradient-to-br from-slate-50 via-white to-slate-50 ${className}`}
    >
      {/* Modern Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-red-500/2 to-green-500/3"></div>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      ></div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-orange-400/5 rounded-full blur-2xl animate-pulse"></div>
        <div
          className="absolute top-40 right-32 w-24 h-24 bg-blue-400/5 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
        <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-purple-400/5 rounded-full blur-lg animate-pulse"></div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-16 items-center relative z-10">
        <div className="lg:col-span-6 space-y-6 lg:space-y-8 animate-fade-in order-2 lg:order-1 text-center lg:text-left">
          {/* Modern Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-200/50 rounded-full px-4 py-2 text-sm font-medium text-orange-600 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>{t('landing.hero.badge')}</span>
          </div>

          {/* Modern Title */}
          <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-bold text-slate-900 leading-tight tracking-tight">
            {(() => {
              const title = t('landing.hero.title');
              const fitness = t('landing.hero.fitness');
              const gymsmart = t('landing.hero.gymsmart');

              return title
                .replace('{fitness}', `<span class="fitness">${fitness}</span>`)
                .replace('{gymsmart}', `<span class="gymsmart">${gymsmart}</span>`)
                .split(/(<span class="(?:fitness|gymsmart)">.*?<\/span>)/)
                .map((part) => {
                  if (part.includes('class="fitness"')) {
                    return (
                      <span
                        key="fitness"
                        className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent"
                      >
                        {fitness}
                      </span>
                    );
                  }
                  if (part.includes('class="gymsmart"')) {
                    return (
                      <span
                        key="gymsmart"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                      >
                        {gymsmart}
                      </span>
                    );
                  }
                  return part;
                });
            })()}
          </h1>

          {/* Tagline */}
          <p className="text-[clamp(0.875rem,2vw,1.125rem)] max-w-lg mx-auto lg:mx-0 text-slate-600 leading-relaxed">
            {t('landing.hero.tagline')}
          </p>

          {/* Interactive Goal Input */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0">
              <Input
                type="text"
                placeholder={t('landing.hero.goal_placeholder')}
                value={userGoal}
                onChange={(e) => setUserGoal(e.target.value)}
                className="flex-1 px-4 py-3 text-sm rounded-xl bg-white/95 border border-slate-200 backdrop-blur-sm transition-all duration-300 focus:border-orange-300 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)] focus:bg-white"
              />
              <Button
                className="px-6 py-3 text-sm font-semibold rounded-xl whitespace-nowrap bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-[0_4px_14px_0_rgba(249,115,22,0.25)] hover:shadow-[0_6px_20px_0_rgba(249,115,22,0.4)] hover:-translate-y-0.5 transition-all duration-300"
                onClick={() => navigate('/login')}
              >
                {t('landing.hero.start_button')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto lg:mx-0">{t('landing.hero.goal_hint')}</p>
          </div>

          {/* Modern CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start">
            <Button
              className="px-8 py-4 text-base font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-[0_4px_14px_0_rgba(249,115,22,0.25)] hover:shadow-[0_6px_20px_0_rgba(249,115,22,0.4)] hover:-translate-y-0.5 transition-all duration-300"
              onClick={() => navigate('/login')}
            >
              {t('landing.hero.register_button')}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="px-8 py-4 text-base font-semibold rounded-xl bg-white/90 border border-orange-200 backdrop-blur-sm text-orange-600 hover:bg-orange-50 hover:border-orange-300 hover:-translate-y-0.5 transition-all duration-300"
            >
              {t('landing.hero.demo_button')}
            </Button>
          </div>

          {/* Compact Stats */}
          <div className="inline-flex items-center gap-4 sm:gap-6 text-sm bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4">
            <div className="text-center">
              <div className="text-orange-500 text-xl font-bold">500+</div>
              <div className="text-slate-600 text-xs">{t('landing.hero.stats.members')}</div>
            </div>
            <div className="w-px h-8 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-orange-500 text-xl font-bold">4.9/5</div>
              <div className="text-slate-600 text-xs">{t('landing.hero.stats.rating')}</div>
            </div>
            <div className="w-px h-8 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-orange-500 text-xl font-bold">50+</div>
              <div className="text-slate-600 text-xs">{t('landing.hero.stats.trainers')}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 relative animate-fade-in order-1 lg:order-2">
          <div className="relative">
            <img
              src={backgroundImage}
              alt={t('landing.hero.image_alt')}
              className="w-full h-[300px] sm:h-[400px] lg:h-[550px] object-cover object-center rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_35px_60px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent rounded-2xl"></div>

            {/* Floating Badge */}
            <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg border border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {t('landing.hero.floating_badge')}
              </div>
            </div>

            {/* Rating Badge */}
            <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/20">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-700">4.9</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
