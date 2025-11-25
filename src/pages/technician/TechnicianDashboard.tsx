import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuth';
import { useEquipmentStats, useEquipmentsNeedingMaintenance, useEquipmentList } from '@/hooks/useEquipment';
import { Wrench, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { formatNumber } from '@/utils/currency';

const TechnicianDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoading, user } = useAuthState();

  // Get equipment stats - technician doesn't need branchId
  const { stats, loading: statsLoading } = useEquipmentStats();

  // Get equipment needing maintenance
  const { equipments: maintenanceEquipments, loading: maintenanceLoading } = useEquipmentsNeedingMaintenance();

  // Get equipment needing repair
  const { equipments: repairEquipments, loading: repairLoading } = useEquipmentList({
    status: 'REPAIR',
    limit: 5
  });

  // Display loading while fetching
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('staff.loading')}</p>
        </div>
      </div>
    );
  }

  const totalEquipment = stats?.totalEquipments || 0;
  const activeEquipment = stats?.statusStats?.active || 0;
  const maintenanceCount = stats?.statusStats?.maintenance || 0;
  const repairCount = stats?.statusStats?.repair || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('dashboard.welcome', 'Chào mừng')}, {user?.fullName || user?.username}
        </h1>
        <p className="text-gray-600">
          {t('technician.dashboard.description', 'Quản lý và theo dõi thiết bị phòng gym')}
        </p>
      </div>

      {/* Equipment Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Equipment */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              {t('technician.dashboard.total_equipment', 'Tổng thiết bị')}
            </span>
            <Wrench className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {statsLoading ? '...' : formatNumber(totalEquipment)}
          </div>
          <div className="text-xs text-gray-500">
            {t('technician.dashboard.all_equipment', 'Tất cả thiết bị trong hệ thống')}
          </div>
        </div>

        {/* Equipment Needing Maintenance */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              {t('technician.dashboard.maintenance', 'Cần bảo trì')}
            </span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {statsLoading ? '...' : formatNumber(maintenanceCount)}
          </div>
          <div className="text-xs text-gray-500">{t('technician.dashboard.requires_attention', 'Cần chú ý')}</div>
        </div>

        {/* Equipment Needing Repair */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              {t('technician.dashboard.repair', 'Cần sửa chữa')}
            </span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {statsLoading ? '...' : formatNumber(repairCount)}
          </div>
          <div className="text-xs text-gray-500">{t('technician.dashboard.urgent', 'Khẩn cấp')}</div>
        </div>

        {/* Active Equipment */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              {t('technician.dashboard.active', 'Đang hoạt động')}
            </span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {statsLoading ? '...' : formatNumber(activeEquipment)}
          </div>
          <div className="text-xs text-gray-500">{t('technician.dashboard.operational', 'Đang vận hành')}</div>
        </div>
      </div>

      {/* Equipment Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Equipment Needing Maintenance */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 text-yellow-500 mr-2" />
              {t('technician.dashboard.maintenance_list', 'Thiết bị cần bảo trì')}
            </h2>
            <button
              onClick={() => navigate('/manage/technician/equipment?status=MAINTENANCE')}
              className="text-sm text-orange-500 hover:text-orange-600 flex items-center"
            >
              {t('common.view_all', 'Xem tất cả')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          {(() => {
            if (maintenanceLoading) {
              return <div className="text-center py-10 text-sm text-gray-500">{t('common.loading')}</div>;
            }
            if (maintenanceEquipments.length === 0) {
              return (
                <div className="text-center py-10 text-sm text-gray-500">
                  {t('technician.dashboard.no_maintenance', 'Không có thiết bị cần bảo trì')}
                </div>
              );
            }
            return (
              <ul className="space-y-2">
                {maintenanceEquipments.slice(0, 5).map((equipment) => (
                  <li key={equipment._id}>
                    <button
                      className="w-full flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-left"
                      onClick={() => navigate(`/manage/technician/equipment/${equipment._id}`)}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{equipment.equipmentName}</div>
                        <div className="text-sm text-gray-500">{equipment.equipmentCode}</div>
                      </div>
                      <span className="text-xs text-yellow-600 font-medium bg-yellow-100 px-2 py-1 rounded">
                        {t('technician.dashboard.maintenance', 'Bảo trì')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>

        {/* Equipment Needing Repair */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              {t('technician.dashboard.repair_list', 'Thiết bị cần sửa chữa')}
            </h2>
            <button
              onClick={() => navigate('/manage/technician/equipment?status=REPAIR')}
              className="text-sm text-orange-500 hover:text-orange-600 flex items-center"
            >
              {t('common.view_all', 'Xem tất cả')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          {(() => {
            if (repairLoading) {
              return <div className="text-center py-10 text-sm text-gray-500">{t('common.loading')}</div>;
            }
            if (repairEquipments.length === 0) {
              return (
                <div className="text-center py-10 text-sm text-gray-500">
                  {t('technician.dashboard.no_repair', 'Không có thiết bị cần sửa chữa')}
                </div>
              );
            }
            return (
              <ul className="space-y-2">
                {repairEquipments.map((equipment) => (
                  <li key={equipment._id}>
                    <button
                      className="w-full flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
                      onClick={() => navigate(`/manage/technician/equipment/${equipment._id}`)}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{equipment.equipmentName}</div>
                        <div className="text-sm text-gray-500">{equipment.equipmentCode}</div>
                      </div>
                      <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded">
                        {t('technician.dashboard.repair', 'Sửa chữa')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('technician.dashboard.quick_actions', 'Thao tác nhanh')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/manage/technician/equipment')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors"
          >
            <Wrench className="w-6 h-6 text-orange-500 mb-2" />
            <div className="font-medium text-gray-900">{t('technician.dashboard.view_equipment', 'Xem thiết bị')}</div>
            <div className="text-sm text-gray-500">
              {t('technician.dashboard.view_all_equipment', 'Xem tất cả thiết bị')}
            </div>
          </button>
          <button
            onClick={() => navigate('/manage/technician/equipment-inventory')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
          >
            <CheckCircle className="w-6 h-6 text-blue-500 mb-2" />
            <div className="font-medium text-gray-900">{t('technician.dashboard.inventory', 'Kiểm kê')}</div>
            <div className="text-sm text-gray-500">
              {t('technician.dashboard.equipment_inventory', 'Kiểm kê thiết bị')}
            </div>
          </button>
          <button
            onClick={() => navigate('/manage/technician/equipment-issues')}
            className="p-4 bg-pink-50 hover:bg-pink-100 rounded-lg text-left transition-colors"
          >
            <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
            <div className="font-medium text-gray-900">{t('technician.dashboard.issues', 'Sự cố')}</div>
            <div className="text-sm text-gray-500">{t('technician.dashboard.view_issues', 'Xem sự cố thiết bị')}</div>
          </button>
          <button
            onClick={() => navigate('/manage/technician/maintenance')}
            className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors"
          >
            <Clock className="w-6 h-6 text-yellow-500 mb-2" />
            <div className="font-medium text-gray-900">{t('technician.dashboard.maintenance', 'Bảo trì')}</div>
            <div className="text-sm text-gray-500">{t('technician.dashboard.maintenance_logs', 'Lịch sử bảo trì')}</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
