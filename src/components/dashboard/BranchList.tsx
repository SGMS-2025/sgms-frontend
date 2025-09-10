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
    <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
      <div className="flex items-center mb-4">
        <GitBranch className="w-4 h-4 text-[#f05a29] mr-2" />
        <span className="text-sm text-[#f05a29] font-semibold">{t('branch.list_title')}</span>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm font-semibold text-[#0d1523] border-b pb-2">
          <div>{t('branch.name')}</div>
          <div>{t('branch.address')}</div>
          <div>{t('branch.activity')}</div>
        </div>
        {branchData.map((branch, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 text-sm py-2">
            <div>{branch.name}</div>
            <div className="text-[#9fa5ad]">{branch.location}</div>
            <div className={branch.status === t('branch.active') ? 'text-[#f05a29]' : 'text-[#9fa5ad]'}>
              {branch.status}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-4 text-sm py-2">
          <div></div>
          <div></div>
          <div className="justify-end">
            <button className="px-4 py-2 text-sm text-[#0d1523] border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition-colors flex items-center leading-none">
              {t('branch.details')} <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
