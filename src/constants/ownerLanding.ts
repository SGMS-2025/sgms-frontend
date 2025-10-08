import type {
  OwnerBenefit,
  OwnerCTA,
  OwnerFeature,
  OwnerIntegration,
  OwnerMetric,
  OwnerPricingTier,
  OwnerTestimonial,
  OwnerTimelineItem,
  OwnerWorkflowStep,
  OwnerFAQItem
} from '@/types/pages/ownerLanding';

export const ownerMetrics: OwnerMetric[] = [
  {
    label: 'Giờ vận hành tiết kiệm mỗi tuần',
    value: '8h/tuần',
    description: 'Tự động hóa điểm danh, bán gói và báo cáo doanh thu'
  },
  {
    label: 'Tỷ lệ gia hạn thành viên',
    value: '92%',
    description: 'Nhờ quy trình chăm sóc và nhắc nhở thông minh'
  },
  {
    label: 'Tăng trưởng doanh thu trung bình',
    value: '32%',
    description: 'Phân tích KPI theo thời gian thực cho từng chi nhánh'
  }
];

export const ownerBenefits: OwnerBenefit[] = [
  {
    title: 'Tiết kiệm 8 giờ vận hành mỗi tuần',
    description:
      'Tự động hóa điểm danh, bán gói và báo cáo doanh thu. Không còn nhập liệu thủ công giữa nhiều file Excel.',
    painPoint: 'Tăng 28% hiệu suất làm việc của đội ngũ'
  },
  {
    title: 'Tăng 32% doanh thu trung bình',
    description:
      'Theo dõi KPI theo thời gian thực, phát hiện thất thoát ngay khi phát sinh và tối ưu chiến lược bán hàng.',
    painPoint: 'Ra quyết định nhanh chóng dựa trên dữ liệu đáng tin cậy'
  },
  {
    title: 'Tăng 92% tỷ lệ gia hạn hội viên',
    description:
      'Tự động nhắc lịch hết hạn, upsell gói PT và gửi ưu đãi cá nhân hóa. Giảm phụ thuộc vào nhân viên lễ tân.',
    painPoint: 'Chăm sóc khách hàng 24/7 với AI thông minh'
  }
];

export const ownerFeatures: OwnerFeature[] = [
  {
    title: 'Tự động nhắc gia hạn - tăng 92% hội viên quay lại',
    description: 'AI phân tích hành vi và gửi ưu đãi cá nhân hóa đúng thời điểm.',
    icon: 'LayoutDashboard',
    highlights: ['Theo dõi booking, chấm công và doanh thu tức thời', 'Tùy chỉnh KPI phù hợp mô hình vận hành']
  },
  {
    title: 'Bán hàng tự động - tăng 28% doanh thu PT',
    description: 'Từ đăng ký dùng thử đến thanh toán và gia hạn gói tập hoàn toàn tự động.',
    icon: 'Workflow',
    highlights: ['Form đăng ký trực tuyến, check-in QR', 'Thanh toán đa kênh và tự động xuất hóa đơn']
  },
  {
    title: 'Tối ưu lịch PT - tiết kiệm 8h/tuần',
    description: 'AI phân tích công suất lớp và đề xuất lịch dạy tối ưu cho từng HLV.',
    icon: 'CalendarRange',
    highlights: ['Chấm công bằng di động, đồng bộ với bảng lương', 'Phân tích tỷ lệ lấp đầy để tối ưu lịch học']
  }
];

export const ownerWorkflow: OwnerWorkflowStep[] = [
  {
    title: 'Kết nối dữ liệu & thiết bị',
    description: 'Đồng bộ CRM, máy quét thẻ và hệ thống thanh toán chỉ với vài thao tác.',
    result: 'Sẵn sàng đi vào hoạt động trong 48 giờ.',
    icon: 'PlugZap'
  },
  {
    title: 'Xây dựng quy trình chuẩn',
    description: 'Thiết lập sẵn luồng đăng ký, chăm sóc và báo cáo theo mô hình của bạn.',
    result: 'Nhân viên mới có thể tiếp quản ngay lập tức.',
    icon: 'Waypoints'
  },
  {
    title: 'Tối ưu bằng AI cố vấn',
    description: 'Gợi ý điều chỉnh giá, lịch làm việc và chiến dịch giữ chân dựa trên dữ liệu.',
    result: 'Ra quyết định nhanh chóng dựa trên KPI đáng tin cậy.',
    icon: 'Sparkles'
  }
];

export const ownerTestimonials: OwnerTestimonial[] = [
  {
    name: 'Trần Thị Mai',
    role: 'Founder & CEO, The Core Fitness',
    quote:
      'Sau 3 tháng dùng GymSmart, đội ngũ của tôi tiết kiệm được gần một ngày công mỗi tuần, và tôi biết chính xác chi nhánh nào đang cần hỗ trợ. ROI rất rõ ràng!',
    result: 'Tăng 28% doanh thu bán gói PT',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=80&h=80&q=80',
    rating: 4.9
  },
  {
    name: 'Nguyễn Anh Tuấn',
    role: 'CEO, Spartan Gym Group (3 chi nhánh)',
    quote:
      'Dashboard theo thời gian thực giúp tôi kiểm soát dòng tiền từng ngày. Việc mở thêm chi nhánh giờ không còn là nỗi lo lắng. GymSmart đã thay đổi cách chúng tôi vận hành.',
    result: 'Mở thêm 2 chi nhánh trong 6 tháng',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&q=80',
    rating: 5
  }
];

