import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, ArrowRight, ChevronRight } from 'lucide-react';
import type { LandingPageProps } from '@/types/pages/landing';
import { OFFERS, getOfferDescription } from '@/constants/landing-data';

const OffersSection: React.FC<LandingPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section id="offers" className={`py-24 px-4 bg-slate-50 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-slate-900 mb-4 tracking-tight">
            {t('landing.offers.title')
              .split('{highlight}')
              .map((part, index) =>
                index === 0 ? (
                  part
                ) : (
                  <React.Fragment key={index}>
                    <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
                      {t('landing.offers.highlight')}
                    </span>
                    {part}
                  </React.Fragment>
                )
              )}
          </h2>
          <p className="text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
            {t('landing.offers.subtitle')}
          </p>
        </div>

        {/* Offers Grid - Relume.io Style (Expandable) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {OFFERS.map((offer, i) => (
            <Card
              key={i}
              className="group bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden animate-fade-in hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Discount Badge */}
              {i === 1 && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg z-10">
                  -30%
                </div>
              )}
              <CardContent className="p-0 h-full flex flex-col">
                {/* Header with Category Tag */}
                <div className="p-4 sm:p-6 pb-4">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-600 border border-orange-200">
                    {offer.tag}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors duration-300 leading-tight mb-3">
                    {offer.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{getOfferDescription(offer.tag)}</p>
                </div>

                {/* Offer Details - Vertical layout with icons */}
                <div className="px-4 sm:px-6 pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      <span className="font-medium text-slate-700">{t('landing.offers.location')}</span>
                      <span className="text-slate-600">{offer.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      <span className="font-medium text-slate-700">{t('landing.offers.time')}</span>
                      <span className="text-slate-600">{offer.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="w-4 h-4 text-slate-600 font-bold flex-shrink-0">₫</span>
                      <span className="font-medium text-slate-700">{t('landing.offers.price')}</span>
                      <span className="text-slate-600">
                        {offer.price}
                        {t('landing.offers.price_unit')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Image Preview - 30-40% of card height */}
                <div className="px-4 sm:px-6 pb-4 flex-1">
                  <div className="h-32 rounded-xl overflow-hidden relative">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>

                {/* CTA Button - Rounded with hover effects */}
                <div className="px-4 sm:px-6 pb-6">
                  <Button
                    variant="outline"
                    className="w-full font-medium py-3 rounded-full group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-600 group-hover:text-white group-hover:border-orange-500 group-hover:scale-105 transition-all duration-300 shadow-sm group-hover:shadow-lg"
                    onClick={() => navigate('/login')}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {t('landing.offers.register_button')}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button - Relume style */}
        <div className="text-center mt-12 lg:mt-16">
          <div className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 cursor-pointer group">
            <span className="text-lg font-medium">{t('landing.offers.view_all')}</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
          <div className="mt-4 w-16 h-0.5 bg-gradient-to-r from-orange-500 to-purple-500 mx-auto group-hover:w-24 transition-all duration-300"></div>
        </div>
      </div>
    </section>
  );
};

export default OffersSection;
