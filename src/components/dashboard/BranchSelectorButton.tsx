import React, { useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle, Plus, ChevronDown, Eye } from 'lucide-react';
import type { BranchDisplay } from '@/types/api/Branch';

export interface BranchSelectorButtonHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

interface BranchSelectorButtonProps {
  currentBranch: BranchDisplay | null;
  branches: BranchDisplay[];
  onBranchSelect: (branch: BranchDisplay) => void;
  onAddBranch: () => void;
  onViewBranch?: (branch: BranchDisplay) => void | Promise<void>;
  collapsed?: boolean;
}

export const BranchSelectorButton = React.forwardRef<BranchSelectorButtonHandle, BranchSelectorButtonProps>(
  ({ currentBranch, branches, onBranchSelect, onAddBranch, onViewBranch, collapsed = false }, ref) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        open: () => setOpen(true),
        close: () => setOpen(false),
        toggle: () => setOpen((v) => !v)
      }),
      []
    );

    const handleSelect = (b: BranchDisplay) => {
      onBranchSelect(b);
      setOpen(false);
    };

    const handleAdd = () => {
      onAddBranch();
      setOpen(false);
    };

    const popoverContent = (
      <PopoverContent
        side="right"
        align="end"
        alignOffset={collapsed ? -12 : 0}
        sideOffset={collapsed ? 8 : 12}
        collisionPadding={12}
        avoidCollisions={false}
        className="w-[320px] p-0 bg-white border border-gray-200 shadow-xl rounded-xl max-h-[360px] overflow-auto translate-x-2 z-[100]"
      >
        <div className="h-12 px-3 flex items-center gap-2 border-b">
          <h3 className="text-base font-semibold text-gray-900">
            {t('branch_selector.select_branch') || 'Select branch'}
          </h3>
        </div>
        <div className="py-1">
          {branches && branches.length > 0 ? (
            branches.map((b) => {
              const isCurrent = b._id === currentBranch?._id;
              return (
                <div key={b._id} className="flex items-center w-full">
                  <button
                    type="button"
                    onClick={() => handleSelect(b)}
                    className="flex-1 px-3 py-3 flex items-center gap-3 hover:bg-gray-50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={b.coverImage} alt={b.branchName} />
                      <AvatarFallback className="bg-orange-100 text-orange-600 text-sm font-semibold">
                        {b.branchName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left text-[15px] text-gray-900 font-medium truncate">
                      {b.branchName}
                    </span>
                    {isCurrent && <CheckCircle className="h-5 w-5 text-blue-600" />}
                  </button>
                  {onViewBranch && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onViewBranch(b);
                        setOpen(false);
                      }}
                      className="mr-2 inline-flex items-center justify-center rounded-full p-2 text-gray-400 transition-colors hover:bg-orange-50 hover:text-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                      title={t('branch_selector.view_details') || 'View details'}
                      aria-label={`${t('branch_selector.view_details') || 'View details'} ${b.branchName}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-6 text-sm text-gray-500 text-center">
              {t('branch_selector.no_other_branches') || 'No branches'}
            </div>
          )}

          <button onClick={handleAdd} className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50">
            <span className="h-8 w-8 rounded-full bg-orange-500 text-white inline-flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </span>
            <span className="text-[15px] text-gray-900 font-medium">
              {t('branch_selector.add_branch') || 'Add branch'}
            </span>
          </button>
        </div>
      </PopoverContent>
    );

    if (collapsed) {
      const initials = currentBranch?.branchName?.slice(0, 2)?.toUpperCase();
      const label = t('branch_selector.select_branch') || 'Select branch';

      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={label}
              title={label}
              className="h-11 w-11 rounded-2xl border border-orange-500/80 bg-orange-500 text-white flex items-center justify-center transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              <Avatar className="h-9 w-9 pointer-events-none">
                <AvatarImage src={currentBranch?.coverImage} alt={currentBranch?.branchName} />
                <AvatarFallback className="bg-transparent text-white text-sm font-semibold uppercase">
                  {initials || (branches.length > 0 ? (t('branch_selector.select_branch') || '?').charAt(0) : '!')}
                </AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          {popoverContent}
        </Popover>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex min-w-[240px] items-center justify-between rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            title={t('branch_selector.select_branch') || 'Select branch'}
          >
            <span className="flex items-center gap-3 overflow-hidden">
              <Avatar className="h-8 w-8 ring-1 ring-orange-100">
                <AvatarImage src={currentBranch?.coverImage} alt={currentBranch?.branchName} />
                <AvatarFallback className="bg-orange-100 text-orange-600 text-sm font-semibold uppercase">
                  {currentBranch?.branchName?.slice(0, 2).toUpperCase() ||
                    (branches.length > 0 ? (t('branch_selector.select_branch') || '?').charAt(0) : '!')}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-left text-sm font-semibold text-gray-800">
                {currentBranch?.branchName ||
                  (branches.length > 0 ? t('branch_selector.select_branch') : t('branch_selector.no_branches'))}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </PopoverTrigger>
        {popoverContent}
      </Popover>
    );
  }
);
