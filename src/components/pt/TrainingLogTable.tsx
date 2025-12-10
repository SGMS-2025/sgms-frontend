import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import { MoreHorizontal, Edit, Trash2, Camera, Dumbbell, Calendar, Calculator } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTrainingProgress } from '@/hooks/useTrainingProgress';
import { toast } from 'sonner';
import type { TrainingProgressDisplay } from '@/types/api/TrainingProgress';
import type { TrainingLogTableProps } from '@/types/components/pt/Progress';

type TrainingLog = TrainingProgressDisplay;

export const TrainingLogTable: React.FC<TrainingLogTableProps> = ({ logs, onEdit, onDelete, readOnly }) => {
  const { t } = useTranslation();
  const { deleteProgress, deleteLoading } = useTrainingProgress();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const isMobile = useIsMobile();

  const formatDate = (dateString: string) => {
    return dateString;
  };

  // Reset/Clamp page when logs change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [logs, page]);

  const pagedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, page]);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const handleDeleteClick = (logId: string) => {
    if (readOnly) return;
    setDeleteLogId(logId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteLogId || readOnly) return;

    const response = await deleteProgress(deleteLogId);

    if (response.success) {
      onDelete?.(deleteLogId);
      setDeleteLogId(null);
      toast.success(t('toast.progress_deleted_success'));
    } else {
      console.error('Failed to delete progress:', response.message);
      toast.error(response.message || t('toast.progress_delete_failed'));
    }
  };

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (bmi < 25) return 'text-green-600 bg-green-50 border-green-200';
    if (bmi < 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Reusable Components
  const ActionMenu: React.FC<{ log: TrainingLog }> = ({ log }) => {
    if (readOnly) return null;
    if (!onEdit) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={() => onEdit(log)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('training_log.table.edit')}
          </DropdownMenuItem>
          {onDelete && (
            <DropdownMenuItem onClick={() => handleDeleteClick(log.id)} className="text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('training_log.table.delete')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const BMIBadge: React.FC<{ bmi: number }> = ({ bmi }) => (
    <Badge variant="outline" className={`${getBMIColor(bmi)} border font-medium`}>
      {bmi.toFixed(1)}
    </Badge>
  );

  const StrengthBadge: React.FC<{ strength: string | number }> = ({ strength }) => (
    <Badge variant="outline" className="bg-[#F05A29] bg-opacity-10 text-[#F05A29] border-[#F05A29]">
      {strength}
    </Badge>
  );

  const PhotoGallery: React.FC<{
    photos: Array<{ url: string }>;
    maxPhotos?: number;
    size?: 'sm' | 'lg';
  }> = ({ photos, maxPhotos = 3, size = 'sm' }) => {
    if (!photos || photos.length === 0) {
      return <Camera className="h-4 w-4 text-gray-300" />;
    }

    const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';

    return (
      <div className="flex gap-1">
        {photos.slice(0, maxPhotos).map((photo, index) => (
          <button
            key={index}
            onClick={() => setPreviewImage(photo.url)}
            className={`${sizeClass} rounded border overflow-hidden hover:opacity-80 transition-opacity`}
          >
            <img src={photo.url} alt={`Training ${index + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
        {photos.length > maxPhotos &&
          (size === 'sm' ? (
            <span className="text-xs text-gray-500 ml-1">+{photos.length - maxPhotos}</span>
          ) : (
            <div className={`${sizeClass} rounded border bg-gray-100 flex items-center justify-center`}>
              <span className="text-xs text-gray-500">+{photos.length - maxPhotos}</span>
            </div>
          ))}
      </div>
    );
  };

  const PaginationControls: React.FC<{ variant: 'desktop' | 'mobile' }> = ({ variant }) => {
    if (totalPages <= 1) return null;

    if (variant === 'mobile') {
      return (
        <div className="flex items-center justify-between mt-2">
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={!canPrev}>
            {t('training_log.pagination.prev')}
          </Button>
          <div className="text-sm text-gray-500">
            {page}/{totalPages}
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={!canNext}>
            {t('training_log.pagination.next')}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between mt-3 px-4">
        <div className="text-sm text-gray-500">
          {t('training_log.pagination.page')} {page} {t('training_log.pagination.of')} {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={!canPrev}>
            {t('training_log.pagination.prev')}
          </Button>
          <div className="hidden md:flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(p)}
                className={p === page ? 'bg-[#F05A29] text-white hover:bg-[#df4615]' : ''}
              >
                {p}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={!canNext}>
            {t('training_log.pagination.next')}
          </Button>
        </div>
      </div>
    );
  };

  const ModalComponents: React.FC = () => (
    <>
      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('training_log.modal.photo_title')}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex justify-center">
              <img src={previewImage} alt="Training" className="max-w-full max-h-96 rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      {!readOnly && onDelete && (
        <DeleteConfirmationModal
          isOpen={!!deleteLogId}
          onClose={() => setDeleteLogId(null)}
          onConfirm={handleConfirmDelete}
          isLoading={deleteLoading}
          title={t('training_log.modal.delete_title')}
          description={t('training_log.modal.delete_description')}
        />
      )}
    </>
  );

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Dumbbell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold mb-2">{t('training_log.no_logs_title')}</h3>
        <p className="text-sm">{t('training_log.no_logs_description')}</p>
      </div>
    );
  }

  // Desktop table view
  if (!isMobile) {
    return (
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  {t('training_log.table.date')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  {t('training_log.table.weight')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  {t('training_log.table.bmi')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  {t('training_log.table.strength')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  {t('training_log.table.note')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                  {t('training_log.table.photos')}
                </th>
                {!readOnly && onEdit && (
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                    {t('training_log.table.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {pagedLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{formatDate(log.date)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-[#101D33]">{log.weight} kg</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-gray-400" />
                      <BMIBadge bmi={log.bmi} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <StrengthBadge strength={log.strength} />
                  </td>
                  <td className="py-4 px-4 max-w-xs">
                    <p className="text-sm text-gray-700 truncate" title={log.notes}>
                      {log.notes}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <PhotoGallery photos={log.photos} maxPhotos={3} size="sm" />
                  </td>
                  {!readOnly && onEdit && (
                    <td className="py-4 px-4 text-right">
                      <ActionMenu log={log} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationControls variant="desktop" />
        <ModalComponents />
      </div>
    );
  }

  // Mobile card view
  return (
    <div className="space-y-4 p-4">
      {pagedLogs.map((log) => (
        <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{formatDate(log.date)}</span>
            </div>
            {!readOnly && onEdit && <ActionMenu log={log} />}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('training_log.table.weight_label')}</p>
              <p className="text-sm font-semibold text-[#101D33]">{log.weight} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('training_log.table.bmi_label')}</p>
              <BMIBadge bmi={log.bmi} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('training_log.table.strength_label')}</p>
              <StrengthBadge strength={log.strength} />
            </div>
          </div>

          {log.notes && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">{t('training_log.table.note_label')}</p>
              <p className="text-sm text-gray-700">{log.notes}</p>
            </div>
          )}

          {log.photos && log.photos.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">{t('training_log.table.photos_label')}</p>
              <PhotoGallery photos={log.photos} maxPhotos={4} size="lg" />
            </div>
          )}
        </div>
      ))}

      <PaginationControls variant="mobile" />
      <ModalComponents />
    </div>
  );
};
