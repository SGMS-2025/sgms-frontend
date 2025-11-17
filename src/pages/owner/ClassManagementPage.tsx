import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClassListView } from '@/components/class/ClassListView';
import { useBranch } from '@/contexts/BranchContext';

const ClassManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();

  if (!currentBranch) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('class_management.select_branch')}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('class_management.title')}</h1>
      <ClassListView branchId={currentBranch._id} />
    </div>
  );
};

export default ClassManagementPage;
