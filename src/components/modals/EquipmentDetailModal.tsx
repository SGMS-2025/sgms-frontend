import React, { useState } from 'react';
import { Edit, X, Calendar, DollarSign, MapPin, Wrench, Dumbbell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { QRCodeButton } from '../QRCodeButton';
import { useEquipmentDetails, useDeleteMaintenanceLog } from '../../hooks/useEquipment';
import { getEquipmentStatusDisplay, EQUIPMENT_CATEGORY_DISPLAY } from '../../types/api/Equipment';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { MaintenanceLogList } from '../equipment/MaintenanceLogList';
import { MaintenanceLogDetail } from '../equipment/MaintenanceLogDetail';
import { MaintenanceLogForm } from '../equipment/MaintenanceLogForm';
import type { Equipment, MaintenanceLog } from '../../types/api/Equipment';

interface EquipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string | null;
  onEdit?: (equipment: Equipment) => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({ isOpen, onClose, equipmentId, onEdit }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'equipment' | 'maintenance'>('equipment');
  const [selectedMaintenanceLog, setSelectedMaintenanceLog] = useState<MaintenanceLog | null>(null);
  const [showMaintenanceLogForm, setShowMaintenanceLogForm] = useState(false);
  const [editingMaintenanceLog, setEditingMaintenanceLog] = useState<MaintenanceLog | null>(null);
  const [maintenanceLogsKey, setMaintenanceLogsKey] = useState(0);

  const {
    equipment,
    loading: equipmentLoading,
    error: equipmentError,
    refetch: refetchEquipment
  } = useEquipmentDetails(equipmentId);

  const { deleteMaintenanceLog, loading: deleteLoading } = useDeleteMaintenanceLog();

  const getStatusDisplay = (status: string) => {
    return getEquipmentStatusDisplay(status, t);
  };

  const handleEdit = () => {
    if (equipment && onEdit) {
      onEdit(equipment);
    }
  };

  const handleAddMaintenanceLog = () => {
    setEditingMaintenanceLog(null);
    setShowMaintenanceLogForm(true);
  };

  const handleViewMaintenanceLog = (log: MaintenanceLog) => {
    setSelectedMaintenanceLog(log);
  };

  const handleEditMaintenanceLog = (log: MaintenanceLog) => {
    setEditingMaintenanceLog(log);
    setShowMaintenanceLogForm(true);
  };

  const handleMaintenanceLogFormSuccess = () => {
    setShowMaintenanceLogForm(false);
    setEditingMaintenanceLog(null);
    refetchEquipment(); // Refresh equipment data
    // Force refresh maintenance logs list
    setMaintenanceLogsKey((prev) => prev + 1);
    // Switch back to maintenance tab to show updated list
    setActiveTab('maintenance');
  };

  const handleMaintenanceLogFormClose = () => {
    setShowMaintenanceLogForm(false);
    setEditingMaintenanceLog(null);
  };

  const handleMaintenanceLogDetailClose = () => {
    setSelectedMaintenanceLog(null);
  };

  const handleMaintenanceLogDetailEdit = () => {
    if (selectedMaintenanceLog) {
      setEditingMaintenanceLog(selectedMaintenanceLog);
      setSelectedMaintenanceLog(null);
      setShowMaintenanceLogForm(true);
    }
  };

  const handleMaintenanceLogDetailDelete = async () => {
    if (selectedMaintenanceLog && equipmentId) {
      await deleteMaintenanceLog(equipmentId, selectedMaintenanceLog._id);
      toast.success(t('equipment.maintenance_log_deleted_successfully'));
      setSelectedMaintenanceLog(null);
      setMaintenanceLogsKey((prev) => prev + 1); // Force refresh maintenance logs list
      refetchEquipment();
    }
  };

  // Loading state
  const loading = equipmentLoading;

  // Error state
  const error = equipmentError;

  if (!isOpen) return null;

  if (loading && !equipment) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (equipmentError && !equipment) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{t('equipment.not_found')}</p>
              <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-600 mb-4">{t('equipment.not_found')}</p>
              <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(equipment.status);

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-1 sm:p-4">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-4xl w-full max-h-[98vh] sm:max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Modal Header */}
        <div className="bg-[#f05a29] p-3 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div>
            <h2 className="text-white text-base sm:text-lg md:text-xl font-bold pr-6 sm:pr-8">
              {equipment.equipmentName}
            </h2>
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
              <span className="bg-white text-orange-500 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {statusDisplay.label}
              </span>
              <span className="bg-white text-orange-500 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {EQUIPMENT_CATEGORY_DISPLAY[equipment.category]}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b bg-gray-50">
          <div className="flex px-2 sm:px-6">
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-1 sm:px-4 py-2 sm:py-4 font-medium border-b-2 transition-colors text-xs sm:text-sm md:text-base ${
                activeTab === 'equipment'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('equipment.equipment_information')}</span>
              <span className="sm:hidden">{t('equipment.equipment_info')}</span>
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-1 sm:px-4 py-2 sm:py-4 font-medium border-b-2 transition-colors text-xs sm:text-sm md:text-base ${
                activeTab === 'maintenance'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wrench className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('equipment.maintenance_history')}</span>
              <span className="sm:hidden">{t('equipment.maintenance')}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 bg-gray-50">
          {activeTab === 'equipment' ? (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-6 gap-2 sm:gap-3">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-orange-500">
                    {t('equipment.equipment_info').toUpperCase()}
                  </h3>
                  <div className="flex items-center gap-1 sm:gap-3">
                    <QRCodeButton
                      equipment={equipment}
                      size="md"
                      variant="primary"
                      showText={true}
                      onQRGenerated={() => {
                        refetchEquipment(); // Refresh equipment data
                      }}
                    />
                    <button
                      onClick={handleEdit}
                      className="h-8 sm:h-10 md:h-11 rounded-full bg-orange-500 px-3 sm:px-4 md:px-6 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-orange-600 flex items-center justify-center"
                    >
                      <Edit className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                      <span className="hidden sm:inline">{t('common.edit')}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-6">
                  {/* Row 1: Equipment Code, Equipment Name, Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm sm:text-base">{t('equipment.equipment_code')}</span>
                      </div>
                      <div className="bg-white p-2 sm:p-3 rounded-lg">
                        <p className="text-gray-700 text-xs sm:text-sm md:text-base">{equipment.equipmentCode}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm sm:text-base">{t('equipment.equipment_name')}</span>
                      </div>
                      <div className="bg-white p-2 sm:p-3 rounded-lg">
                        <p className="text-gray-700 text-xs sm:text-sm md:text-base">{equipment.equipmentName}</p>
                      </div>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm sm:text-base">{t('equipment.equipment_category')}</span>
                      </div>
                      <div className="bg-white p-2 sm:p-3 rounded-lg">
                        <span className="text-orange-600 text-xs sm:text-sm md:text-base">
                          {EQUIPMENT_CATEGORY_DISPLAY[equipment.category]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Date of Purchase, Warranty Expiration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium text-sm sm:text-base">{t('equipment.date_of_purchase')}</span>
                      </div>
                      <div className="bg-white p-2 sm:p-3 rounded-lg">
                        <p className="text-gray-700 text-xs sm:text-sm md:text-base">
                          {new Date(equipment.dateOfPurchase).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium text-sm sm:text-base">{t('equipment.warranty_expiration')}</span>
                      </div>
                      <div className="bg-white p-2 sm:p-3 rounded-lg">
                        <p className="text-gray-700 text-xs sm:text-sm md:text-base">
                          {new Date(equipment.warrantyExpirationDate).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Manufacturer, Price, Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm sm:text-base">{t('equipment.manufacturer')}</span>
                      </div>
                      <div className="bg-white p-2 sm:p-3 rounded-lg">
                        <p className="text-gray-700 text-xs sm:text-sm md:text-base">{equipment.manufacturer}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium text-sm sm:text-base">{t('equipment.price')}</span>
                      </div>
                      <div className="bg-white p-2 sm:p-3 rounded-lg">
                        <p className="text-gray-700 text-xs sm:text-sm md:text-base">
                          {equipment.price?.toLocaleString()} VNĐ
                        </p>
                      </div>
                    </div>

                    {equipment.location && (
                      <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium text-sm sm:text-base">{t('equipment.location')}</span>
                        </div>
                        <div className="bg-white p-2 sm:p-3 rounded-lg">
                          <p className="text-gray-700 text-xs sm:text-sm md:text-base">{equipment.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Maintenance tab
            <div className="space-y-3 sm:space-y-6">
              {equipmentId && (
                <MaintenanceLogList
                  key={maintenanceLogsKey}
                  equipmentId={equipmentId}
                  onAddLog={handleAddMaintenanceLog}
                  onViewLog={handleViewMaintenanceLog}
                  onEditLog={handleEditMaintenanceLog}
                  onRefresh={refetchEquipment}
                />
              )}
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

      {/* Maintenance Log Detail Modal */}
      {selectedMaintenanceLog && (
        <MaintenanceLogDetail
          maintenanceLog={selectedMaintenanceLog}
          onClose={handleMaintenanceLogDetailClose}
          onEdit={handleMaintenanceLogDetailEdit}
          onDelete={handleMaintenanceLogDetailDelete}
          isDeleting={deleteLoading}
        />
      )}

      {/* Maintenance Log Form Modal */}
      {showMaintenanceLogForm && equipmentId && (
        <MaintenanceLogForm
          equipmentId={equipmentId}
          maintenanceLog={editingMaintenanceLog}
          onClose={handleMaintenanceLogFormClose}
          onSuccess={handleMaintenanceLogFormSuccess}
        />
      )}
    </div>
  );
};