export const ownerIntegrations: OwnerIntegration[] = [
  {
    name: 'Thiết bị check-in RFID',
    description: 'Tích hợp với cổng, thẻ từ và máy quét mã QR.'
  },
  {
    name: 'Thanh toán đa kênh',
    description: 'Hỗ trợ Momo, VNPay, thẻ nội địa và chuyển khoản.'
  },
  {
    name: 'Marketing Automation',
    description: 'Kết nối Zalo OA, email và SMS để nuôi dưỡng khách hàng.'
  }
];

export const ownerCTA: OwnerCTA = {
  title: 'Sẵn sàng nâng cấp phòng gym của bạn?',
  subtitle: 'Miễn phí 14 ngày dùng thử • Onboarding trong 48 giờ',
  description:
    'Đội ngũ GymSmart sẽ đồng hành để chuẩn hóa quy trình, đào tạo nhân sự và giúp bạn làm chủ mọi chỉ số kinh doanh.'
};

export const ownerTimeline: OwnerTimelineItem[] = [
  {
    title: 'Chuẩn bị & thu thập dữ liệu',
    duration: 'Ngày 1 - 2',
    description: 'Import dữ liệu hội viên, danh mục dịch vụ và cấu hình chi nhánh.',
    highlights: ['Kết nối CRM & hệ thống quét thẻ sẵn có', 'Chuẩn hóa thông tin hợp đồng và lịch tập'],
    icon: 'Database'
  },
  {
    title: 'Thiết lập quy trình & phân quyền',
    duration: 'Ngày 3 - 5',
    description: 'Xây dựng luồng vận hành chuẩn cho lễ tân, PT và kế toán.',
    highlights: ['Tùy chỉnh bảng điều khiển KPI theo phòng ban', 'Huấn luyện đội ngũ qua workshop trực tuyến'],
    icon: 'Workflow'
  },
  {
    title: 'Go-live & tối ưu',
    duration: 'Ngày 6 - 14',
    description: 'Triển khai thực tế, giám sát chỉ số và tối ưu bằng AI cố vấn.',
    highlights: [
      'Kích hoạt campaign giữ chân hội viên tự động',
      'Theo dõi hiệu suất từng chi nhánh theo thời gian thực'
    ],
    icon: 'Rocket'
  }
];

export const ownerPricing: OwnerPricingTier[] = [
  {
    name: 'Starter',
    price: '2.9 triệu/tháng',
    description: 'Bắt đầu số hóa vận hành',
    features: ['Tối đa 500 hội viên', 'Dashboard doanh thu cơ bản', 'Quản lý hợp đồng tự động', 'Hỗ trợ email'],
    cta: 'Dùng thử ngay'
  },
  {
    name: 'Growth',
    price: '5.9 triệu/tháng',
    description: 'Tối ưu hóa doanh thu tối đa',
    badge: 'Phổ biến nhất',
    features: [
      'Không giới hạn hội viên',
      'AI đề xuất chiến lược bán hàng',
      'App di động cho toàn bộ đội ngũ',
      'Hỗ trợ triển khai 1-1',
      'Tích hợp thiết bị check-in'
    ],
    cta: 'Đặt lịch demo',
    mostPopular: true
  },
  {
    name: 'Enterprise',
    price: 'Theo báo giá',
    description: 'Giải pháp tùy chỉnh cho chuỗi lớn',
    features: [
      'Quản lý đa vùng & phân quyền',
      'Tích hợp ERP/kế toán',
      'Dedicated Customer Success',
      'SLA 99.9% uptime',
      'Tùy chỉnh theo yêu cầu'
    ],
    cta: 'Liên hệ tư vấn'
  }
];

export const ownerFaqs: OwnerFAQItem[] = [
  {
    question: 'GymSmart hỗ trợ chuyển đổi dữ liệu từ hệ thống cũ như thế nào?',
    answer:
      'Chúng tôi cung cấp bộ template chuẩn và đội ngũ chuyên gia sẽ hỗ trợ làm sạch dữ liệu, import hợp đồng, lịch tập và lịch sử thanh toán chỉ trong 48 giờ.'
  },
  {
    question: 'Có cần đầu tư thiết bị mới khi triển khai không?',
    answer:
      'Không bắt buộc. GymSmart tương thích với cổng, thẻ từ, QR và máy POS đang sử dụng. Nếu cần mở rộng, chúng tôi có gói cho thuê thiết bị với chi phí ưu đãi.'
  },
  {
    question: 'Đội ngũ tôi cần bao lâu để làm chủ hệ thống?',
    answer:
      'Sau buổi training trực tiếp và tài liệu e-learning, lễ tân/HLV có thể sử dụng thành thạo trong 1-2 ca làm. Bạn cũng có chuyên viên thành công khách hàng đồng hành trong 30 ngày đầu.'
  },
  {
    question: 'GymSmart có hỗ trợ đa chi nhánh và nhiều mô hình kinh doanh không?',
    answer:
      'Có. Bạn có thể tùy chỉnh KPI, giá gói và chiến dịch marketing theo từng chi nhánh, đồng thời quản lý PT, lớp nhóm và phòng studio trong cùng một nền tảng.'
  }
];
