import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { useIsMobile } from '@/hooks/use-mobile';
import { TrendingUp, Calendar as CalendarIcon, Award, Target, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { TrainingProgressTabProps } from '@/types/components/FormFieldCustomer';

export const TrainingProgressTab: React.FC<TrainingProgressTabProps> = ({
  workoutStats,
  workoutSchedule,
  fitnessMetrics
}) => {
  const isMobile = useIsMobile();

  const getBodyMetricLabel = (key: string): string => {
    switch (key) {
      case 'weight':
        return 'Cân nặng';
      case 'bodyFat':
        return 'Body Fat';
      case 'bmi':
        return 'BMI';
      default:
        return key;
    }
  };

  const getStrengthMetricLabel = (key: string): string => {
    switch (key) {
      case 'squat':
        return 'Squat';
      case 'deadlift':
        return 'Deadlift';
      case 'benchPress':
        return 'Bench press';
      default:
        return key;
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-8" style={{ backgroundColor: '#F1F3F4' }}>
      {/* Enhanced Stats Cards */}
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-6">
          <CardTitle className="text-orange-600 text-xl md:text-2xl font-bold flex items-center">
            <TrendingUp className="w-6 h-6 mr-3" />
            CHUYÊN CẦN
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {workoutStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-2 ${stat.color} shadow-lg transform hover:scale-105 transition-all duration-200`}
                >
                  <div className="text-center">
                    <IconComponent className="w-8 h-8 mx-auto mb-3" />
                    <div className="text-sm font-semibold mb-2">{stat.label}</div>
                    <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Workout Schedule */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-orange-600 text-xl md:text-2xl font-bold flex items-center">
            <CalendarIcon className="w-6 h-6 mr-3" />
            LỊCH SỬ TẬP LUYỆN
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            // Enhanced Mobile view
            <div className="space-y-4">
              {workoutSchedule.map((session, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{session.date}</p>
                      <p className="text-sm text-gray-600">{session.time}</p>
                    </div>
                    <StatusBadge status={session.status} />
                  </div>
                  {session.workout && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-medium text-gray-700">
                        <span className="text-orange-600">Nội dung: </span>
                        {session.workout}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Enhanced Desktop view
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-2 font-semibold text-gray-700">Ngày</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-700">Check-in</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-700">Trạng thái</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-700">Nội dung buổi tập</th>
                    <th className="text-left py-4 px-2 font-semibold text-gray-700">Tiến độ</th>
                  </tr>
                </thead>
                <tbody>
                  {workoutSchedule.map((session, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2 font-medium">{session.date}</td>
                      <td className="py-4 px-2">{session.time}</td>
                      <td className="py-4 px-2">
                        {session.status === 'completed' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Có mặt</span>
                          </div>
                        )}
                        {session.status === 'warning' && (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-medium">Đi muộn</span>
                          </div>
                        )}
                        {session.status === 'missed' && (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-5 h-5" />
                            <span className="font-medium">Vắng</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2">{session.workout}</td>
                      <td className="py-4 px-2">
                        {session.status !== 'missed' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Hoàn thành</Badge>
                        )}
                        {session.status === 'missed' && <Badge variant="destructive">Không hoàn thành</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Fitness Metrics */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-orange-600 text-xl md:text-2xl font-bold flex items-center">
            <Award className="w-6 h-6 mr-3" />
            KẾT QUẢ HUẤN LUYỆN CÁ NHÂN
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Overall progress */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-lg text-gray-700">Đánh giá kĩ thuật:</span>
              <span className="text-orange-600 font-bold text-2xl">70%</span>
            </div>
            <div className="w-full bg-white rounded-full h-4 shadow-inner">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-4 rounded-full shadow-sm"
                style={{ width: '70%' }}
              ></div>
            </div>
            <p className="text-sm text-orange-700 mt-2 font-medium">Tiến bộ tốt! Tiếp tục duy trì.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Body metrics */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-lg mb-6 text-gray-800 flex items-center">
                <Target className="w-5 h-5 mr-2 text-orange-500" />
                Chỉ số cơ thể:
              </h4>
              <div className="space-y-4">
                {Object.entries(fitnessMetrics)
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <span className="font-medium capitalize">{getBodyMetricLabel(key)}:</span>
                      <div className="flex gap-3">
                        <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                          {value.previous}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                          {value.current}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Strength metrics */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-lg mb-6 text-gray-800 flex items-center">
                <Award className="w-5 h-5 mr-2 text-orange-500" />
                Thành tích nâng tạ:
              </h4>
              <div className="space-y-4">
                {Object.entries(fitnessMetrics)
                  .slice(3)
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <span className="font-medium capitalize">• {getStrengthMetricLabel(key)}:</span>
                      <div className="flex gap-3">
                        <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                          {value.previous}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                          {value.current}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
