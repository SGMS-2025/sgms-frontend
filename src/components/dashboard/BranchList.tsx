import React from 'react';
import { useTranslation } from 'react-i18next';
import { GitBranch } from 'lucide-react';

const getBranchData = (t: (key: string) => string) => [
  { name: 'Chi nhánh 1', location: 'Ngũ Hành Sơn, Đà Nẵng', status: t('branch.active') },
  { name: 'Chi nhánh 2', location: 'Cẩm Lệ, Đà Nẵng', status: t('branch.closed') },
  { name: 'Chi nhánh 3', location: 'Sơn Trà, Đà Nẵng', status: t('branch.closed') },
  { name: 'Chi nhánh 4', location: 'Liên Chiểu, Đà Nẵng', status: t('branch.closed') },
  { name: 'Chi nhánh 5', location: 'Hải Châu, Đà Nẵng', status: t('branch.active') }
];

export const BranchList: React.FC = () => {
  const { t } = useTranslation();
  const branchData = getBranchData(t);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <GitBranch className="w-4 h-4 text-orange-500 mr-2" />
          <span className="text-sm text-orange-500 font-semibold">{t('branch.list_title')}</span>
        </div>
      </header>

      {branchData.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-500">—</div>
      ) : (
        <div>
          <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-2">
            <div className="col-span-5">{t('branch.name')}</div>
            <div className="col-span-5">{t('branch.address')}</div>
            <div className="col-span-2 text-right">{t('branch.activity')}</div>
          </div>

          <ul className="divide-y divide-gray-100">
            {branchData.map((branch, index) => {
              const isActive = branch.status === t('branch.active');
              return (
                <li key={index} className="group py-3 md:py-4">
                  <div className="md:grid md:grid-cols-12 md:gap-4">
                    <div className="md:col-span-5">
                      <div className="text-gray-900 font-medium">{branch.name}</div>
                      <div className="text-gray-500 md:hidden text-sm">{branch.location}</div>
                    </div>
                    <div className="hidden md:block md:col-span-5 text-gray-500">{branch.location}</div>
                    <div className="md:col-span-2 flex items-center justify-end mt-2 md:mt-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isActive
                            ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200'
                            : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200'
                        }`}
                      >
                        {branch.status}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
