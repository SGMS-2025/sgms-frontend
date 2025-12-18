import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Bell, HelpCircle, Menu, X, Home, Gift, Dumbbell, Users, Star, Building2, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from '@/assets/images/logo2.png';
import { AuthenticatedNavbar } from './AuthenticatedNavbar';
import { MobileAuthenticatedMenu } from './MobileAuthenticatedMenu';
import { useIsAuthenticated } from '@/hooks/useAuth';
import { DynamicNavigation } from '@/components/ui/dynamic-navigation';
import LanguageSwitcher from '@/components/ui/language-switcher';

type HeaderMenuItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly icon?: ReactNode;
  readonly children?: HeaderMenuItem[];
};

interface HeaderProps {
  readonly menuItems?: ReadonlyArray<HeaderMenuItem>;
  readonly customActions?: ReactNode; // Custom actions to display in header
  readonly showLandingToggle?: boolean; // Show toggle between customer/owner landing
}

export function Header({ menuItems, customActions, showLandingToggle = true }: HeaderProps) {
  const { t } = useTranslation();

  const defaultMenuItems: HeaderMenuItem[] = useMemo(
    () => [
      { id: 'hero', label: t('navbar.home'), href: '#', icon: <Home className="w-4 h-4" /> },
      { id: 'offers', label: t('navbar.offers'), href: '#offers', icon: <Gift className="w-4 h-4" /> },
      { id: 'gyms', label: t('navbar.gyms'), href: '#gyms', icon: <Dumbbell className="w-4 h-4" /> },
      { id: 'trainers', label: t('navbar.trainers'), href: '#trainers', icon: <Users className="w-4 h-4" /> },
      { id: 'reviews', label: t('navbar.reviews'), href: '#reviews', icon: <Star className="w-4 h-4" /> }
    ],
    [t]
  );

  const navigationItems = useMemo(
    () => (menuItems?.length ? menuItems : defaultMenuItems),
    [menuItems, defaultMenuItems]
  );
  const flattenedNavigationItems = useMemo(() => {
    const items: HeaderMenuItem[] = [];
    navigationItems.forEach((item) => {
      if (item.children && item.children.length > 0) {
        items.push(...item.children);
      } else {
        items.push(item);
      }
    });
    return items;
  }, [navigationItems]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(() => flattenedNavigationItems[0]?.id ?? '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const isOwnerLandingPage = location.pathname.startsWith('/owners');
  const isCustomerLandingPage = !isOwnerLandingPage;

  const handleLandingNavigation = (path: string, closeMenu = false) => {
    if (location.pathname === path) {
      if (closeMenu) {
        setIsMobileMenuOpen(false);
      }
      return;
    }

    navigate(path);

    if (closeMenu) {
      setIsMobileMenuOpen(false);
    }

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLandingToggle = (closeMenu = false) => {
    const targetPath = isCustomerLandingPage ? '/owners' : '/';
    handleLandingNavigation(targetPath, closeMenu);
  };

  const landingToggleLabel = isCustomerLandingPage ? t('navbar.switch_to_owner') : t('navbar.back_to_customer');

  const landingToggleIcon = isCustomerLandingPage ? (
    <Building2 className="w-4 h-4" />
  ) : (
    <Sparkles className="w-4 h-4" />
  );

  const landingToggleMobileText = isCustomerLandingPage ? t('navbar.view_owner_page') : t('navbar.view_customer_page');

  // Helper functions for class names
  const getHeaderClasses = () => {
    if (isScrolled) {
      return 'bg-white/95 backdrop-blur-md shadow-lg py-3 border-b border-orange-100/50';
    }
    return 'bg-white/90 backdrop-blur-sm py-4';
  };

  const getLogoClasses = () => {
    return isScrolled ? 'scale-90' : 'scale-100';
  };

  const getSignUpButtonClasses = () => {
    const baseClasses = 'transition-all duration-300 rounded-full text-sm';

    if (isScrolled) {
      return `${baseClasses} text-orange-500 bg-orange-50 hover:bg-orange-100`;
    }
    return `${baseClasses} text-orange-500 bg-white hover:bg-orange-600 hover:text-white`;
  };

  const getSignInButtonClasses = () => {
    const baseClasses = 'transition-all duration-300 rounded-full text-sm px-6';

    if (isScrolled) {
      return `${baseClasses} bg-orange-500 hover:bg-orange-600 text-white shadow-lg`;
    }
    return `${baseClasses} bg-orange-600 hover:bg-orange-700 text-white`;
  };

  const getMobileMenuItemClasses = (itemId: string) => {
    const baseClasses = 'block w-full text-left py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300';

    if (activeSection === itemId) {
      return `${baseClasses} bg-white text-gray-900 shadow-sm`;
    }
    return `${baseClasses} text-gray-700 hover:text-gray-900 hover:bg-white/50`;
  };

  const getMobileSubItemClasses = (itemId: string) => {
    const baseClasses = 'block w-full text-left py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300';

    if (activeSection === itemId) {
      return `${baseClasses} bg-white text-gray-900 shadow-sm`;
    }
    return `${baseClasses} text-gray-600 hover:text-gray-900 hover:bg-white/60`;
  };

  useEffect(() => {
    if (!flattenedNavigationItems.length) {
      return;
    }

    const hasCurrent = flattenedNavigationItems.some((item) => item.id === activeSection);
    if (!hasCurrent) {
      setActiveSection(flattenedNavigationItems[0].id);
    }
  }, [flattenedNavigationItems, activeSection]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100);

      // Update active section based on scroll position
      const sections = flattenedNavigationItems.map((item) => document.getElementById(item.id.replace('#', '')));
      const scrollPosition = scrollTop + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(flattenedNavigationItems[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [flattenedNavigationItems]);

  const scrollToSection = (sectionId: string) => {
    const targetId = sectionId.replace('#', '');
    const element = document.getElementById(targetId);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (targetId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setIsMobileMenuOpen(false);
  };

  const hasNestedMenus = useMemo(
    () => navigationItems.some((item) => item.children && item.children.length > 0),
    [navigationItems]
  );

  const renderDropdownChild = (child: HeaderMenuItem) => (
    <DropdownMenuItem
      key={child.id}
      className={activeSection === child.id ? 'font-semibold text-orange-600 focus:bg-orange-50' : ''}
      onClick={() => scrollToSection(child.id)}
    >
      {child.label}
    </DropdownMenuItem>
  );

  const renderDesktopDropdown = (item: HeaderMenuItem) => {
    const isParentActive = item.children?.some((child) => child.id === activeSection);
    const triggerClasses = `rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 border border-transparent ${
      isParentActive ? 'bg-white text-gray-900 shadow-md border-orange-100' : 'text-gray-600 hover:text-gray-900'
    }`;

    return (
      <DropdownMenu key={item.id}>
        <DropdownMenuTrigger asChild>
          <button className={triggerClasses}>{item.label}</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[220px] rounded-2xl border border-orange-100 bg-white/95 shadow-lg"
        >
          {item.children?.map(renderDropdownChild)}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderDesktopLeaf = (item: HeaderMenuItem) => {
    const isActive = activeSection === item.id;

    return (
      <button
        key={item.id}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
          isActive ? 'bg-white text-gray-900 shadow-md border border-orange-100' : 'text-gray-600 hover:text-gray-900'
        }`}
        onClick={() => scrollToSection(item.id)}
      >
        {item.label}
      </button>
    );
  };

  const renderDesktopNavigation = () => {
    if (!hasNestedMenus) {
      return (
        <DynamicNavigation
          links={navigationItems}
          activeLink={activeSection}
          onLinkClick={(id) => scrollToSection(id)}
          variant="modern"
          size="md"
          isScrolled={isScrolled}
          enableRipple={true}
          showLabelsOnMobile={false}
          className="mx-2"
        />
      );
    }

    return (
      <div className="flex items-center gap-2">
        {navigationItems.map((item) =>
          item.children && item.children.length > 0 ? renderDesktopDropdown(item) : renderDesktopLeaf(item)
        )}
      </div>
    );
  };

  const renderMobileSubItem = (child: HeaderMenuItem) => (
    <button key={child.id} onClick={() => scrollToSection(child.id)} className={getMobileSubItemClasses(child.id)}>
      {child.label}
    </button>
  );

  const renderMobileBranch = (item: HeaderMenuItem) => (
    <div key={item.id} className="rounded-xl bg-white/80 p-2">
      <p className="px-3 py-2 text-sm font-semibold text-gray-700">{item.label}</p>
      <div className="space-y-1">{item.children?.map(renderMobileSubItem)}</div>
    </div>
  );

  const renderMobileLeaf = (item: HeaderMenuItem) => (
    <button key={item.id} onClick={() => scrollToSection(item.id)} className={getMobileMenuItemClasses(item.id)}>
      {item.label}
    </button>
  );

  // Render landing toggle button only if showLandingToggle is true
  const landingToggleButton = showLandingToggle ? (
    <button
      type="button"
      className={`hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-200 ${
        isOwnerLandingPage
          ? 'border-orange-500 bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 text-white shadow-lg hover:from-orange-500/90 hover:via-orange-500/90 hover:to-amber-400/90'
          : 'border-orange-200 text-orange-500 hover:bg-orange-50'
      }`}
      onClick={() => handleLandingToggle()}
      title={landingToggleLabel}
      aria-label={landingToggleLabel}
      aria-pressed={isOwnerLandingPage}
    >
      {landingToggleIcon}
      <span className="sr-only">{landingToggleLabel}</span>
    </button>
  ) : null;

  return (
    <>
      {/* Top notification bar - Hidden when scrolled */}
      {!isScrolled && (
        <nav className="bg-orange-500 text-white px-4 py-1.5 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-end">
            {/* Right side items */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 cursor-pointer hover:text-orange-200 transition-colors text-sm">
                <Bell className="w-3.5 h-3.5" />
                <span>{t('navbar.notifications')}</span>
              </div>
              <div className="flex items-center space-x-1 cursor-pointer hover:text-orange-200 transition-colors text-sm">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{t('navbar.support')}</span>
              </div>
              {/* Language Switcher */}
              <LanguageSwitcher variant="notification" />
            </div>
          </div>
        </nav>
      )}

      {/* Main header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${getHeaderClasses()}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            className={`flex items-center gap-3 transition-all duration-300 hover:scale-105 focus:scale-105 focus:outline-none ${getLogoClasses()}`}
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label={t('navbar.back_to_customer_page')}
          >
            <div className="transition-transform duration-300 hover:rotate-12">
              <img src={logoImage} alt="Gym Smart Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold transition-colors duration-300 hover:text-gray-600">
                <span className="text-orange-500">GYM</span>
                <span className="text-slate-800 ml-1">SMART</span>
              </h1>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">{renderDesktopNavigation()}</div>

          {/* Auth buttons */}
          <div className="flex items-center space-x-2">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Show different content based on authentication */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2">
                {customActions}
                {landingToggleButton}
                <AuthenticatedNavbar isScrolled={isScrolled} />
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                {customActions}
                <Button variant="ghost" className={getSignUpButtonClasses()} onClick={() => navigate('/login')}>
                  {t('navbar.register')}
                </Button>
                <Button className={getSignInButtonClasses()} onClick={() => navigate('/login')}>
                  {t('navbar.login')}
                </Button>
                {landingToggleButton}
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-t border-gray-200">
            <nav className="px-4 py-4">
              <div className="bg-gray-50/80 rounded-2xl p-2 space-y-1">
                {navigationItems.map((item) =>
                  item.children && item.children.length > 0 ? renderMobileBranch(item) : renderMobileLeaf(item)
                )}
              </div>

              {/* Mobile auth section */}
              {isAuthenticated ? (
                <MobileAuthenticatedMenu onClose={() => setIsMobileMenuOpen(false)} />
              ) : (
                <div className="pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className={`w-full rounded-full border-2 text-sm font-semibold py-3 flex items-center justify-center gap-2 transition-colors duration-200 ${
                      isOwnerLandingPage
                        ? 'border-orange-500 bg-gradient-to-r from-orange-500 to-amber-400 text-white hover:from-orange-500/90 hover:to-amber-400/90'
                        : 'border-orange-200 text-orange-600 hover:bg-orange-100'
                    }`}
                    onClick={() => handleLandingToggle(true)}
                  >
                    {landingToggleIcon}
                    {landingToggleMobileText}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-orange-500 bg-orange-50 hover:bg-orange-100 text-sm rounded-xl py-3"
                    onClick={() => navigate('/login')}
                  >
                    {t('navbar.register')}
                  </Button>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-xl py-3"
                    onClick={() => navigate('/login')}
                  >
                    {t('navbar.login')}
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
