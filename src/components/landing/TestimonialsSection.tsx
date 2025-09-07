import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import type { Testimonial, LandingPageProps } from '@/types/pages';
import { useBreakpoint } from '@/hooks/useWindowSize';

const TestimonialsSection: React.FC<LandingPageProps> = ({ className = '' }) => {
  const [currentTestimonialSlide, setCurrentTestimonialSlide] = useState(0);
  const { isMobile } = useBreakpoint();

  const testimonials: Testimonial[] = [
    {
      name: 'Phương Linh',
      company: 'The New Gym',
      content:
        'Gym Manager đã thay đổi hoàn toàn cách chúng tôi quản lý phòng tập. Giao diện đẹp mắt, tính năng hoàn chỉnh và dễ sử dụng.',
      avatar: 'https://picsum.photos/400/400?random=11'
    },
    {
      name: 'Minh Tuấn',
      company: 'VYOGAWORLD',
      content:
        'Hệ thống quản lý tuyệt vời! Việc theo dõi thành viên và lịch tập trở nên đơn giản và hiệu quả hơn bao giờ hết.',
      avatar: 'https://picsum.photos/400/400?random=12'
    },
    {
      name: 'Thu Hương',
      company: 'Boxing Center',
      content:
        'Phần mềm này đã giúp chúng tôi tăng doanh thu 40% nhờ quản lý khách hàng chuyên nghiệp và báo cáo chi tiết.',
      avatar: 'https://picsum.photos/400/400?random=13'
    },
    {
      name: 'Đức Anh',
      company: 'Fitness Pro',
      content:
        'Tôi đã thử nhiều hệ thống khác nhưng không có gì bằng Gym Manager. Hỗ trợ khách hàng xuất sắc và cập nhật thường xuyên.',
      avatar: 'https://picsum.photos/400/400?random=14'
    },
    {
      name: 'Lan Anh',
      company: 'Yoga Studio',
      content:
        'Giao diện trực quan, báo cáo chi tiết và dễ dàng quản lý nhiều cơ sở. Gym Manager thực sự là giải pháp hoàn hảo!',
      avatar: 'https://picsum.photos/400/400?random=15'
    },
    {
      name: 'Hoàng Long',
      company: 'CrossFit Hub',
      content:
        'Chúng tôi đã tiết kiệm được hàng giờ mỗi tuần nhờ tính năng tự động hóa của Gym Manager. Đáng đồng tiền bát gạo!',
      avatar: 'https://picsum.photos/400/400?random=16'
    }
  ];

  // Auto-slide for testimonials with infinite loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialSlide((prev) => {
        // Reset về 0 khi đến slide cuối để tránh khoảng trắng
        if (prev >= testimonials.length - 3) {
          // -3 vì hiển thị 3 cards cùng lúc
          return 0;
        }
        return prev + 1;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section className={`py-24 px-4 bg-slate-50 relative overflow-hidden ${className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl"></div>
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      ></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Title */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-slate-900 mb-4 tracking-tight">
            Khách hàng nói gì về{' '}
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
              Gym Manager
            </span>
          </h2>
          <p className="text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
            Chúng tôi tự hào về khả năng và dịch vụ của mình — và rất vui khi khách hàng cũng có cùng cảm nhận.
          </p>
        </div>

        {/* Testimonials Slider */}
        <div className="relative">
          {/* Gradient fade effects on edges - Hidden on mobile */}
          <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-100 to-transparent z-20 pointer-events-none"></div>
          <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-100 to-transparent z-20 pointer-events-none"></div>

          {/* Slider container */}
          <div className="flex gap-4 sm:gap-6 overflow-hidden">
            <div
              className="flex gap-4 sm:gap-6 transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${currentTestimonialSlide * (isMobile ? 280 : 320)}px)`,
                width: `${testimonials.length * (isMobile ? 280 : 320)}px`
              }}
            >
              {testimonials.map((testimonial, i) => (
                <Card
                  key={i}
                  className="flex-shrink-0 w-72 sm:w-80 bg-white border border-slate-200/50 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group animate-fade-in"
                >
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-400/30 group-hover:ring-blue-400/60 transition-all duration-300"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                          {testimonial.name}
                        </h4>
                        <p className="text-slate-600 text-sm font-medium">{testimonial.company}</p>
                      </div>
                    </div>

                    <p className="text-slate-700 leading-relaxed text-sm mb-4 group-hover:text-slate-900 transition-colors duration-300">
                      "{testimonial.content}"
                    </p>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform duration-300"
                          style={{ transitionDelay: `${star * 50}ms` }}
                        />
                      ))}
                    </div>

                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Navigation arrows - Hidden on mobile */}
          <button
            onClick={() =>
              setCurrentTestimonialSlide((prev) => {
                if (prev <= 0) return testimonials.length - 3;
                return prev - 1;
              })
            }
            className="hidden sm:flex absolute left-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-400"
          >
            ←
          </button>
          <button
            onClick={() =>
              setCurrentTestimonialSlide((prev) => {
                if (prev >= testimonials.length - 3) return 0;
                return prev + 1;
              })
            }
            className="hidden sm:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-400"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
