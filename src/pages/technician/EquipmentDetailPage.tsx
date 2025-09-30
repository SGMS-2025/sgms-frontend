import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, Wrench, Dumbbell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { QRCodeButton } from '../../components/QRCodeButton';
import { useEquipmentDetails, useAddMaintenanceLog } from '../../hooks/useEquipment';
import { getEquipmentStatusDisplay, EQUIPMENT_CATEGORY_DISPLAY } from '../../types/api/Equipment';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { NotFoundMessage } from '../../components/common/NotFoundMessage';

export const EquipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Determine base path based on current location
  const getBasePath = () => {
    if (location.pathname.startsWith('/manage/technician')) {
      return '/manage/technician/equipment';
    } else if (location.pathname.startsWith('/manage')) {
      return '/manage/equipment';
    }
    return '/manage/technician/equipment'; // fallback
  };

  const {
    equipment,
    loading: equipmentLoading,
    error: equipmentError,
    refetch: refetchEquipment
  } = useEquipmentDetails(id || null);

  // Add maintenance log mutation
  const {
    addMaintenanceLog,
    loading: maintenanceLoading,
    error: maintenanceError,
    resetError: resetMaintenanceError
  } = useAddMaintenanceLog();

  // Local state cho modal
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceDescription, setMaintenanceDescription] = useState('');

  const handleAddMaintenanceLog = async () => {
    if (!equipment || !maintenanceDescription.trim()) return;

    const result = await addMaintenanceLog(equipment._id, {
      description: maintenanceDescription
    });

    if (result) {
      setMaintenanceDescription('');
      setShowMaintenanceModal(false);
      refetchEquipment(); // Refresh equipment data
      toast.success(t('equipment.maintenance_log_added'));
    }
  };

  const getStatusDisplay = (status: string) => {
    return getEquipmentStatusDisplay(status, t);
  };

  // Loading state
  const loading = equipmentLoading || maintenanceLoading;

  // Error state
  const error = equipmentError || maintenanceError;

  if (loading && !equipment) {
    return <LoadingSpinner />;
  }

  if (equipmentError && !equipment) {
    return <NotFoundMessage message={t('equipment.not_found')} />;
  }

  if (!equipment) {
    return <NotFoundMessage message={t('equipment.not_found')} />;
  }

  const statusDisplay = getStatusDisplay(equipment.status);

  return (
    <div className="px-3 sm:px-4 lg:px-6">
      <div className="mt-4">
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {t('equipment.equipment_management')}
                </span>
                <h2 className="mt-3 text-2xl font-semibold text-gray-900">{equipment.equipmentName}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t('equipment.equipment_detail_subtitle') ||
                    'View and manage equipment details and maintenance history.'}
                </p>
              </div>
              <button
                onClick={() => navigate(getBasePath())}
                className="h-11 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
              >
                <ArrowLeft className="mr-2 h-4 w-4 inline" />
                {t('equipment.back_to_list')}
              </button>
            </div>
          </div>

          {/* Equipment Details */}
          <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-orange-600">{equipment.equipmentName}</h2>
              <div className="flex items-center space-x-3">
                <QRCodeButton
                  equipment={equipment}
                  size="md"
                  variant="primary"
                  showText={true}
                  onQRGenerated={() => {
                    refetchEquipment(); // Refresh equipment data
                    toast.success('QR code đã được cập nhật');
                  }}
                />
                <button
                  onClick={() => navigate(`${getBasePath()}/${equipment._id}/edit`)}
                  className="h-11 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                >
                  <Edit className="mr-2 h-4 w-4 inline" />
                  {t('common.edit')}
                </button>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Equipment Image */}
              <div className="w-64 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                {equipment.images && equipment.images.length > 0 ? (
                  <img
                    src={equipment.images[0].url}
                    alt={equipment.equipmentName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold">H</span>
                    </div>
                    <p>{t('equipment.no_image')}</p>
                  </div>
                )}
              </div>

              {/* Equipment Information */}
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">{t('equipment.equipment_code')}</label>
                    <p className="text-lg font-semibold text-gray-900">{equipment.equipmentCode}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">{t('equipment.equipment_name')}</label>
                    <p className="text-lg font-semibold text-gray-900">{equipment.equipmentName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      {t('equipment.equipment_category')}
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {EQUIPMENT_CATEGORY_DISPLAY[equipment.category]}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">{t('equipment.equipment_status')}</label>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        statusDisplay.color === 'green'
                          ? 'bg-green-100 text-green-800'
                          : statusDisplay.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : statusDisplay.color === 'red'
                              ? 'bg-red-100 text-red-800'
                              : statusDisplay.color === 'orange'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {statusDisplay.icon} {statusDisplay.label}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">{t('equipment.date_of_purchase')}</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(equipment.dateOfPurchase).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      {t('equipment.warranty_expiration')}
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(equipment.warrantyExpirationDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">{t('equipment.manufacturer')}</label>
                    <p className="text-lg font-semibold text-gray-900">{equipment.manufacturer}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">{t('equipment.price')}</label>
                    <p className="text-lg font-semibold text-gray-900">{equipment.price} VNĐ</p>
                  </div>

                  {equipment.location && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">{t('equipment.location')}</label>
                      <p className="text-lg font-semibold text-gray-900">{equipment.location}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance History */}
          <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-orange-600">{t('equipment.maintenance_history')}</h2>
              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="h-11 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
              >
                <Plus className="mr-2 h-4 w-4 inline" />
                {t('equipment.add_maintenance_log')}
              </button>
            </div>

            {equipment.maintenanceLogs && equipment.maintenanceLogs.length > 0 ? (
              <div className="space-y-4">
                {equipment.maintenanceLogs.map((log, index) => (
                  <div key={log._id} className="rounded-2xl border border-orange-100 bg-[#FFF9F2] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">BẢO TRÌ LẦN {index + 1}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block text-gray-600">Ngày báo cáo</label>
                        <p className="font-medium">{new Date(log.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div>
                        <label className="block text-gray-600">Người báo cáo</label>
                        <p className="font-medium">Nguyễn Thành Đức (Quản lý thiết bị cơ sở 1)</p>
                      </div>
                      <div>
                        <label className="block text-gray-600">Ngày duyệt đơn</label>
                        <p className="font-medium">02/09/2025</p>
                      </div>
                      <div>
                        <label className="block text-gray-600">Người duyệt</label>
                        <p className="font-medium">Đặng Thành Vinh (Owner)</p>
                      </div>
                      <div>
                        <label className="block text-gray-600">Người tiếp nhận xử lý</label>
                        <p className="font-medium">Trần Quốc Mình (Bộ phận bảo trì)</p>
                      </div>
                      <div>
                        <label className="block text-gray-600">Trạng thái</label>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Wrench className="w-3 h-3 mr-1" />
                          Đang sửa chữa
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-gray-600 text-sm">Mô tả</label>
                      <p className="text-gray-900">{log.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>{t('equipment.no_maintenance_logs')}</p>
              </div>
            )}
          </div>

          {/* Maintenance Modal */}
          {showMaintenanceModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-orange-100 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">{t('equipment.add_maintenance_log')}</h3>

                {/* Error Display */}
                {maintenanceError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm text-red-700">{maintenanceError}</div>
                    <button onClick={resetMaintenanceError} className="mt-2 text-xs text-red-600 hover:text-red-800">
                      {t('common.dismiss')}
                    </button>
                  </div>
                )}

                <textarea
                  value={maintenanceDescription}
                  onChange={(e) => setMaintenanceDescription(e.target.value)}
                  placeholder={t('equipment.maintenance_description_placeholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
                  rows={4}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowMaintenanceModal(false);
                      setMaintenanceDescription('');
                      resetMaintenanceError();
                    }}
                    className="h-11 rounded-full border border-gray-300 px-6 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    disabled={maintenanceLoading}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleAddMaintenanceLog}
                    className="h-11 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-50"
                    disabled={maintenanceLoading || !maintenanceDescription.trim()}
                  >
                    {maintenanceLoading ? t('common.loading') : t('common.add')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{t('common.error')}</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        resetMaintenanceError();
                        if (equipmentError) {
                          refetchEquipment();
                        }
                      }}
                      className="bg-red-100 px-2 py-1 text-sm font-medium text-red-800 rounded-md hover:bg-red-200"
                    >
                      {t('common.dismiss')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
