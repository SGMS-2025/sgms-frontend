import type { Offer, Trainer, Feature } from '@/types/pages';

// Animation constants
export const ANIMATION_DURATIONS = {
  MARQUEE: 60000,
  TRAINER_SLIDE: 4000,
  TESTIMONIAL_SLIDE: 6000,
  CARD_TRANSITION: 600
} as const;

export const SLIDE_COUNTS = {
  TRAINERS: 8,
  TESTIMONIALS: 6
} as const;

// Offers data
export const OFFERS: Offer[] = [
  {
    title: 'Yoga Premium',
    location: 'VYOGAWORLD',
    time: 'Đến 31/12/2024',
    price: '399.000 VNĐ',
    tag: 'Yoga',
    image: 'https://picsum.photos/400/400?random=1'
  },
  {
    title: 'Gym + Personal Training',
    location: 'The New Gym',
    time: 'Đến 15/01/2025',
    price: '599.000 VNĐ',
    tag: 'Gym',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop&crop=center'
  },
  {
    title: 'Boxing & Kickboxing',
    location: 'The New Gym',
    time: 'Đến 28/02/2025',
    price: '699.000 VNĐ',
    tag: 'Boxing',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop&crop=center'
  }
];

// Trainers data
export const TRAINERS: Trainer[] = [
  {
    name: 'Phương Anh',
    specialty: 'Huấn luyện viên Gym cao cấp',
    gym: 'Phòng tập The New Gym',
    experience: '8 năm kinh nghiệm',
    category: 'gym',
    rating: 4.9,
    price: '500k/buổi',
    image: 'https://picsum.photos/400/400?random=1'
  },
  {
    name: 'Minh Tuấn',
    specialty: 'Huấn luyện viên Yoga chuyên nghiệp',
    gym: 'Phòng tập VYOGAWORLD',
    experience: '6 năm kinh nghiệm',
    category: 'yoga',
    rating: 4.8,
    price: '400k/buổi',
    image: 'https://picsum.photos/400/400?random=2'
  },
  {
    name: 'Thu Hà',
    specialty: 'Huấn luyện viên Boxing & Kickboxing',
    gym: 'Phòng tập The New Gym',
    experience: '7 năm kinh nghiệm',
    category: 'boxing',
    rating: 4.9,
    price: '550k/buổi',
    image: 'https://picsum.photos/400/400?random=3'
  },
  {
    name: 'Đức Anh',
    specialty: 'Huấn luyện viên cá nhân',
    gym: 'Phòng tập VYOGAWORLD',
    experience: '5 năm kinh nghiệm',
    category: 'gym',
    rating: 4.7,
    price: '450k/buổi',
    image: 'https://picsum.photos/400/400?random=4'
  },
  {
    name: 'Lan Anh',
    specialty: 'Huấn luyện viên Yoga & Pilates',
    gym: 'Phòng tập VYOGAWORLD',
    experience: '4 năm kinh nghiệm',
    category: 'yoga',
    rating: 4.8,
    price: '380k/buổi',
    image: 'https://picsum.photos/400/400?random=5'
  },
  {
    name: 'Hoàng Nam',
    specialty: 'Huấn luyện viên Gym & Powerlifting',
    gym: 'Phòng tập The New Gym',
    experience: '9 năm kinh nghiệm',
    category: 'gym',
    rating: 5.0,
    price: '600k/buổi',
    image: 'https://picsum.photos/400/400?random=6'
  },
  {
    name: 'Mai Linh',
    specialty: 'Huấn luyện viên Boxing nữ',
    gym: 'Phòng tập The New Gym',
    experience: '3 năm kinh nghiệm',
    category: 'boxing',
    rating: 4.6,
    price: '480k/buổi',
    image: 'https://picsum.photos/400/400?random=7'
  },
  {
    name: 'Quang Minh',
    specialty: 'Huấn luyện viên Yoga & Meditation',
    gym: 'Phòng tập VYOGAWORLD',
    experience: '6 năm kinh nghiệm',
    category: 'yoga',
    rating: 4.9,
    price: '420k/buổi',
    image: 'https://picsum.photos/400/400?random=8'
  }
];

// Features data
export const FEATURES: Feature[] = [
  {
    icon: '📊',
    title: 'Báo cáo chi tiết',
    description: 'Theo dõi doanh thu, thành viên và hiệu suất kinh doanh theo thời gian thực'
  },
  {
    icon: '⚡',
    title: 'Tự động hóa',
    description: 'Tự động gia hạn, nhắc nhở và quản lý lịch tập giúp tiết kiệm thời gian'
  },
  {
    icon: '📱',
    title: 'App di động',
    description: 'Ứng dụng cho thành viên đặt lịch, thanh toán và theo dõi tiến độ tập luyện'
  },
  {
    icon: '🔒',
    title: 'Bảo mật cao',
    description: 'Mã hóa dữ liệu end-to-end, backup tự động và tuân thủ tiêu chuẩn quốc tế'
  },
  {
    icon: '💰',
    title: 'Tăng doanh thu',
    description: 'Các công cụ marketing, upsell và retention giúp tăng 40% doanh thu'
  },
  {
    icon: '👥',
    title: 'Quản lý thành viên',
    description: 'CRM hoàn chỉnh với lịch sử tập luyện, gói dịch vụ và thanh toán'
  },
  {
    icon: '⏰',
    title: 'Tiết kiệm thời gian',
    description: 'Giảm 70% thời gian quản lý hành chính, tập trung vào phát triển kinh doanh'
  },
  {
    icon: '🎯',
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ hỗ trợ chuyên nghiệp, training miễn phí và cập nhật thường xuyên'
  }
];

// Offer descriptions helper
export const getOfferDescription = (tag: string): string => {
  const descriptions = {
    Yoga: 'Tập luyện yoga chuyên nghiệp với huấn luyện viên giàu kinh nghiệm trong không gian yên tĩnh và thư giãn.',
    Gym: 'Chương trình tập luyện toàn diện kết hợp gym và personal training để đạt mục tiêu fitness của bạn.',
    Boxing: 'Rèn luyện sức mạnh và kỹ thuật với các bài tập boxing và kickboxing chuyên nghiệp.'
  } as const;

  return descriptions[tag as keyof typeof descriptions] || '';
};

// Color schemes for trainer cards
export const TRAINER_COLOR_SCHEMES = [
  {
    front: 'bg-sky-50',
    back: 'from-sky-300 to-sky-400'
  },
  {
    front: 'bg-emerald-50',
    back: 'from-emerald-300 to-emerald-400'
  },
  {
    front: 'bg-rose-50',
    back: 'from-rose-300 to-rose-400'
  },
  {
    front: 'bg-violet-50',
    back: 'from-violet-300 to-violet-400'
  },
  {
    front: 'bg-amber-50',
    back: 'from-amber-300 to-amber-400'
  }
] as const;

export const getTrainerColorScheme = (index: number) => {
  return TRAINER_COLOR_SCHEMES[index % TRAINER_COLOR_SCHEMES.length];
};
