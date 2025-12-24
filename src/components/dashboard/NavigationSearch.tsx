import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/utils/utils';
import {
  NAVIGATION_SEARCH_ITEMS,
  type NavigationSearchItem,
  type NavigationSearchRole
} from '@/constants/navigationSearch';
import { useAuthState } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';

interface NavigationSearchProps {
  className?: string;
  inputClassName?: string;
}

type NavigationSearchDisplayItem = NavigationSearchItem & {
  label: string;
  sectionLabel: string;
  searchHaystack: string;
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const NavigationSearch: React.FC<NavigationSearchProps> = ({ className, inputClassName }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { currentStaff, loading: staffLoading } = useCurrentUserStaff();

  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const resolvedRole = React.useMemo<NavigationSearchRole | null>(() => {
    if (user?.role === 'OWNER') return 'OWNER';
    if (user?.role === 'ADMIN') return 'ADMIN';
    if (user?.role === 'CUSTOMER') return 'CUSTOMER';
    if (user?.role === 'STAFF') {
      if (currentStaff?.jobTitle === 'Manager') return 'MANAGER';
      if (currentStaff?.jobTitle === 'Personal Trainer') return 'PT';
      if (currentStaff?.jobTitle === 'Technician') return 'TECHNICIAN';
    }
    return null;
  }, [currentStaff?.jobTitle, user?.role]);

  const isResolvingRole = user?.role === 'STAFF' && staffLoading && !currentStaff;

  const itemsForRole = React.useMemo(
    () => (resolvedRole ? NAVIGATION_SEARCH_ITEMS.filter((item) => item.roles.includes(resolvedRole)) : []),
    [resolvedRole]
  );

  const itemsWithLabels = React.useMemo<NavigationSearchDisplayItem[]>(() => {
    return itemsForRole.map((item) => {
      const label = item.labelKey ? t(item.labelKey, item.fallbackLabel) : item.fallbackLabel;
      const sectionLabel = item.sectionKey
        ? t(item.sectionKey, item.sectionLabel || item.sectionKey)
        : item.sectionLabel || '';
      const searchHaystack = normalizeText([label, item.path, ...(item.keywords || [])].join(' '));

      return {
        ...item,
        label,
        sectionLabel,
        searchHaystack
      };
    });
  }, [itemsForRole, t]);

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return itemsWithLabels;
    const normalizedQuery = normalizeText(query);
    return itemsWithLabels.filter((item) => item.searchHaystack.includes(normalizedQuery));
  }, [itemsWithLabels, query]);

  const groupedItems = React.useMemo(() => {
    const groups = new Map<string, NavigationSearchDisplayItem[]>();
    filteredItems.forEach((item) => {
      const groupKey = item.sectionLabel || t('sidebar.main_menu', 'Menu');
      const currentGroup = groups.get(groupKey) || [];
      currentGroup.push(item);
      groups.set(groupKey, currentGroup);
    });
    return Array.from(groups.entries());
  }, [filteredItems, t]);

  const emptyMessage = React.useMemo(() => {
    if (isResolvingRole) return t('common.loading', 'Loading...');
    if (!resolvedRole) return t('common.no_data', 'No quick links available for this account');
    return t('common.no_results', 'No matching menu items');
  }, [isResolvingRole, resolvedRole, t]);

  const handleSelect = (item: NavigationSearchDisplayItem) => {
    navigate(item.path);
    setOpen(false);
    setIsFocused(false);
    setQuery('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && filteredItems[0]) {
      event.preventDefault();
      handleSelect(filteredItems[0]);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const nextTarget = event.relatedTarget as HTMLElement | null;
    if (nextTarget && contentRef.current?.contains(nextTarget)) {
      return;
    }
    setIsFocused(false);
    setOpen(false);
  };

  const isPopoverOpen = open || isFocused;

  return (
    <Popover open={isPopoverOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative w-full', className)}>
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              setIsFocused(true);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={t('dashboard.search_placeholder')}
            className={cn(
              'h-10 rounded-full border border-gray-200 bg-white pl-10 text-sm shadow-sm focus:border-orange-200 focus:ring-orange-200',
              inputClassName
            )}
            aria-label={t('dashboard.search_placeholder')}
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 w-[min(520px,90vw)] shadow-lg border border-gray-200 z-[120]"
        sideOffset={8}
        ref={contentRef}
      >
        <Command>
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {groupedItems.map(([groupLabel, items]) => (
              <CommandGroup key={groupLabel} heading={groupLabel}>
                {items.map((item) => (
                  <CommandItem key={item.id} value={item.label} onSelect={() => handleSelect(item)}>
                    <span className="text-sm text-gray-900">{item.label}</span>
                    <span className="ml-auto text-xs text-gray-500">{item.path}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
