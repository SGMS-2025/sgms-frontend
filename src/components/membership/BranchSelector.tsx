import React from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { MembershipPlanBranchInfo } from '@/types/api/Membership';

interface BranchSelectorProps {
  branches: MembershipPlanBranchInfo[];
  selectedBranchIds: string[];
  onToggleBranch: (branchId: string) => void;
  branchMap: Record<string, MembershipPlanBranchInfo>;
  title: string;
  selectedCount: number;
  emptyMessage?: string;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  branches,
  selectedBranchIds,
  onToggleBranch,
  branchMap,
  title,
  selectedCount,
  emptyMessage
}) => {
  const { t } = useTranslation();

  const getBranchName = (branch: MembershipPlanBranchInfo, branchMap: Record<string, MembershipPlanBranchInfo>) => {
    const branchInfo = branchMap[branch._id] || branch;
    return {
      name: branchInfo.branchName || 'Unknown Branch',
      location: branchInfo.location
    };
  };

  if (!branches.length) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <Badge variant="outline" className="bg-slate-50 text-slate-700">
            {t('membershipManager.sheet.selectedCount', { count: selectedCount })}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">{emptyMessage || t('membershipManager.sheet.form.noBranches')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <Badge variant="outline" className="bg-slate-50 text-slate-700">
          {t('membershipManager.sheet.selectedCount', { count: selectedCount })}
        </Badge>
      </div>
      <div className="flex flex-col gap-2">
        {branches.map((branch) => {
          const { name, location } = getBranchName(branch, branchMap);
          const isSelected = selectedBranchIds.includes(branch._id);

          return (
            <label
              key={branch._id}
              className="flex items-start gap-2 rounded-md border border-slate-200 p-3 text-sm hover:bg-slate-50 cursor-pointer"
            >
              <Checkbox checked={isSelected} onCheckedChange={() => onToggleBranch(branch._id)} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="block font-medium text-slate-900">{name}</span>
                {location && <span className="text-xs text-slate-500">{location}</span>}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
