import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Eye, MapPin, Clock } from 'lucide-react';

interface ServicePackage {
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular: boolean;
}

interface PromotionalOffer {
  title: string;
  location: string;
  time: string;
  price: string;
  image: string;
}

interface GymServicesProps {
  servicePackages: ServicePackage[];
  promotionalOffers: PromotionalOffer[];
}

export const GymServices: React.FC<GymServicesProps> = ({ servicePackages, promotionalOffers }) => {
  return (
    <div className="space-y-8">
      {/* Service Packages */}
      <section>
        <h2 className="text-2xl font-bold text-gym-orange mb-6">GÓI DỊCH VỤ</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {servicePackages.map((pkg, index) => (
            <Card key={index} className={`relative ${pkg.isPopular ? 'ring-2 ring-gym-orange' : ''}`}>
              {pkg.isPopular && (
                <Badge className="absolute -top-3 left-4 bg-gym-orange text-white">Phổ biến nhất</Badge>
              )}
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gym-navy mb-2">{pkg.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-gym-orange">{pkg.price}</span>
                    <span className="text-gym-gray">{pkg.period}</span>
                  </div>
                  {pkg.isPopular && <Badge className="mt-2 bg-red-500 text-white">1 chi nhánh</Badge>}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Tự động thanh toán hàng tháng</span>
                  </div>

                  {pkg.features.map((feature, idx) => (
                    <p key={idx} className="text-sm text-gym-gray leading-relaxed">
                      {feature}
                    </p>
                  ))}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gym-gray" />
                      <span className="text-sm text-gym-gray">
                        Hủy thanh toán trong tương lai, ít nhất 4 ngày trước ngày kết thúc
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gym-gray" />
                      <span className="text-sm text-gym-gray">Không ràng buộc hợp đồng</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full bg-gym-orange hover:bg-gym-orange/90 text-white">Đăng ký</Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Eye className="w-4 h-4 mr-2" />
                    Xem lịch
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Promotional Offers */}
      <section>
        <h2 className="text-2xl font-bold text-gym-orange mb-6">ƯU ĐÃI HẤP DẪN</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {promotionalOffers.map((offer, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="flex-1 p-6">
                    <div className="flex gap-2 mb-4">
                      <Badge className="bg-gym-orange text-white">Ưu đãi mới</Badge>
                      <Badge variant="outline">+1 Yoga</Badge>
                    </div>
                    <h3 className="text-xl font-bold text-gym-navy mb-4">{offer.title}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gym-gray" />
                        <span className="text-sm text-gym-gray">Địa điểm: {offer.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gym-gray" />
                        <span className="text-sm text-gym-gray">Thời gian khuyến mãi: {offer.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gym-gray">💰 Giá dịch vụ: {offer.price}</span>
                      </div>
                    </div>
                    <Button className="bg-gym-navy hover:bg-gym-navy/90 text-white">Đăng ký</Button>
                  </div>
                  <div className="w-32">
                    <img
                      src={offer.image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200'}
                      alt="Promotional offer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
