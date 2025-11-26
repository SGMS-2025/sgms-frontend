import React from 'react';
import { useTranslation } from 'react-i18next';
import { GitBranch } from 'lucide-react';
import { useMyBranches } from '@/hooks/useBranches';
import { useAuthState } from '@/hooks/useAuth';

export const BranchList: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthState();
  const { branches, loading, error } = useMyBranches();

  // Check if user has permission to view branches
  const canViewBranches = user && ['OWNER', 'ADMIN', 'STAFF'].includes(user.role);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 h-full flex flex-col">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <GitBranch className="w-4 h-4 text-orange-500 mr-2" />
          <span className="text-sm text-orange-500 font-semibold">{t('branch.list_title')}</span>
        </div>
      </header>

      {(() => {
        if (!canViewBranches) {
          return (
            <div className="text-center py-10 text-sm text-gray-500">
              {t('common.no_permission', 'Bạn không có quyền xem danh sách chi nhánh')}
            </div>
          );
        }
        if (loading) {
          return <div className="text-center py-10 text-sm text-gray-500">{t('common.loading', 'Đang tải...')}</div>;
        }
        if (error) {
          // Show more user-friendly error message
          const errorMessage =
            error.includes('permission') || error.includes('403') || error.includes('401')
              ? t('common.no_permission', 'Bạn không có quyền xem danh sách chi nhánh')
              : error;
          return <div className="text-center py-10 text-sm text-red-500">{errorMessage}</div>;
        }
        if (branches.length === 0) {
          return (
            <div className="text-center py-10 text-sm text-gray-500">
              {t('branch.no_branches', 'Chưa có chi nhánh nào')}
            </div>
          );
        }
        return (
          <div className="overflow-hidden rounded-xl border border-gray-100 flex-1">
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,0.6fr)] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50">
              <div className="text-left">{t('branch.name')}</div>
              <div className="text-left">{t('branch.address')}</div>
              <div className="text-right">{t('branch.activity')}</div>
            </div>

            <ul className="divide-y divide-gray-100">
              {branches.map((branch) => {
                const isActive = branch.isActive;
                const branchStatus = isActive ? t('branch.active') : t('branch.closed');
                return (
                  <li
                    key={branch._id}
                    className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,0.6fr)] px-5 py-4 items-center"
                  >
                    <div className="min-w-0">
                      <div className="text-gray-900 font-semibold break-words">{branch.branchName}</div>
                      <div className="text-gray-500 text-sm md:hidden mt-1">{branch.location}</div>
                    </div>
                    <div className="hidden md:block text-gray-500 break-words leading-snug">{branch.location}</div>
                    <div className="flex justify-end">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          isActive
                            ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200'
                            : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200'
                        }`}
                      >
                        {branchStatus}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })()}
    </div>
  );
};
