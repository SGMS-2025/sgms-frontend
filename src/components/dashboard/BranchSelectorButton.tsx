import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BranchSelectorModal } from '@/components/modals/BranchSelectorModal';
import type { BranchDisplay } from '@/types/api/Branch';

interface BranchSelectorButtonProps {
  currentBranch: BranchDisplay | null;
  branches: BranchDisplay[];
  onBranchSelect: (branch: BranchDisplay) => void;
  onAddBranch: () => void;
}

export const BranchSelectorButton: React.FC<BranchSelectorButtonProps> = ({
  currentBranch,
  branches,
  onBranchSelect,
  onAddBranch
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModalOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 px-4 py-2 rounded-lg flex items-center space-x-2"
        onClick={() => setIsModalOpen(!isModalOpen)}
      >
        <span className="font-medium">
          {currentBranch?.branchName ||
            (branches.length > 0 ? t('branch_selector.select_branch') : t('branch_selector.no_branches'))}
        </span>
        <Avatar className="h-6 w-6">
          <AvatarImage src={currentBranch?.coverImage} alt={currentBranch?.branchName} />
          <AvatarFallback className="bg-white text-orange-600 text-xs">
            {currentBranch?.branchName?.charAt(0) || (branches.length > 0 ? '?' : '!')}
          </AvatarFallback>
        </Avatar>
      </Button>

      <BranchSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentBranch={currentBranch}
        branches={branches}
        onBranchSelect={onBranchSelect}
        onAddBranch={onAddBranch}
      />
    </div>
  );
};
