import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { businessVerificationApi } from '@/services/api/businessVerificationApi';

interface DashboardStats {
  totalUsers: number;
  totalVerifications: number;
  pendingVerifications: number;
  approvedVerifications: number;
  rejectedVerifications: number;
  recentActivity: Array<{
    id: string;
    type: 'verification_submitted' | 'verification_approved' | 'verification_rejected';
    userName: string;
    businessName: string;
    timestamp: string;
  }>;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVerifications: 0,
    pendingVerifications: 0,
    approvedVerifications: 0,
    rejectedVerifications: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);

    // Fetch verification statistics
    const statsResult = await businessVerificationApi.getStatistics();

    if (statsResult.success && statsResult.data) {
      setStats({
        totalUsers: 0, // TODO: Fetch from users API
        totalVerifications: statsResult.data.total || 0,
        pendingVerifications: statsResult.data.pending || 0,
        approvedVerifications: statsResult.data.approved || 0,
        rejectedVerifications: statsResult.data.rejected || 0,
        recentActivity: [] // TODO: Fetch recent activity
      });
    }

    setLoading(false);
  };

  const statCards = [
    // TODO: Uncomment when User Management is implemented
    // {
    //   title: 'Tổng người dùng',
    //   value: stats.totalUsers,
    //   icon: Users,
    //   trend: '+12.5%',
    //   trendUp: true,
    //   color: 'blue',
    //   onClick: () => navigate('/admin/users')
    // },
    {
      title: 'Yêu cầu chờ duyệt',
      value: stats.pendingVerifications,
      icon: Clock,
      badge: stats.pendingVerifications > 0 ? 'Cần xử lý' : undefined,
      color: 'yellow',
      onClick: () => navigate('/admin/business-verifications?status=PENDING')
    },
    {
      title: 'Đã xác thực',
      value: stats.approvedVerifications,
      icon: CheckCircle2,
      trend: '+8.2%',
      trendUp: true,
      color: 'green',
      onClick: () => navigate('/admin/business-verifications?status=APPROVED')
    },
    {
      title: 'Đã từ chối',
      value: stats.rejectedVerifications,
      icon: XCircle,
      color: 'red',
      onClick: () => navigate('/admin/business-verifications?status=REJECTED')
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      orange: {
        bg: 'bg-orange-50',
        icon: 'text-orange-600',
        hover: 'hover:bg-orange-100'
      },
      yellow: {
        bg: 'bg-yellow-50',
        icon: 'text-yellow-600',
        hover: 'hover:bg-yellow-100'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        hover: 'hover:bg-green-100'
      },
      red: {
        bg: 'bg-red-50',
        icon: 'text-red-600',
        hover: 'hover:bg-red-100'
      }
    };
    return colors[color as keyof typeof colors] || colors.orange;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Tổng quan hệ thống</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Chào mừng quay trở lại! Đây là tổng quan hệ thống.</p>
        </div>
        <Button onClick={() => fetchDashboardStats()} variant="outline">
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);

          return (
            <Card
              key={index}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${colors.hover}`}
              onClick={card.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                <div className="flex items-center gap-2 mt-2">
                  {card.trend && (
                    <div className={`flex items-center text-sm ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                      {card.trendUp ? (
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 mr-1" />
                      )}
                      <span className="font-medium">{card.trend}</span>
                    </div>
                  )}
                  {card.badge && (
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                      {card.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/admin/business-verifications')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              Quản lý xác thực
            </CardTitle>
            <CardDescription>Xem và duyệt yêu cầu xác thực doanh nghiệp</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-orange-600 hover:bg-orange-700">
              Xem danh sách
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Quản lý người dùng
            </CardTitle>
            <CardDescription>Quản lý tài khoản và phân quyền người dùng</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-orange-600 hover:bg-orange-700">
              Xem người dùng
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/reports')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Báo cáo & Thống kê
            </CardTitle>
            <CardDescription>Xem báo cáo chi tiết và phân tích dữ liệu</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-orange-600 hover:bg-orange-700">
              Xem báo cáo
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Verifications Alert */}
      {stats.pendingVerifications > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              Có {stats.pendingVerifications} yêu cầu đang chờ xử lý
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Vui lòng xem xét và xử lý các yêu cầu xác thực doanh nghiệp đang chờ duyệt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="bg-yellow-600 hover:bg-yellow-700"
              onClick={() => navigate('/admin/business-verifications?status=PENDING')}
            >
              Xem ngay
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
          <CardDescription>Các hoạt động mới nhất trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có hoạt động nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {activity.type === 'verification_submitted' && <Clock className="w-5 h-5 text-blue-600" />}
                    {activity.type === 'verification_approved' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {activity.type === 'verification_rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                    <div>
                      <p className="font-medium text-gray-900">{activity.businessName}</p>
                      <p className="text-sm text-gray-500">{activity.userName}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{activity.timestamp}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
