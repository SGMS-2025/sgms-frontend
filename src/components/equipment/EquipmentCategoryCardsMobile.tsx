import React from 'react';
import { useTranslation } from 'react-i18next';
import { EQUIPMENT_CATEGORY_DISPLAY } from '@/types/api/Equipment';
import type { EquipmentCategory } from '@/types/api/Equipment';

interface CategoryStat {
  _id: EquipmentCategory;
  count: number;
}

interface EquipmentCategoryCardsMobileProps {
  totalEquipments: number;
  categoryStats: CategoryStat[];
}

export const EquipmentCategoryCardsMobile: React.FC<EquipmentCategoryCardsMobileProps> = ({
  totalEquipments,
  categoryStats
}) => {
  const { t } = useTranslation();

  // All equipment categories in order
  const allCategories: EquipmentCategory[] = [
    'STRENGTH',
    'CARDIO',
    'FLEXIBILITY',
    'FUNCTIONAL',
    'SPORTS',
    'ACCESSORIES',
    'OTHER'
  ];

  // Get count for a category
  const getCategoryCount = (category: EquipmentCategory): number => {
    const stat = categoryStats.find((c) => c._id === category);
    return stat?.count || 0;
  };

  return (
    <div className="lg:hidden">
      {/* Total Equipment Items */}
      <div className="mb-4">
        <div className="rounded-xl border border-orange-100 bg-[#FFF6EE] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-orange-500 mb-2">
            {t('equipment.total_equipment_helper') || 'TOTAL EQUIPMENT ITEMS'}
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalEquipments}</div>
        </div>
      </div>

      {/* Category Cards - Mobile optimized (no descriptions) */}
      <div className="grid grid-cols-2 gap-3">
        {allCategories.map((category) => {
          const count = getCategoryCount(category);
          const displayName = EQUIPMENT_CATEGORY_DISPLAY[category] || category;

          return (
            <div key={category} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-900 mb-1">{displayName}</div>
              <div className="text-2xl font-semibold text-gray-900">{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
