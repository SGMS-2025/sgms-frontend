import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/BaseHeader';
import { Footer } from '@/components/layout/BaseFooter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorMessage } from '@/components/ui/error-message';
import { useBranchDetail } from '@/hooks/useBranches';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { GymHeroSection } from '@/components/gyms/GymHeroSection';
import { GymBasicInfo } from '@/components/gyms/GymBasicInfo';
import { GymGallery } from '@/components/gyms/GymGallery';
import { GymServices } from '@/components/gyms/GymServices';
import { GymTrainers } from '@/components/gyms/GymTrainers';
import { GymReviews } from '@/components/gyms/GymReviews';
import { MapPin, Users, Dumbbell, Star, AlertCircle } from 'lucide-react';

// Mock data for features not yet available from API
const mockServicePackages = [
  {
    name: 'CƠ BẢN',
    price: '399.000 VND',
    period: '/tháng',
    features: [
      'Tự động thanh toán hàng tháng',
      'Tập luyện tại toàn hệ thống The New Gym trên toàn quốc',
      'Miễn phí kiểm tra sức khỏe và sai lệch tư thế, và nhiều hơn nữa!'
    ],
    isPopular: false
  },
  {
    name: 'PREMIUM',
    price: '299.000 VND',
    period: '/tháng',
    features: [
      'Tự động thanh toán hàng tháng',
      'Gói thành viên premium với đầy đủ tiện ích',
      'Hướng dẫn cá nhân từ huấn luyện viên chuyên nghiệp'
    ],
    isPopular: true
  },
  {
    name: 'NÂNG CAO',
    price: '499.000 VND',
    period: '/tháng',
    features: [
      'Tự động thanh toán hàng tháng',
      'Truy cập không giới hạn tất cả thiết bị',
      '1-on-1 personal training sessions'
    ],
    isPopular: false
  }
];

const mockTrainers = [
  {
    id: 1,
    name: 'Nguyễn Văn Minh',
    title: 'Huấn luyện viên',
    experience: '+5 năm kinh nghiệm',
    specialties: 'Chuyên môn: Tăng cơ giảm mỡ, xây dựng thói quen ăn uống và tập luyện khoa học.',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300'
  },
  {
    id: 2,
    name: 'Trần Thị Lan',
    title: 'Huấn luyện viên',
    experience: '+3 năm kinh nghiệm',
    specialties: 'Chuyên môn: Yoga, Pilates, thư giãn cơ thể và tinh thần.',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1594736797933-d0f37b3dad85?w=300'
  },
  {
    id: 3,
    name: 'Lê Hoàng Nam',
    title: 'Huấn luyện viên',
    experience: '+4 năm kinh nghiệm',
    specialties: 'Chuyên môn: Functional Training, CrossFit, nâng cao sức bền.',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1566488907985-df25fa5ea9e6?w=300'
  },
  {
    id: 4,
    name: 'Phạm Thị Hoa',
    title: 'Huấn luyện viên',
    experience: '+6 năm kinh nghiệm',
    specialties: 'Chuyên môn: Cardio, giảm cân, tăng cường sức khỏe tim mạch.',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1544741256-7ad5ac882d5d?w=300'
  }
];

const mockPromotionalOffers = [
  {
    title: 'Đăng ký nhóm giảm 20%',
    location: 'Phòng tập VLOGAWORLD',
    time: '10:00 đến 15:00',
    price: '399.000 VND/tháng',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=300'
  },
  {
    title: 'Ưu đãi thành viên mới',
    location: 'Phòng tập VLOGAWORLD',
    time: '16:00 đến 20:00',
    price: '299.000 VND/tháng',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300'
  }
];

const GymDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  const { branch, loading, error, refetch } = useBranchDetail(id || '');

  // Scroll to top when component mounts
  useScrollToTop();

  const handleBackClick = () => {
    navigate(-1);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gym-orange mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin phòng tập...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Error state
  if (error || !branch) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Không tìm thấy phòng tập</h1>
            <p className="text-slate-600 mb-6">
              {error || 'Phòng tập bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.'}
            </p>
            <div className="space-y-3">
              <ErrorMessage message={error || 'Không thể tải thông tin phòng tập'} onRetry={refetch} />
              <Button variant="outline" onClick={handleBackClick} className="mt-4">
                ← Quay lại trang trước
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <GymHeroSection branch={branch} />

      {/* Main Content with Tabs */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-8">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Thông tin phòng tập
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Gói dịch vụ
            </TabsTrigger>
            <TabsTrigger value="trainers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Huấn luyện viên
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Đánh giá
            </TabsTrigger>
          </TabsList>

          {/* Gym Info Tab */}
          <TabsContent value="info" className="space-y-8">
            <GymBasicInfo branch={branch} />
            <GymGallery images={branch.images || []} />
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <GymServices servicePackages={mockServicePackages} promotionalOffers={mockPromotionalOffers} />
          </TabsContent>

          {/* Trainers Tab */}
          <TabsContent value="trainers">
            <GymTrainers trainers={mockTrainers} />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <GymReviews branch={branch} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default GymDetailPage;
