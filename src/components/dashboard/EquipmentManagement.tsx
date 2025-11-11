import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useEquipmentList } from '@/hooks/useEquipment';
import { useBranch } from '@/contexts/BranchContext';
import { formatDate } from '@/utils/utils';
import { formatNumber } from '@/utils/currency';
import type { EquipmentStatus, EquipmentCategory } from '@/types/api/Equipment';

// Equipment categories mapping
const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  'CARDIO',
  'STRENGTH',
  'FUNCTIONAL',
  'FLEXIBILITY',
  'SPORTS',
  'ACCESSORIES',
  'OTHER'
];

export const EquipmentManagement: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentBranch, branches } = useBranch();
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | ''>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Fetch equipment with filters
  const { equipments, loading, error, updateFilters } = useEquipmentList({
    branchId: currentBranch?._id,
    category: selectedCategory || undefined,
    limit: 100 // Increase limit to get all for filtering
  });

  // Get unique locations from equipment list
  const uniqueLocations = useMemo(() => {
    const locations = equipments
      .map((eq) => eq.location)
      .filter((loc): loc is string => typeof loc === 'string' && loc.trim() !== '');
    return Array.from(new Set(locations)).sort((a, b) => a.localeCompare(b));
  }, [equipments]);

  // Map equipment status to display text
  const getStatusText = React.useCallback(
    (status: EquipmentStatus): string => {
      switch (status) {
        case 'ACTIVE':
          return t('dashboard.in_use', 'Đang sử dụng');
        case 'MAINTENANCE':
          return t('dashboard.maintenance', 'Bảo trì');
        case 'REPAIR':
          return t('dashboard.repair', 'Sửa chữa');
        case 'RETIRED':
          return t('dashboard.retired', 'Ngưng sử dụng');
        case 'INACTIVE':
          return t('dashboard.inactive', 'Không hoạt động');
        default:
          return status;
      }
    },
    [t]
  );

  // Filter equipment by location if selected
  const filteredEquipments = useMemo(() => {
    if (!selectedLocation) {
      return equipments;
    }
    return equipments.filter((eq) => eq.location === selectedLocation);
  }, [equipments, selectedLocation]);

  // Map equipment data to display format
  const equipmentData = useMemo(() => {
    return filteredEquipments.map((equipment) => ({
      id: equipment._id,
      code: equipment.equipmentCode,
      name: equipment.equipmentName,
      date: formatDate(equipment.dateOfPurchase || equipment.createdAt),
      price: formatNumber(equipment.price),
      status: getStatusText(equipment.status)
    }));
  }, [filteredEquipments, getStatusText]);

  // Handle category filter change
  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const category = e.target.value as EquipmentCategory | '';
      setSelectedCategory(category);
      updateFilters({ category: category || undefined });
    },
    [updateFilters]
  );

  // Handle location filter change
  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocation(e.target.value);
  }, []);

  // Handle detailed report button click
  const handleDetailedReportClick = useCallback(() => {
    // Navigate to equipment list page
    navigate('/manage/equipment');
  }, [navigate]);

  // Get category display name using i18n
  const getCategoryDisplayName = useCallback(
    (category: EquipmentCategory): string => {
      // Use i18n keys for equipment categories
      const categoryKey = `equipment.category.${category.toLowerCase()}`;
      // Fallback to capitalized category name if translation not found
      const fallback = category.charAt(0) + category.slice(1).toLowerCase();
      return t(categoryKey, fallback);
    },
    [t]
  );

  return (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Settings className="w-4 h-4 text-orange-500 mr-2" />
          <span className="text-sm text-orange-500 font-semibold">{t('dashboard.facility_management')}</span>
        </div>
        <button
          onClick={handleDetailedReportClick}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full bg-white hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors flex items-center leading-none disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!currentBranch}
          title={currentBranch ? '' : t('dashboard.select_branch_first', 'Vui lòng chọn chi nhánh trước')}
        >
          {t('dashboard.detailed_report')} <span className="ml-2">→</span>
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-3">{t('dashboard.training_equipment')}</h3>
        <div className="flex space-x-4">
          {/* Branch/Facility Filter - Only show if user has multiple branches */}
          {branches && branches.length > 1 && (
            <select
              value={currentBranch?._id || ''}
              onChange={(e) => {
                const branchId = e.target.value;
                if (branchId && currentBranch?._id !== branchId) {
                  // Update filter but don't change global currentBranch
                  updateFilters({ branchId });
                }
              }}
              className="px-4 py-2 text-sm border border-gray-300 rounded bg-white text-gray-700 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
            >
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          )}

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={handleLocationChange}
            className="px-4 py-2 text-sm border border-gray-300 rounded bg-white text-gray-700 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
            disabled={uniqueLocations.length === 0}
          >
            <option value="">{t('dashboard.all_locations', 'Tất cả vị trí')}</option>
            {uniqueLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="px-4 py-2 text-sm border border-gray-300 rounded bg-white text-gray-700 focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
          >
            <option value="">{t('dashboard.all_categories', 'Tất cả loại')}</option>
            {EQUIPMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {getCategoryDisplayName(category)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-orange-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 text-orange-500 text-sm font-semibold bg-orange-50">
          <div>{t('dashboard.machine_code')}</div>
          <div>{t('dashboard.machine_name')}</div>
          <div>{t('dashboard.import_time')}</div>
          <div>{t('dashboard.unit_price')}</div>
          <div>{t('dashboard.condition')}</div>
        </div>
        {(() => {
          if (loading) {
            return <div className="text-center py-10 text-sm text-gray-500">{t('common.loading', 'Đang tải...')}</div>;
          }
          if (error) {
            return <div className="text-center py-10 text-sm text-red-500">{t('common.error', 'Có lỗi xảy ra')}</div>;
          }
          if (equipmentData.length === 0) {
            return <div className="text-center py-10 text-sm text-gray-500">—</div>;
          }
          return equipmentData.map((item, index) => (
            <div
              key={item.id}
              className={`grid grid-cols-5 gap-4 p-4 text-sm border-t border-gray-200 ${
                index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="text-gray-800">{item.code}</div>
              <div className="text-gray-800">{item.name}</div>
              <div className="text-gray-800">{item.date}</div>
              <div className="text-gray-800">{item.price}</div>
              <div className="text-gray-800">{item.status}</div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
};
