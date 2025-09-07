import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, Star, ArrowRight, ChevronRight } from 'lucide-react';
import type { GymLocation, LandingPageProps } from '@/types/pages/landing';
import backgroundImage from '@/assets/images/background1.png';

const GymLocationsSection: React.FC<LandingPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  const gymLocations: GymLocation[] = [
    {
      name: 'The New Gym',
      category: 'Gym & Fitness',
      description: 'Phòng tập chuyên nghiệp với dàn máy hiện đại và huấn luyện viên giàu kinh nghiệm',
      image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=400&h=300&fit=crop&crop=center',
      features: [
        'Hệ thống máy cardio hiện đại',
        'Không gian rộng rãi 500m²',
        'HLV chuyên nghiệp 24/7',
        'Phòng thay đồ tiện nghi'
      ],
      address: '107C Lê Hồng Phong, Phường Chợ Quán, TP.HCM',
      hours: '5:00 - 21:00 hàng ngày',
      rating: 4.9,
      color: 'orange',
      tag: 'Gym',
      logo: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=100&h=100&fit=crop&crop=center',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      name: 'VYOGAWORLD',
      category: 'Yoga & Wellness',
      description: 'Không gian yoga rộng rãi và yên tĩnh, phù hợp cho mọi cấp độ tập luyện',
      image: backgroundImage,
      features: ['Không gian yoga rộng rãi', 'Thiết bị yoga chuyên nghiệp', 'Lớp học đa dạng', 'Môi trường thư giãn'],
      address: 'Tầng M, Cao ốc Saigon, KDC Trung Sơn, H. Bình Chánh',
      hours: '5:00 - 21:00 hàng ngày',
      rating: 4.8,
      color: 'green',
      tag: 'Yoga',
      logo: 'https://picsum.photos/400/400?random=1',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      name: 'Boxing Center',
      category: 'Combat Sports',
      description: 'Trung tâm boxing và kickboxing chuyên nghiệp với sàn tập chất lượng cao',
      image: 'https://picsum.photos/400/400?random=1',
      features: [
        'Sàn boxing chuyên nghiệp',
        'Thiết bị kickboxing đầy đủ',
        'HLV võ thuật chuyên nghiệp',
        'Lớp học nhóm và cá nhân'
      ],
      address: '45 Nguyễn Văn Cừ, Quận 5, TP.HCM',
      hours: '6:00 - 22:00 hàng ngày',
      rating: 4.7,
      color: 'purple',
      tag: 'Boxing',
      logo: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=100&h=100&fit=crop&crop=center',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'orange':
        return {
          textColor: 'text-orange-500',
          bgColor: 'bg-orange-100',
          dotColor: 'bg-orange-500'
        };
      case 'green':
        return {
          textColor: 'text-green-500',
          bgColor: 'bg-green-100',
          dotColor: 'bg-green-500'
        };
      case 'purple':
        return {
          textColor: 'text-purple-500',
          bgColor: 'bg-purple-100',
          dotColor: 'bg-purple-500'
        };
      default:
        return {
          textColor: 'text-orange-500',
          bgColor: 'bg-orange-100',
          dotColor: 'bg-orange-500'
        };
    }
  };

  return (
    <section id="gyms" className={`py-24 px-4 bg-slate-50 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-slate-900 mb-4 tracking-tight">
            Phòng tập{' '}
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
              hàng đầu
            </span>
          </h2>
          <p className="text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
            Khám phá các phòng tập chuyên nghiệp với cơ sở vật chất hiện đại và đội ngũ huấn luyện viên giàu kinh nghiệm
          </p>
        </div>

        {/* Gym Cards Grid - Relume Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {gymLocations.map((gym, i) => {
            const colorClasses = getColorClasses(gym.color);

            return (
              <Card
                key={i}
                className="group bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden animate-fade-in hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Image Section - Top Half */}
                  <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-2xl">
                    {/* Main Cover Image */}
                    <img src={gym.image} alt={gym.name} className="w-full h-full object-cover" />

                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm z-40">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-slate-700">{gym.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Section - Bottom Half */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col relative z-10">
                    {/* Logo and Gym Name - Side by side */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Logo - Small square before title */}
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md border-2 border-orange-200">
                        <img src={gym.logo} alt={`${gym.name} logo`} className="w-10 h-10 object-cover rounded" />
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors duration-300">
                        {gym.name}
                      </h3>
                    </div>

                    {/* Description - Single sentence */}
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{gym.description}</p>

                    {/* Features List - With Checkmark Icons */}
                    <div className="space-y-2 mb-6">
                      {gym.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses.bgColor}`}
                          >
                            <div className={`w-2 h-2 rounded-full ${colorClasses.dotColor}`}></div>
                          </div>
                          <span className="text-slate-600 font-semibold">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Location & Hours */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colorClasses.textColor}`} />
                        <span className="text-slate-600">{gym.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className={`w-4 h-4 flex-shrink-0 ${colorClasses.textColor}`} />
                        <span className="text-slate-600">{gym.hours}</span>
                      </div>
                    </div>

                    {/* CTA Button - Outline Style like Relume */}
                    <Button
                      variant="outline"
                      className="w-full font-medium py-3 rounded-lg border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 group-hover:scale-105 transition-all duration-300 shadow-sm group-hover:shadow-lg"
                      onClick={() => navigate('/login')}
                    >
                      <span className="flex items-center justify-center gap-2">
                        Xem chi tiết
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View All Button - Relume style */}
        <div className="text-center mt-12 lg:mt-16">
          <div className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors duration-300 cursor-pointer group">
            <span className="text-lg font-medium">Xem tất cả phòng tập</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
          <div className="mt-4 w-16 h-0.5 bg-gradient-to-r from-orange-500 to-purple-500 mx-auto group-hover:w-24 transition-all duration-300"></div>
        </div>
      </div>
    </section>
  );
};

export default GymLocationsSection;
