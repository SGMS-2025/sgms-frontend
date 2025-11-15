import React from 'react';
import { ClassListView } from '@/components/class';
import { useBranch } from '@/contexts/BranchContext';

/**
 * ============================================
 * Class Management Page
 * ============================================
 *
 * Owner page for managing all classes in their branches.
 * Features:
 * - Create new classes
 * - Edit existing classes
 * - Delete classes
 * - View class details
 * - Enroll students
 * - Search and filter classes
 * - Card/Table view toggle
 * - Pagination
 */

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
