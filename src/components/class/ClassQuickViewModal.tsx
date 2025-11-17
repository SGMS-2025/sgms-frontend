/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Users, Clock, MapPin, Package, AlertCircle, Edit2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClassDetail } from '@/hooks/useClassDetail';
import { EnrolledStudentsList } from './EnrolledStudentsList';
import { useClassEnrollment } from '@/hooks/useClassEnrollment';
import type { ClassQuickViewModalProps } from '@/types/class/ClassQuickViewModal';
import { toast } from 'sonner';

// Helper function to convert MongoDB Decimal to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (value?.$numberDecimal) return parseFloat(value.$numberDecimal);
  return 0;
};

export const ClassQuickViewModal: React.FC<ClassQuickViewModalProps> = ({
  classId,
  isOpen,
  onClose,
  onRefresh,
  onEditClick,
  onEnrollClick
}) => {
  const { t } = useTranslation();
  const { classData, loading, error, refetch } = useClassDetail(classId);
  const [shouldRefreshParent, setShouldRefreshParent] = useState(false);

  // Remove student handler
  const { removeStudent } = useClassEnrollment({
    onSuccess: () => {
      toast.success(t('class.quickview.remove_success'));
      refetch();
      setShouldRefreshParent(true);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('class.quickview.remove_error'));
    }
  });

  // Auto-refetch when modal opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, classId, refetch]);

  // Notify parent to refresh list if changes were made
  useEffect(() => {
    if (shouldRefreshParent && onRefresh) {
      onRefresh();
      setShouldRefreshParent(false);
    }
  }, [shouldRefreshParent, onRefresh]);

  const handleClose = () => {
    onClose();
  };

  const handleEdit = () => {
    onEditClick?.(classId);
  };

  const handleEnroll = () => {
    onEnrollClick?.(classId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0" showCloseButton={false}>
        {/* Loading State */}
        {loading && !classData && (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {/* Error State */}
        {error && !classData && (
          <div className="p-6 text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={refetch}>
              {t('class.quickview.button_retry')}
            </Button>
          </div>
        )}

        {/* Content */}
        {classData && (
          <>
            {/* Header */}
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold mb-2">{classData.name}</DialogTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant={classData.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                      {classData.status}
                    </Badge>
                    {typeof classData.servicePackageId === 'object' && classData.servicePackageId.name && (
                      <Badge variant="outline" className="text-xs">
                        <Package className="w-3 h-3 mr-1" />
                        {classData.servicePackageId.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onEnrollClick && (
                    <Button variant="outline" size="sm" onClick={handleEnroll}>
                      <Users className="w-4 h-4 mr-2" />
                      {t('class.quickview.button_enroll')}
                    </Button>
                  )}
                  {onEditClick && (
                    <Button size="sm" onClick={handleEdit}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      {t('class.quickview.button_edit')}
                    </Button>
                  )}
                  <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </DialogHeader>

            {/* Tabs Content */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 pt-4 border-b">
                <TabsList>
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {t('class.quickview.tab_overview')}
                  </TabsTrigger>
                  <TabsTrigger value="students" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {t('class.quickview.tab_students', { count: toNumber(classData.activeEnrollment) })}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {/* Capacity Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-gray-700">{t('class.quickview.capacity_label')}</label>
                    <span className="text-lg font-bold text-gray-900">
                      {toNumber(classData.activeEnrollment)}/{toNumber(classData.capacity)}
                    </span>
                  </div>
                  <Progress
                    value={(toNumber(classData.activeEnrollment) / toNumber(classData.capacity)) * 100}
                    className="h-3 mb-2"
                  />
                  <p className="text-xs text-gray-600">
                    {t('class.quickview.slots_available', {
                      slots: toNumber(classData.capacity) - toNumber(classData.activeEnrollment)
                    })}
                  </p>
                </div>

                {/* Class Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Schedule */}
                  {classData.schedulePattern && (
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <label className="text-sm font-semibold text-gray-700">
                          {t('class.quickview.schedule_label')}
                        </label>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{t('class.quickview.days_label')}</p>
                          <p className="text-sm font-medium">{classData.schedulePattern.daysOfWeek.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{t('class.quickview.time_label')}</p>
                          <p className="text-sm font-medium">
                            {classData.schedulePattern.startTime} - {classData.schedulePattern.endTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Location & Package */}
                  <div className="bg-white border rounded-lg p-4 space-y-3">
                    {classData.location && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-5 h-5 text-red-600" />
                          <label className="text-sm font-semibold text-gray-700">
                            {t('class.quickview.location_label')}
                          </label>
                        </div>
                        <p className="text-sm font-medium">{classData.location}</p>
                      </div>
                    )}
                    {typeof classData.servicePackageId === 'object' && classData.servicePackageId.name && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-5 h-5 text-orange-600" />
                          <label className="text-sm font-semibold text-gray-700">
                            {t('class.quickview.package_label')}
                          </label>
                        </div>
                        <p className="text-sm font-medium">{classData.servicePackageId.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trainers */}
                {classData.trainerIds && classData.trainerIds.length > 0 && (
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-green-600" />
                      <label className="text-sm font-semibold text-gray-700">
                        {t('class.quickview.trainers_label')}
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {classData.trainerIds.map((trainer: any, idx: number) => {
                        const trainerName =
                          typeof trainer === 'object' && trainer.userId ? trainer.userId.fullName : 'Unknown';
                        return (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {trainerName}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                {classData.description && (
                  <div className="bg-white border rounded-lg p-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      {t('class.quickview.description_label')}
                    </label>
                    <p className="text-sm text-gray-600 leading-relaxed">{classData.description}</p>
                  </div>
                )}
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="flex-1 overflow-y-auto px-6 py-4">
                <EnrolledStudentsList
                  classId={classId}
                  showHeader={false}
                  compact={true}
                  onRemoveStudent={async (enrollmentId) => {
                    if (confirm(t('class.quickview.confirm_remove_student'))) {
                      await removeStudent(classId, enrollmentId, 'Removed by admin');
                    }
                  }}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
