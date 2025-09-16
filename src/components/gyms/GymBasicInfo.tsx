import React from 'react';
import { Eye, Clock, Wifi } from 'lucide-react';
import { GymLocationMap } from './GymLocationMap';

interface Branch {
  description?: string;
  openingHours: string;
  facilities: string[];
  branchName: string;
  location: string;
  phoneNumber?: string;
}

interface GymBasicInfoProps {
  branch: Branch;
}

export const GymBasicInfo: React.FC<GymBasicInfoProps> = ({ branch }) => {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gym-orange mb-6">THÔNG TIN CƠ BẢN</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gym-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-gym-orange" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tổng quan</h3>
              <p className="text-gray-600 leading-relaxed">
                {branch.description || 'Phòng tập chuyên nghiệp với trang thiết bị hiện đại'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gym-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-gym-orange" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Thời gian mở cửa</h3>
              <p className="text-gray-900 text-lg">{branch.openingHours}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gym-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wifi className="w-5 h-5 text-gym-orange" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tiện ích & Cơ sở vật chất</h3>
              <div className="space-y-2">
                {branch.facilities.map((facility, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gym-orange rounded-full"></div>
                    <span className="text-gray-700 font-medium">{facility}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <GymLocationMap branch={branch} />
        </div>
      </div>
    </section>
  );
};
