import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classApi } from '@/services/api/classApi';
import { Loader2, Calendar, MapPin, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface AttendanceStats {
  totalSessions: number;
  attended: number;
  absent: number;
  percentage: number;
}

interface ClassData {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  servicePackage: {
    name: string;
  };
  branch: {
    name: string;
    location?: string;
  };
  trainers: Array<{
    _id: string;
    name: string;
    avatar?: string;
    jobTitle?: string;
  }>;
  schedule: {
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
  };
  enrollmentStatus: string;
  enrolledDate: string;
  attendanceStats: AttendanceStats;
}

const CustomerClasses: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classApi.getMyClasses();
      setClasses(response.classes as ClassData[]);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error(t('customerClasses.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classId: string) => {
    navigate(`/customer/my-attendance/${classId}`);
  };

  const formatDaysOfWeek = (days: string[]) => {
    return days.map((day) => t(`customerClasses.daysOfWeek.${day}`) || day).join(', ');
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('customerClasses.title')}</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('customerClasses.noClassesYet')}</h3>
          <p className="text-gray-600">{t('customerClasses.noClassesDescription')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('customerClasses.title')}</h1>
        <p className="text-gray-600 mt-2">{t('customerClasses.description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classData) => (
          <div
            key={classData._id}
            onClick={() => handleClassClick(classData._id)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
          >
            {/* Header with solid color */}
            <div className="bg-blue-600 p-6 text-white">
              <h3 className="text-xl font-bold mb-2 line-clamp-1">{classData.name}</h3>
              <p className="text-sm opacity-90 line-clamp-1">{classData.servicePackage.name}</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Trainers */}
              <div className="flex items-start gap-2">
                <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{t('customerClasses.trainers')}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {classData.trainers.map((t) => t.name).join(', ')}
                  </p>
                </div>
              </div>

              {/* Schedule */}
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{t('customerClasses.schedule')}</p>
                  <p className="text-sm text-gray-600">{formatDaysOfWeek(classData.schedule.daysOfWeek)}</p>
                  <p className="text-sm text-gray-600">
                    {classData.schedule.startTime} - {classData.schedule.endTime}
                  </p>
                </div>
              </div>

              {/* Location */}
              {classData.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{t('customerClasses.location')}</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{classData.location}</p>
                  </div>
                </div>
              )}

              {/* Attendance Stats */}
              <div className={`rounded-lg border-2 p-4 ${getAttendanceBgColor(classData.attendanceStats.percentage)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{t('customerClasses.attendance')}</span>
                  <TrendingUp className={`w-5 h-5 ${getAttendanceColor(classData.attendanceStats.percentage)}`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getAttendanceColor(classData.attendanceStats.percentage)}`}>
                    {classData.attendanceStats.percentage}%
                  </span>
                  <span className="text-sm text-gray-600">
                    ({classData.attendanceStats.attended}/{classData.attendanceStats.totalSessions})
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      classData.attendanceStats.percentage >= 80
                        ? 'bg-green-500'
                        : classData.attendanceStats.percentage >= 60
                          ? 'bg-blue-500'
                          : classData.attendanceStats.percentage >= 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                    }`}
                    style={{ width: `${classData.attendanceStats.percentage}%` }}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    classData.enrollmentStatus === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {t(`customerClasses.enrollmentStatus.${classData.enrollmentStatus}`)}
                </span>
                <span className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
                  {t('customerClasses.viewDetails')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerClasses;
