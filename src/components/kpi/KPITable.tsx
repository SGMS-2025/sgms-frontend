import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Edit, X, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import type { KPIDisplay } from '@/types/api/KPI';

interface KPITableProps {
  kpiList: KPIDisplay[];
  loading: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDisable?: (id: string) => void;
  onRecalculate?: (id: string) => void;
}

export const KPITable: React.FC<KPITableProps> = ({ kpiList, loading, onView, onEdit, onDisable, onRecalculate }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading', 'Đang tải...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-[20rem]" />
          <col className="w-[12rem]" />
          <col className="w-[12rem]" />
          <col className="w-[8rem]" />
        </colgroup>
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('kpi.table.staff_name', 'Nhân viên')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('kpi.table.actual', 'Thực tế')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('kpi.table.commission', 'Hoa hồng')}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('kpi.table.actions', 'Thao tác')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {kpiList.map((kpi) => (
            <tr key={kpi.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{kpi.staffName}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {kpi.actualRevenue > 0 ? formatCurrency(kpi.actualRevenue) : '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{kpi.commission > 0 ? formatCurrency(kpi.commission) : '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  {onView && (
                    <button
                      onClick={() => onView(kpi.id)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title={t('kpi.actions.view', 'Xem chi tiết')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {onEdit && kpi.status === 'ACTIVE' && (
                    <button
                      onClick={() => onEdit(kpi.id)}
                      className="text-orange-600 hover:text-orange-900 transition-colors"
                      title={t('kpi.actions.edit', 'Chỉnh sửa')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {onRecalculate && kpi.status === 'ACTIVE' && (
                    <button
                      onClick={() => onRecalculate(kpi.id)}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title={t('kpi.actions.recalculate', 'Tính lại')}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  {onDisable && kpi.status === 'ACTIVE' && (
                    <button
                      onClick={() => onDisable(kpi.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title={t('kpi.actions.disable', 'Vô hiệu hóa')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
