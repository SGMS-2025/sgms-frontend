import React, { useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, ChevronDown, MapPin, Eye } from 'lucide-react';
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

const statusClasses = (isActive: boolean) =>
  isActive
    ? 'bg-orange-100 text-orange-700 border border-orange-200'
    : 'bg-gray-100 text-gray-600 border border-gray-200';

export const BranchSelectorButton = React.forwardRef<BranchSelectorButtonHandle, BranchSelectorButtonProps>(
  ({ currentBranch, branches, onBranchSelect, onAddBranch, onViewBranch, collapsed = false }, ref) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const activeLabel = t('branch.active', { defaultValue: 'Active' });
    const inactiveLabel = t('branch.closed', { defaultValue: 'Inactive' });
    const listLabel = t('branch_selector.all_branches', { defaultValue: 'Branches' });
    const selectBranchLabel = t('branch_selector.select_branch') || 'Select branch';
    const addBranchLabel = t('branch_selector.add_branch') || 'Add branch';

    useImperativeHandle(
      ref,
      () => ({
        open: () => setOpen(true),
        close: () => setOpen(false),
        toggle: () => setOpen((v) => !v)
      }),
      []
    );

    const handleSelect = (branch: BranchDisplay) => {
      onBranchSelect(branch);
      setOpen(false);
    };

    const handleAdd = () => {
      onAddBranch();
      setOpen(false);
    };

    const renderStatusPill = (isActive: boolean) => (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusClasses(isActive)}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-orange-500' : 'bg-gray-400'}`} />
        {isActive ? activeLabel : inactiveLabel}
      </span>
    );

    const popoverContent = (
      <PopoverContent
        side="bottom"
        align="start"
        alignOffset={0}
        sideOffset={8}
        className="w-80 max-w-[calc(100vw-2rem)] sm:max-w-none p-0 border-gray-200 shadow-lg sm:!side-right sm:!align-end"
      >
        <div className="h-80 p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{listLabel}</p>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-md p-1.5 text-orange-600 transition-colors hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              title={addBranchLabel}
              aria-label={addBranchLabel}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Branches List */}
          {branches && branches.length > 0 ? (
            <div className="h-64 space-y-2 overflow-y-auto">
              {branches.map((branch) => {
                const isCurrent = branch._id === currentBranch?._id;
                return (
                  <button
                    key={branch._id}
                    type="button"
                    onClick={() => handleSelect(branch)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors border ${
                      isCurrent
                        ? 'bg-orange-50 text-orange-900 border-orange-200 shadow-sm'
                        : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={branch.coverImage} alt={branch.branchName} />
                      <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-semibold">
                        {branch.branchName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <p className="flex-1 truncate text-sm font-medium">{branch.branchName}</p>
                        {renderStatusPill(branch.isActive)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{branch.location}</span>
                      </div>
                    </div>
                    {onViewBranch && (
                      <button
                        type="button"
                        onClick={async (event) => {
                          event.stopPropagation();
                          await onViewBranch(branch);
                          setOpen(false);
                        }}
                        className="rounded-md p-1 text-gray-400 transition-colors hover:text-orange-600 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                        title={t('branch_selector.view_details') || 'View details'}
                        aria-label={`${t('branch_selector.view_details') || 'View details'} ${branch.branchName}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-center text-sm text-gray-500">
              {t('branch_selector.no_other_branches') || 'No branches'}
            </div>
          )}
        </div>
      </PopoverContent>
    );

    if (collapsed) {
      const initials = currentBranch?.branchName?.slice(0, 2)?.toUpperCase();

      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={selectBranchLabel}
              title={selectBranchLabel}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_12px_28px_rgba(249,115,22,0.28)] transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              <Avatar className="pointer-events-none h-9 w-9">
                <AvatarImage src={currentBranch?.coverImage} alt={currentBranch?.branchName} />
                <AvatarFallback className="bg-transparent text-white text-sm font-semibold uppercase">
                  {initials || (branches.length > 0 ? selectBranchLabel.charAt(0) : '!')}
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
            className="group relative flex items-center py-2 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 text-gray-700 hover:bg-orange-50 hover:text-orange-500 w-64 max-w-64 gap-3 px-3"
            title={selectBranchLabel}
          >
            <span className="flex-shrink-0 w-5 h-5 relative">
              <Avatar className="w-5 h-5">
                <AvatarImage src={currentBranch?.coverImage} alt={currentBranch?.branchName} />
                <AvatarFallback className="bg-orange-100 text-orange-600 text-xs font-semibold uppercase">
                  {currentBranch?.branchName?.slice(0, 2).toUpperCase() ||
                    (branches.length > 0 ? selectBranchLabel.charAt(0) : '!')}
                </AvatarFallback>
              </Avatar>
            </span>
            <span className="flex min-w-0 flex-col flex-1 text-left overflow-hidden">
              <span className="truncate text-sm font-medium text-gray-900">
                {currentBranch?.branchName ||
                  (branches.length > 0 ? selectBranchLabel : t('branch_selector.no_branches'))}
              </span>
              {currentBranch && (
                <span className="flex items-center gap-1 text-xs text-gray-500 min-w-0 mt-0.5 overflow-hidden">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{currentBranch.location}</span>
                </span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </button>
        </PopoverTrigger>
        {popoverContent}
      </Popover>
    );
  }
);
BranchSelectorButton.displayName = 'BranchSelectorButton';
