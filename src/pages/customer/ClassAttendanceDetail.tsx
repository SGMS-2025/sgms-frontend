import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classApi } from '@/services/api/classApi';
import { Loader2, ArrowLeft, Calendar, CheckCircle2, XCircle, TrendingUp, Users, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface AttendanceRecord {
  _id: string;
  scheduleDate: string;
  sessionNumber: number;
  status: string;
  recordedAt: string;
}

interface AttendanceSummary {
  classInfo: {
    _id: string;
    name: string;
    description?: string;
    location?: string;
    servicePackage: {
      name: string;
    };
    trainers: Array<{
      name: string;
      avatar?: string;
      jobTitle?: string;
    }>;
    schedule: {
      daysOfWeek: string[];
      startTime: string;
      endTime: string;
    };
  };
  statistics: {
    totalSessions: number;
    attended: number;
    absent: number;
    percentage: number;
  };
  history: AttendanceRecord[];
}

const ClassAttendanceDetail: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) {
      fetchAttendance();
    }
  }, [classId]);

  const fetchAttendance = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const response = await classApi.getMyAttendance(classId, { sortOrder: 'desc' });
      setData(response as AttendanceSummary);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error(t('classAttendanceDetail.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const formatDaysOfWeek = (days: string[]) => {
    const dayMap: Record<string, string> = {
      MONDAY: 'Mon',
      TUESDAY: 'Tue',
      WEDNESDAY: 'Wed',
      THURSDAY: 'Thu',
      FRIDAY: 'Fri',
      SATURDAY: 'Sat',
      SUNDAY: 'Sun'
    };
    return days.map((day) => dayMap[day] || day).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">{t('classAttendanceDetail.noDataAvailable')}</p>
        </div>
      </div>
    );
  }

  const { classInfo, statistics, history } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/customer/my-attendance')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t('classAttendanceDetail.backToClasses')}</span>
      </button>

      {/* Class Info Header */}
      <div className="bg-blue-600 rounded-xl shadow-lg p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">{classInfo.name}</h1>
        <p className="text-lg opacity-90 mb-4">{classInfo.servicePackage.name}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span className="text-sm">{classInfo.trainers.map((t) => t.name).join(', ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="text-sm">{formatDaysOfWeek(classInfo.schedule.daysOfWeek)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm">
              {classInfo.schedule.startTime} - {classInfo.schedule.endTime}
            </span>
          </div>
        </div>

        {classInfo.location && (
          <div className="flex items-center gap-2 mt-4">
            <MapPin className="w-5 h-5" />
            <span className="text-sm">{classInfo.location}</span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{t('classAttendanceDetail.totalSessions')}</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{statistics.totalSessions}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">{t('classAttendanceDetail.attended')}</span>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{statistics.attended}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 bg-red-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">{t('classAttendanceDetail.absent')}</span>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{statistics.absent}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6 bg-purple-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">{t('classAttendanceDetail.attendanceRate')}</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-purple-600">{statistics.percentage}%</p>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${statistics.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t('classAttendanceDetail.attendanceHistory')}</h2>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('classAttendanceDetail.noRecordsYet')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="hidden md:table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('classAttendanceDetail.session')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('classAttendanceDetail.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('classAttendanceDetail.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('classAttendanceDetail.recordedAt')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((record, index) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {t('classAttendanceDetail.session')} {history.length - index}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(record.scheduleDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('classAttendanceDetail.present')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3.5 h-3.5" />
                          {t('classAttendanceDetail.absent')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(record.recordedAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {history.map((record, index) => (
                <div key={record._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {t('classAttendanceDetail.session')} {history.length - index}
                    </span>
                    {record.status === 'PRESENT' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('classAttendanceDetail.present')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3.5 h-3.5" />
                        {t('classAttendanceDetail.absent')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{format(new Date(record.scheduleDate), 'MMM dd, yyyy')}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('classAttendanceDetail.recorded')}: {format(new Date(record.recordedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassAttendanceDetail;
