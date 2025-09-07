import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { InfoCard } from './InfoCard';
import { Calendar as CalendarIcon, User, MapPin, CheckCircle } from 'lucide-react';

interface ServicePackageTabProps {
  servicePackage: {
    name: string;
    schedule: string;
    description: string;
    startDate: string;
    endDate: string;
    sessions: string;
    time: string;
    trainer: string;
    gym: string;
    paymentStatus: string;
  };
}

export const ServicePackageTab: React.FC<ServicePackageTabProps> = ({ servicePackage }) => {
  return (
    <Card className="border-0 shadow-none rounded-t-none rounded-b-2xl" style={{ backgroundColor: '#F1F3F4' }}>
      <CardHeader className="p-6 md:p-8 pb-6">
        <CardTitle className="text-orange-600 text-xl md:text-2xl font-bold flex items-center">
          <CalendarIcon className="w-6 h-6 mr-3" />
          GÓI DỊCH VỤ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6 md:p-8 pt-0">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-orange-800 mb-2 text-lg">{servicePackage.name}</h3>
              <p className="text-orange-700">{servicePackage.description}</p>
            </div>
            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
              Đang tập luyện
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-orange-700 font-medium">Lịch sử gói:</span>
              <span className="text-orange-800 font-semibold">{servicePackage.schedule}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Ngày bắt đầu</Label>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{servicePackage.startDate}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Ngày kết thúc</Label>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{servicePackage.endDate}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Lịch tập</Label>
            <span className="font-medium text-sm">{servicePackage.time}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-700">Tiến độ tập luyện:</span>
              <span className="font-bold text-lg">{servicePackage.sessions}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full shadow-sm"
                style={{ width: '67%' }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">67% hoàn thành</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard icon={User} title="Huấn luyện viên phụ trách:">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <span className="font-medium text-lg">{servicePackage.trainer}</span>
              </div>
            </InfoCard>
            <InfoCard icon={MapPin} title="Phòng tập:">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <span className="font-medium text-lg">{servicePackage.gym}</span>
              </div>
            </InfoCard>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <Label className="font-semibold text-gray-600 mb-3 block">Trạng thái thanh toán:</Label>
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-base">
              <CheckCircle className="w-4 h-4 mr-2" />
              {servicePackage.paymentStatus}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
