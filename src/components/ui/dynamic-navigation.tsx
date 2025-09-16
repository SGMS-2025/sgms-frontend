import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/utils';

export interface DynamicNavigationProps {
  /** Navigation links */
  links: {
    id: string;
    label: string;
    href: string;
    icon?: React.ReactNode;
  }[];
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Highlight color */
  highlightColor?: string;
  /** Glow effect intensity (0-10) */
  glowIntensity?: number;
  /** CSS class name */
  className?: string;
  /** Whether to show labels on mobile */
  showLabelsOnMobile?: boolean;
  /** Callback when a link is clicked */
  onLinkClick?: (id: string) => void;
  /** Initially active link ID */
  activeLink?: string;
  /** Enable ripple effect on click */
  enableRipple?: boolean;
  /** Theme variant */
  variant?: 'glass' | 'solid' | 'minimal' | 'modern';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether navigation is scrolled */
  isScrolled?: boolean;
}

export const DynamicNavigation = ({
  links,
  backgroundColor,
  textColor,
  highlightColor,
  glowIntensity = 3,
  className,
  showLabelsOnMobile = false,
  onLinkClick,
  activeLink,
  enableRipple = true,
  variant = 'modern',
  size = 'md',
  isScrolled = false
}: DynamicNavigationProps) => {
  const navRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(activeLink || (links.length > 0 ? links[0].id : null));

  // Theme variants
  const getVariantStyles = () => {
    const baseStyles = {
      glass: {
        bg: isScrolled
          ? 'bg-white/95 backdrop-blur-xl border-gray-200/50'
          : 'bg-white/90 backdrop-blur-xl border-white/20',
        text: isScrolled ? 'text-gray-700' : 'text-gray-700',
        highlight: isScrolled
          ? 'bg-white shadow-lg border border-gray-100'
          : 'bg-white/95 shadow-lg border border-white/30',
        glow: isScrolled ? `shadow-[0_8px_32px_rgba(0,0,0,0.12)]` : `shadow-[0_8px_32px_rgba(255,255,255,0.25)]`
      },
      solid: {
        bg: 'bg-gray-900 border-gray-700',
        text: 'text-gray-300',
        highlight: 'bg-orange-500 shadow-lg',
        glow: `shadow-[0_0_${glowIntensity * 2}px_rgba(251,146,60,0.4)]`
      },
      minimal: {
        bg: 'bg-transparent border-transparent',
        text: 'text-gray-600',
        highlight: 'bg-gray-100 border border-gray-200',
        glow: 'shadow-none'
      },
      modern: {
        bg: isScrolled
          ? 'bg-gray-50/95 backdrop-blur-xl border-gray-200/60'
          : 'bg-black/5 backdrop-blur-xl border-white/20',
        text: isScrolled ? 'text-gray-700' : 'text-gray-700',
        highlight: isScrolled
          ? 'bg-white shadow-md border border-gray-200/50'
          : 'bg-white/95 shadow-md border border-white/40',
        glow: isScrolled ? `shadow-[0_4px_20px_rgba(0,0,0,0.08)]` : `shadow-[0_4px_20px_rgba(255,255,255,0.2)]`
      }
    };
    return baseStyles[variant];
  };

  // Size variants
  const getSizeStyles = () => {
    const sizes = {
      sm: {
        nav: 'py-1',
        item: 'h-7 text-xs px-3',
        gap: 'gap-2',
        spacing: 'space-x-0.5'
      },
      md: {
        nav: 'py-1.5',
        item: 'h-8 text-sm px-4',
        gap: 'gap-1',
        spacing: 'space-x-1'
      },
      lg: {
        nav: 'py-2',
        item: 'h-10 text-base px-6',
        gap: 'gap-2',
        spacing: 'space-x-2'
      }
    };
    return sizes[size];
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  // Update highlight position based on active link
  const updateHighlightPosition = (id?: string) => {
    if (!navRef.current || !highlightRef.current) return;

    const linkElement = navRef.current.querySelector(`[data-nav-item="${id || active}"]`);
    if (!linkElement) return;

    const { left, width } = linkElement.getBoundingClientRect();
    const navRect = navRef.current.getBoundingClientRect();

    highlightRef.current.style.transform = `translateX(${left - navRect.left}px)`;
    highlightRef.current.style.width = `${width}px`;
    highlightRef.current.style.opacity = '1';
  };

  // Create ripple effect
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!enableRipple) return;

    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;

    circle.className = `
      absolute rounded-full pointer-events-none
      bg-current opacity-20 scale-0
      animate-[ripple_0.6s_ease-out_forwards]
    `;

    // Remove existing ripples
    const existingRipples = button.querySelectorAll('.ripple-effect');
    existingRipples.forEach((ripple) => ripple.remove());

    circle.classList.add('ripple-effect');
    button.appendChild(circle);

    setTimeout(() => circle.remove(), 600);
  };

  // Handle link click
  const handleLinkClick = (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (enableRipple) {
      createRipple(event);
    }

    setActive(id);

    if (onLinkClick) {
      onLinkClick(id);
    }
  };

  // Handle link hover
  const handleLinkHover = (id: string, isEntering: boolean) => {
    if (isEntering && id !== active) {
      updateHighlightPosition(id);
    } else if (!isEntering) {
      updateHighlightPosition(active || undefined);
    }
  };

  // Set initial highlight position and update on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      updateHighlightPosition();
    }, 50);

    const handleResize = () => {
      updateHighlightPosition();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [active, links, isScrolled]);

  // Update when active link changes externally
  useEffect(() => {
    if (activeLink && activeLink !== active) {
      setActive(activeLink);
    }
  }, [activeLink, active]);

  return (
    <nav
      ref={navRef}
      className={cn(
        'relative rounded-full border transition-all duration-500 ease-out',
        variantStyles.bg,
        variantStyles.glow,
        sizeStyles.nav,
        'hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      style={{
        backgroundColor: backgroundColor,
        color: textColor
      }}
    >
      {/* Background highlight */}
      <div
        ref={highlightRef}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 left-0 rounded-full',
          'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          'opacity-0 z-10',
          variantStyles.highlight,
          sizeStyles.item.replace('text-sm', '').replace('text-xs', '').replace('text-base', '')
        )}
        style={{
          backgroundColor: highlightColor,
          transform: 'translateY(-50%) translateX(0px)'
        }}
      />

      <ul className={cn('flex items-center relative z-20', sizeStyles.spacing, 'mx-1')}>
        {links.map((link) => (
          <li key={link.id} className="relative">
            <button
              data-nav-item={link.id}
              className={cn(
                'flex items-center justify-center rounded-full font-medium',
                'transition-all duration-300 relative overflow-hidden group',
                'hover:scale-105 active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-gray-500/20',
                variantStyles.text,
                sizeStyles.item,
                sizeStyles.gap,
                active === link.id &&
                  cn('font-semibold z-30 relative', variant === 'solid' ? 'text-white' : 'text-gray-900')
              )}
              onClick={(e) => handleLinkClick(link.id, e)}
              onMouseEnter={() => handleLinkHover(link.id, true)}
              onMouseLeave={() => handleLinkHover(link.id, false)}
              style={{
                color: active === link.id && textColor ? textColor : undefined
              }}
            >
              {link.icon && (
                <span
                  className={cn(
                    'flex-shrink-0 transition-transform duration-300',
                    'group-hover:scale-110',
                    size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'
                  )}
                >
                  {link.icon}
                </span>
              )}
              <span
                className={cn(
                  'transition-all duration-300 whitespace-nowrap',
                  showLabelsOnMobile ? 'block' : 'hidden sm:block',
                  link.icon && 'ml-1'
                )}
              >
                {link.label}
              </span>

              {/* Hover indicator */}
              <div
                className={cn(
                  'absolute inset-0 rounded-full opacity-0',
                  'group-hover:opacity-100 transition-opacity duration-300',
                  'bg-current/10',
                  active !== link.id && 'group-hover:bg-gray-500/10'
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes ripple {
              from {
                transform: scale(0);
                opacity: 0.6;
              }
              to {
                transform: scale(4);
                opacity: 0;
              }
            }
          `
        }}
      />
    </nav>
  );
};

export default DynamicNavigation;
