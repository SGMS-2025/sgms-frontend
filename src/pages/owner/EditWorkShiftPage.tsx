import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkShift, useWorkShiftOperations } from '@/hooks/useWorkShift';
import WorkShiftForm from '@/components/workshift/WorkShiftForm';
import type { CreateWorkShiftRequest } from '@/types/api/WorkShift';

const EditWorkShiftPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { workShift, loading: loadingWorkShift, error } = useWorkShift(id || '');
  const { updateWorkShift, loading } = useWorkShiftOperations();

  const handleSubmit = async (data: CreateWorkShiftRequest) => {
    if (!id) return;

    const result = await updateWorkShift(id, {
      startTime: data.startTime,
      endTime: data.endTime
    });

    if (result) {
      navigate('/manage/workshifts/calendar');
    }
  };

  const handleCancel = () => {
    navigate('/manage/workshifts');
  };

  if (loadingWorkShift) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !workShift) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('workshift.error_loading')}</h3>
          <p className="text-gray-500 mb-4">{error || t('workshift.not_found')}</p>
          <Button onClick={handleCancel}>{t('common.back')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleCancel} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('workshift.edit_shift')}</h1>
          <p className="text-gray-600 mt-1">{t('workshift.edit_shift_description')}</p>
        </div>
      </div>

      {/* Current Work Shift Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('workshift.current_shift_info')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="font-medium">{t('workshift.staff')}</span>
              </div>
              <p className="text-gray-900 font-medium">
                {workShift.staffId.firstName} {workShift.staffId.lastName}
              </p>
              <p className="text-sm text-gray-500">{workShift.staffId.email}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">{t('workshift.branch')}</span>
              </div>
              <p className="text-gray-900 font-medium">{workShift.branchId.name}</p>
              <p className="text-sm text-gray-500">{workShift.branchId.location}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{t('workshift.current_time')}</span>
              </div>
              <p className="text-gray-900 font-medium">
                {workShift.startTimeLocal} - {workShift.endTimeLocal}
              </p>
              <p className="text-sm text-gray-500">{workShift.startTimeFmt.split(' ')[1]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{t('workshift.staff_selected')}</span>
              </div>
            </div>

            <div className="w-8 h-px bg-gray-300"></div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{t('workshift.date_selected')}</span>
              </div>
            </div>

            <div className="w-8 h-px bg-gray-300"></div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{t('workshift.edit_time')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <WorkShiftForm onSubmit={handleSubmit} onCancel={handleCancel} initialData={workShift} loading={loading} />

      {/* Warning Section */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            {t('workshift.warning_title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>{t('workshift.warning_description_1')}</p>
            <p>{t('workshift.warning_description_2')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditWorkShiftPage;
