import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'default' | 'notification' | 'sidebar' | 'toggle';
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'default',
  className = '',
  showText = true,
  size = 'md'
}) => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en', name: t('landing.language_switcher.english'), flag: '🇺🇸' },
    { code: 'vi', name: t('landing.language_switcher.vietnamese'), flag: '🇻🇳' }
  ];

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0];

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-5 text-xs';
      case 'lg':
        return 'h-10 text-sm';
      default:
        return 'h-7 text-xs';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'notification':
        return 'gap-1 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 hover:border-white/50 text-white transition-all duration-200 text-xs px-2 py-1';
      case 'sidebar':
        return 'gap-2 bg-transparent border-0 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all duration-200 px-3 py-2 w-full justify-start';
      case 'toggle':
        return 'gap-2 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white transition-all duration-200 px-4 py-2 rounded-full';
      default:
        return 'gap-2 bg-white/90 backdrop-blur-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200';
    }
  };

  const getIconClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-4 w-4';
      default:
        return 'h-3 w-3';
    }
  };

  // Toggle variant - simple switch
  if (variant === 'toggle') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm font-medium">EN</span>
        <label
          className="relative inline-flex items-center cursor-pointer"
          aria-label="Toggle language between English and Vietnamese"
        >
          <input
            type="checkbox"
            checked={language === 'vi'}
            onChange={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            className="sr-only peer"
            aria-describedby="language-toggle-description"
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-600 transition-colors"></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
        </label>
        <span className="text-sm font-medium">VI</span>
      </div>
    );
  }

  // Sidebar variant - dropdown menu item style
  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`${getSizeClasses()} ${getVariantClasses()} ${className}`}>
            <Globe className={getIconClasses()} />
            {showText && <span className="font-medium">{currentLanguage.name}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" sideOffset={8} className="w-48">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </div>
              {language === lang.code && <Check className="h-4 w-4 text-orange-500" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default and notification variants
  const buttonClasses = `${getSizeClasses()} ${getVariantClasses()} ${className}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={buttonClasses}>
          <Globe className={getIconClasses()} />
          {showText && <span className="font-medium">{currentLanguage.name}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{lang.name}</span>
            </div>
            {language === lang.code && <Check className="h-4 w-4 text-orange-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
