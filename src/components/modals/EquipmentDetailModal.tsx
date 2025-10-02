import React, { useState } from 'react';
import { Edit, X, Calendar, DollarSign, MapPin, Wrench, Dumbbell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QRCodeButton } from '../QRCodeButton';
import { useEquipmentDetails } from '../../hooks/useEquipment';
import { getEquipmentStatusDisplay, EQUIPMENT_CATEGORY_DISPLAY } from '../../types/api/Equipment';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { Equipment } from '../../types/api/Equipment';

interface EquipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string | null;
  onEdit?: (equipment: Equipment) => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({ isOpen, onClose, equipmentId, onEdit }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'equipment' | 'maintenance'>('equipment');

  const {
    equipment,
    loading: equipmentLoading,
    error: equipmentError,
    refetch: refetchEquipment
  } = useEquipmentDetails(equipmentId);

  const getStatusDisplay = (status: string) => {
    return getEquipmentStatusDisplay(status, t);
  };

  const handleEdit = () => {
    if (equipment && onEdit) {
      onEdit(equipment);
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
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Modal Header */}
        <div className="bg-[#f05a29] p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>

          <div>
            <h2 className="text-white text-xl font-bold">{equipment.equipmentName}</h2>
            <div className="flex gap-2 mt-2">
              <span className="bg-white text-orange-500 px-3 py-1 rounded-full text-sm font-medium">
                {statusDisplay.label}
              </span>
              <span className="bg-white text-orange-500 px-3 py-1 rounded-full text-sm font-medium">
                {EQUIPMENT_CATEGORY_DISPLAY[equipment.category]}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b bg-gray-50">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-4 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'equipment'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Dumbbell className="w-4 h-4 inline mr-2" />
              {t('equipment.equipment_information')}
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'maintenance'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wrench className="w-4 h-4 inline mr-2" />
              {t('equipment.maintenance_history')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-gray-50">
          {activeTab === 'equipment' ? (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-orange-500">{t('equipment.equipment_info').toUpperCase()}</h3>
                  <div className="flex items-center space-x-3">
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
                      className="h-11 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                    >
                      <Edit className="mr-2 h-4 w-4 inline" />
                      {t('common.edit')}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Row 1: Equipment Code, Equipment Name, Category */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{t('equipment.equipment_code')}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-700">{equipment.equipmentCode}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{t('equipment.equipment_name')}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-700">{equipment.equipmentName}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{t('equipment.equipment_category')}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <span className="text-orange-600">{EQUIPMENT_CATEGORY_DISPLAY[equipment.category]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Date of Purchase, Warranty Expiration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{t('equipment.date_of_purchase')}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-700">
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
                        <span className="font-medium">{t('equipment.warranty_expiration')}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-700">
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
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{t('equipment.manufacturer')}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-700">{equipment.manufacturer}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">{t('equipment.price')}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-700">{equipment.price?.toLocaleString()} VNĐ</p>
                      </div>
                    </div>

                    {equipment.location && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{t('equipment.location')}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-gray-700">{equipment.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Maintenance tab - bỏ qua nội dung như yêu cầu
            <div className="text-center py-8 text-gray-500">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>{t('equipment.maintenance_not_available')}</p>
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
    </div>
  );
};
