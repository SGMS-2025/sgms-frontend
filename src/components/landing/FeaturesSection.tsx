import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { LandingPageProps } from '@/types/pages/landing';
import { FEATURES } from '@/constants/landing-data';

const FeaturesSection: React.FC<LandingPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className={`py-24 px-4 bg-slate-50 relative overflow-hidden ${className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-slate-900 mb-4 tracking-tight">
            {t('landing.features.title')
              .split('{highlight}')
              .map((part, index) =>
                index === 0 ? (
                  part
                ) : (
                  <React.Fragment key={index}>
                    <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
                      {t('landing.features.highlight')}
                    </span>
                    {part}
                  </React.Fragment>
                )
              )}
          </h2>
          <p className="text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
            {t('landing.features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {FEATURES.map((feature, i) => (
            <Card
              key={i}
              className="group p-4 sm:p-6 bg-white border border-slate-200/50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardContent className="p-0 text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm group-hover:text-slate-700 transition-colors duration-300">
                  {feature.description}
                </p>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 lg:mt-16">
          <Button
            className="bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-white"
            onClick={() => navigate('/login')}
          >
            {t('landing.features.cta_button')}
          </Button>
          <p className="text-slate-500 mt-4 font-sans text-sm sm:text-base px-4">
            {t('landing.features.cta_subtitle')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
