import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, HelpCircle, Menu, X, Home, Gift, Dumbbell, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImage from '@/assets/images/logo2.png';
import { AuthenticatedNavbar } from './AuthenticatedNavbar';
import { MobileAuthenticatedMenu } from './MobileAuthenticatedMenu';
import { useIsAuthenticated } from '@/hooks/useAuth';
import { DynamicNavigation } from '@/components/ui/dynamic-navigation';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

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

  const menuItems = [
    { id: 'hero', label: 'Trang chủ', href: '#', icon: <Home className="w-4 h-4" /> },
    { id: 'offers', label: 'Ưu đãi', href: '#offers', icon: <Gift className="w-4 h-4" /> },
    { id: 'gyms', label: 'Phòng tập', href: '#gyms', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'trainers', label: 'HLV', href: '#trainers', icon: <Users className="w-4 h-4" /> },
    { id: 'reviews', label: 'Đánh giá', href: '#reviews', icon: <Star className="w-4 h-4" /> }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100);

      // Update active section based on scroll position
      const sections = menuItems.map((item) =>
        document.getElementById(item.id === 'hero' ? 'hero' : item.id.replace('#', ''))
      );
      const scrollPosition = scrollTop + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(menuItems[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(sectionId.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top notification bar - Hidden when scrolled */}
      {!isScrolled && (
        <nav className="bg-orange-500 text-white px-4 py-1.5 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-end">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 cursor-pointer hover:text-orange-200 transition-colors text-sm">
                <Bell className="w-3.5 h-3.5" />
                <span>Thông báo</span>
              </div>
              <div className="flex items-center space-x-1 cursor-pointer hover:text-orange-200 transition-colors text-sm">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Hỗ trợ</span>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${getHeaderClasses()}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <div
            className={`flex items-center gap-3 transition-all duration-300 cursor-pointer hover:scale-105 ${getLogoClasses()}`}
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
          </div>

          {/* Desktop Navigation - Enhanced Dynamic Style */}
          <div className="hidden md:flex items-center">
            <DynamicNavigation
              links={menuItems}
              activeLink={activeSection}
              onLinkClick={(id) => scrollToSection(id)}
              variant="modern"
              size="md"
              isScrolled={isScrolled}
              enableRipple={true}
              showLabelsOnMobile={false}
              className="mx-2"
            />
          </div>

          {/* Auth buttons */}
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Show different content based on authentication */}
            {isAuthenticated ? (
              /* Authenticated navbar with avatar and notifications */
              <AuthenticatedNavbar isScrolled={isScrolled} />
            ) : (
              /* Desktop auth buttons for non-authenticated users */
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="ghost" className={getSignUpButtonClasses()} onClick={() => navigate('/login')}>
                  Đăng ký
                </Button>
                <Button className={getSignInButtonClasses()} onClick={() => navigate('/login')}>
                  Đăng nhập
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-t border-gray-200">
            <nav className="px-4 py-4">
              <div className="bg-gray-50/80 rounded-2xl p-2 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={getMobileMenuItemClasses(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Mobile auth section */}
              {isAuthenticated ? (
                <MobileAuthenticatedMenu onClose={() => setIsMobileMenuOpen(false)} />
              ) : (
                <div className="pt-4 space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full text-orange-500 bg-orange-50 hover:bg-orange-100 text-sm rounded-xl py-3"
                    onClick={() => navigate('/login')}
                  >
                    Đăng ký
                  </Button>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-xl py-3"
                    onClick={() => navigate('/login')}
                  >
                    Đăng nhập
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
