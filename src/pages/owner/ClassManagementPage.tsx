import React from 'react';
import { ClassListView } from '@/components/class/ClassListView';
import { useBranch } from '@/contexts/BranchContext';

const ClassManagementPage: React.FC = () => {
  const { currentBranch } = useBranch();

  if (!currentBranch) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please select a branch first</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Classes Management</h1>
      <ClassListView branchId={currentBranch._id} />
    </div>
  );
};

export default ClassManagementPage;
