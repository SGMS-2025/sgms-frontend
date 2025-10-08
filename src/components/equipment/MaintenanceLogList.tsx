import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Calendar, User, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useMaintenanceLogs, useDeleteMaintenanceLog } from '../../hooks/useEquipment';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { MaintenanceLog } from '../../types/api/Equipment';

interface MaintenanceLogListProps {
  equipmentId: string;
  onAddLog: () => void;
  onViewLog: (log: MaintenanceLog) => void;
  onEditLog: (log: MaintenanceLog) => void;
  onRefresh?: () => void;
}

export const MaintenanceLogList: React.FC<MaintenanceLogListProps> = ({
  equipmentId,
  onAddLog,
  onViewLog,
  onEditLog,
  onRefresh
}) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  const { maintenanceLogs, loading, error, pagination, refetch, updateFilters, goToPage } = useMaintenanceLogs(
    equipmentId,
    {
      sortBy,
      sortOrder,
      limit: 5
    }
  );

  const { deleteMaintenanceLog, loading: deleteLoading } = useDeleteMaintenanceLog();

  const handleSortChange = (newSortBy: 'createdAt' | 'updatedAt' | 'title') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    updateFilters({ sortBy: newSortBy, sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
  };

  const handleDelete = (logId: string) => {
    setLogToDelete(logId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!logToDelete) return;

    await deleteMaintenanceLog(equipmentId, logToDelete);
    toast.success(t('equipment.maintenance_log_deleted_successfully'));
    refetch();
    onRefresh?.();
    setShowDeleteConfirm(false);
    setLogToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setLogToDelete(null);
  };

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

  if (loading && maintenanceLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center gap-3">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-orange-500">
          {t('equipment.maintenance_history')}
        </h3>
        <button
          onClick={onAddLog}
          className="inline-flex items-center px-3 sm:px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">{t('equipment.add_maintenance_log')}</span>
          <span className="sm:hidden">{t('common.add')}</span>
        </button>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-wrap gap-1 sm:gap-2">
        <span className="text-xs sm:text-sm text-gray-600">{t('common.sort_by')}:</span>
        {(['createdAt', 'updatedAt', 'title'] as const).map((field) => (
          <button
            key={field}
            onClick={() => handleSortChange(field)}
            className={`px-2 sm:px-3 py-1 text-xs rounded-full transition-colors ${
              sortBy === field ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="hidden sm:inline">{t(`equipment.maintenance_log_sort.${field}`)}</span>
            <span className="sm:hidden">{t(`equipment.maintenance_log_sort.${field}`).charAt(0)}</span>
            {sortBy === field && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
          </button>
        ))}
      </div>

      {/* Logs List */}
      {maintenanceLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="mb-4">{t('equipment.no_maintenance_logs')}</p>
          <button
            onClick={onAddLog}
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-md"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">{t('equipment.add_first_maintenance_log')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Logs List */}
          <div className="space-y-2 sm:space-y-3">
            {maintenanceLogs.map((log) => (
              <div
                key={log._id}
                className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">{log.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{log.description}</p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(log.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{getLoggedByDisplay(log.loggedBy)}</span>
                      </div>
                      {log.images && log.images.length > 0 && (
                        <div className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>
                            {log.images.length} {t('common.images')}
                          </span>
                        </div>
                      )}
                      {log.updatedAt && log.updatedAt !== log.createdAt && (
                        <div className="flex items-center gap-1">
                          <span className="text-orange-600">
                            {t('common.updated')}: {formatDate(log.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => onViewLog(log)}
                      className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={t('common.view')}
                    >
                      <Eye className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </button>
                    <button
                      onClick={() => onEditLog(log)}
                      className="p-1.5 sm:p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title={t('common.edit')}
                    >
                      <Edit className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(log._id)}
                      disabled={deleteLoading}
                      className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 sm:mt-6">
          <button
            onClick={() => goToPage(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.previous')}
          </button>

          <span className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600">
            {t('common.page')} {pagination.currentPage} {t('common.of')} {pagination.totalPages}
          </span>

          <button
            onClick={() => goToPage(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.next')}
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('equipment.delete_maintenance_log')}</h3>
                <p className="text-sm text-gray-500 mb-6">{t('equipment.maintenance_log_confirm_delete')}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 h-10 px-4 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 h-10 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deleteLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">{t('common.deleting')}</span>
                    </>
                  ) : (
                    t('common.delete')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
