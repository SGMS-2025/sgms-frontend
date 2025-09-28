import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkShiftOperations } from '@/hooks/useWorkShift';
import WorkShiftForm from '@/components/workshift/WorkShiftForm';
import type { CreateWorkShiftRequest } from '@/types/api/WorkShift';

const AddWorkShiftPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createWorkShift, loading } = useWorkShiftOperations();

  const handleSubmit = async (data: CreateWorkShiftRequest) => {
    const result = await createWorkShift(data);
    if (result) {
      navigate('/manage/workshifts/calendar');
    }
  };

  const handleCancel = () => {
    navigate('/manage/workshifts');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleCancel} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('workshift.add_shift')}</h1>
          <p className="text-gray-600 mt-1">{t('workshift.add_shift_description')}</p>
        </div>
      </div>

      {/* Steps Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{t('workshift.select_staff')}</span>
              </div>
            </div>

            <div className="w-8 h-px bg-gray-300"></div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{t('workshift.select_date')}</span>
              </div>
            </div>

            <div className="w-8 h-px bg-gray-300"></div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{t('workshift.select_time')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <WorkShiftForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('workshift.help_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600 space-y-2">
            <p>{t('workshift.help_description_1')}</p>
            <p>{t('workshift.help_description_2')}</p>
            <p>{t('workshift.help_description_3')}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">{t('workshift.tips_title')}</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {t('workshift.tip_1')}</li>
              <li>• {t('workshift.tip_2')}</li>
              <li>• {t('workshift.tip_3')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddWorkShiftPage;
