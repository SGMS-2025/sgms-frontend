import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface SidebarItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  role?: string[];
  isActive?: boolean;
  onClick?: () => void;
  badge?: number;
  testId?: string;
  'data-tour'?: string;
}

interface SidebarItemProps {
  item: SidebarItem;
  isCollapsed?: boolean;
}

const SidebarItemComponent: React.FC<SidebarItemProps> = ({ item, isCollapsed = false }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    } else if (item.href) {
      e.preventDefault();
      navigate(item.href);
    }
  };

  return (
    <button
      type="button"
      className={`group relative flex items-center py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
        item.isActive ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500'
      } ${isCollapsed ? 'justify-center px-1 w-12' : 'w-full gap-3 px-3'}`}
      onClick={handleClick}
      aria-current={item.isActive ? 'page' : undefined}
      title={isCollapsed ? item.label : undefined}
      data-testid={item.testId}
      data-tour={item['data-tour']}
    >
      <span className="flex-shrink-0 w-5 h-5 relative">
        {item.icon}
        {item.badge && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </span>
      {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
          {item.label}
        </span>
      )}
    </button>
  );
};

interface SidebarProps {
  items: SidebarItem[];
  isCollapsed?: boolean;
  title?: string;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, isCollapsed = false, title, className = '' }) => {
  return (
    <nav
      className={`space-y-1 ${isCollapsed ? 'overflow-hidden' : ''} ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {title && !isCollapsed && (
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">{title}</div>
      )}
      {items.map((item, index) => (
        <SidebarItemComponent
          key={item.testId || item.href || item.label || index}
          item={item}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>
  );
};
