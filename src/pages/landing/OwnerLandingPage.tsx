import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/BaseHeader';
import { Footer } from '@/components/layout/BaseFooter';
import { ScrollingBanner } from '@/components/layout/ScrollingBanner';
import OwnerHeroSection from '@/components/landing/owner/OwnerHeroSection';
import OwnerBenefitsSection from '@/components/landing/owner/OwnerBenefitsSection';
import OwnerFeatureShowcase from '@/components/landing/owner/OwnerFeatureShowcase';
import OwnerAutomationSection from '@/components/landing/owner/OwnerAutomationSection';
import OwnerTimelineSection from '@/components/landing/owner/OwnerTimelineSection';
import OwnerPricingSection from '@/components/landing/owner/OwnerPricingSection';
import OwnerTestimonialsSection from '@/components/landing/owner/OwnerTestimonialsSection';
import OwnerFAQSection from '@/components/landing/owner/OwnerFAQSection';
import FloatingContactPopup from '@/components/ui/floating-contact-popup';
const OwnerLandingPage = () => {
  const { t } = useTranslation();
  useScrollToTop();

  const ownerMenuItems = [
    { id: 'owner-hero', label: t('owner.menu.overview'), href: '#owner-hero' },
    { id: 'owner-benefits', label: t('owner.menu.problems'), href: '#owner-benefits' },
    { id: 'owner-features', label: t('owner.menu.features'), href: '#owner-features' },
    { id: 'owner-automation', label: t('owner.menu.automation'), href: '#owner-automation' },
    { id: 'owner-pricing', label: t('owner.menu.pricing'), href: '#owner-pricing' },
    {
      id: 'owner-more',
      label: t('owner.menu.more'),
      href: '#owner-timeline',
      children: [
        { id: 'owner-timeline', label: t('owner.menu.timeline'), href: '#owner-timeline' },
        { id: 'owner-testimonials', label: t('owner.menu.testimonials'), href: '#owner-testimonials' },
        { id: 'owner-faq', label: t('owner.menu.faq'), href: '#owner-faq' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header menuItems={ownerMenuItems} />
      <main>
        <OwnerHeroSection />
        <OwnerBenefitsSection />
        <OwnerFeatureShowcase />
        <OwnerAutomationSection />
        <OwnerTimelineSection />
        <OwnerPricingSection />
        <OwnerTestimonialsSection />
        <OwnerFAQSection />
        <ScrollingBanner />
      </main>
      <Footer />
      <FloatingContactPopup />
    </div>
  );
};

export default OwnerLandingPage;
