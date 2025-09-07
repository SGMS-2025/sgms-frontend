import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, HelpCircle, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImage from '@/assets/images/logo2.png';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'hero', label: 'Trang chủ', href: '#' },
    { id: 'offers', label: 'Ưu đãi', href: '#offers' },
    { id: 'gyms', label: 'Phòng tập', href: '#gyms' },
    { id: 'trainers', label: 'HLV', href: '#trainers' },
    { id: 'reviews', label: 'Đánh giá', href: '#reviews' }
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
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg py-3 border-b border-orange-100/50'
            : 'bg-white/90 backdrop-blur-sm py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <div
            className={`flex items-center gap-3 transition-all duration-300 ${isScrolled ? 'scale-90' : 'scale-100'}`}
          >
            <div className="cursor-pointer">
              <img src={logoImage} alt="Gym Smart Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold">
                <span className="text-orange-500">GYM</span>
                <span className="text-slate-800 ml-1">SMART</span>
              </h1>
            </div>
          </div>

          {/* Desktop Navigation - Pill Style */}
          <nav className="hidden md:flex items-center">
            <div
              className={`flex items-center space-x-1 p-1.5 rounded-full transition-all duration-300 ${
                isScrolled
                  ? 'bg-gray-50/80 backdrop-blur-sm border border-gray-200/50'
                  : 'bg-black/5 backdrop-blur-sm border border-white/20'
              }`}
            >
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
                    activeSection === item.id
                      ? isScrolled
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-white/90 text-gray-900 shadow-sm'
                      : isScrolled
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white/20'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-orange-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button
                variant="ghost"
                className={`transition-all duration-300 rounded-full ${
                  isScrolled
                    ? 'text-orange-500 bg-orange-50 hover:bg-orange-100'
                    : 'text-orange-500 bg-white hover:bg-orange-600 hover:text-white'
                } text-sm`}
                onClick={() => navigate('/login')}
              >
                Đăng ký
              </Button>
              <Button
                className={`transition-all duration-300 rounded-full text-sm px-6 ${
                  isScrolled
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
                onClick={() => navigate('/login')}
              >
                Đăng nhập
              </Button>
            </div>
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
                    className={`block w-full text-left py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeSection === item.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
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
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
