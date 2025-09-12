import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BranchSelectorButton } from './BranchSelectorButton';
import { useBranch } from '@/contexts/BranchContext';
import type { BranchDisplay } from '@/types/api/Branch';

export const DashboardHeader: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentBranch, branches, setCurrentBranch } = useBranch();

  const handleBranchSelect = (branch: BranchDisplay) => {
    setCurrentBranch(branch);
  };

  const handleAddBranch = () => {
    navigate('/manage/add-branch');
  };

  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-4xl font-bold text-[#0d1523]">{t('dashboard.overview')}</h1>
      <BranchSelectorButton
        currentBranch={currentBranch}
        branches={branches}
        onBranchSelect={handleBranchSelect}
        onAddBranch={handleAddBranch}
      />
    </div>
  );
};
