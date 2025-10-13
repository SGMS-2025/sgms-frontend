import React, { useState } from 'react';
import { X, Calendar, User, Image as ImageIcon, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MaintenanceLog } from '../../types/api/Equipment';

interface MaintenanceLogDetailProps {
  maintenanceLog: MaintenanceLog;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export const MaintenanceLogDetail: React.FC<MaintenanceLogDetailProps> = ({
  maintenanceLog,
  onClose,
  onEdit,
  onDelete,
  isDeleting = false
}) => {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLoggedByDisplay = (loggedBy: MaintenanceLog['loggedBy']) => {
    if (typeof loggedBy === 'string') {
      return loggedBy;
    }
    return loggedBy?.fullName || t('common.unknown');
  };

  const getLoggedByEmail = (loggedBy: MaintenanceLog['loggedBy']) => {
    if (typeof loggedBy === 'string') {
      return null;
    }
    return loggedBy?.email;
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="bg-orange-500 p-4 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="pr-8">
            <h2 className="text-white text-lg sm:text-xl font-bold">{maintenanceLog.title}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-white text-orange-500 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {t('equipment.maintenance_log')}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('equipment.description')}</h3>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{maintenanceLog.description}</p>
            </div>
          </div>

          {/* Images */}
          {maintenanceLog.images && maintenanceLog.images.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t('common.images')} ({maintenanceLog.images.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {maintenanceLog.images.map((image, index) => (
                  <div key={`detail-${image.publicId}-${index}`} className="relative group">
                    <img
                      src={image.url}
                      alt={`${t('equipment.maintenance_log')} ${index + 1}`}
                      className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => window.open(image.url, '_blank')}
                        className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium transition-opacity"
                      >
                        <ImageIcon className="w-4 h-4 inline mr-1" />
                        {t('common.view_full')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('equipment.log_information')}</h3>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-sm text-gray-700">{t('equipment.created_at')}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-gray-700 text-sm">{formatDate(maintenanceLog.createdAt)}</p>
                </div>
              </div>

              {maintenanceLog.updatedAt && maintenanceLog.updatedAt !== maintenanceLog.createdAt && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm text-gray-700">{t('equipment.updated_at')}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-gray-700 text-sm">{formatDate(maintenanceLog.updatedAt)}</p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-sm text-gray-700">{t('equipment.logged_by')}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-gray-700 text-sm">{getLoggedByDisplay(maintenanceLog.loggedBy)}</p>
                  {getLoggedByEmail(maintenanceLog.loggedBy) && (
                    <p className="text-gray-500 text-xs mt-1">{getLoggedByEmail(maintenanceLog.loggedBy)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white px-3 sm:px-6 py-3 sm:py-4 flex flex-col gap-2 sm:flex-row sm:gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.close')}
          </button>
          <button
            onClick={onEdit}
            className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            {t('common.edit')}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? t('common.deleting') : t('common.delete')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-2 sm:p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('equipment.delete_maintenance_log')}</h3>
                <p className="text-sm text-gray-600 mt-1">{t('equipment.maintenance_log_confirm_delete')}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 sm:justify-end">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 h-10"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center h-10"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {t('common.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common.delete')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
