import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Building2, MapPin, Users, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { userApi } from '@/services/api/userApi';
import type { User } from '@/types/api/User';
import { format } from 'date-fns';

interface OwnerBranch {
  _id: string;
  branchName: string;
  location?: string;
  description?: string;
  isActive: boolean;
  ownerId: string;
  managerId?:
    | Array<{
        _id: string;
        fullName?: string;
        email?: string;
      }>
    | string[];
  createdAt: string;
  updatedAt: string;
}

const AdminOwnerDetailPage = () => {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [owner, setOwner] = useState<User | null>(null);
  const [branches, setBranches] = useState<OwnerBranch[]>([]);
  const [loading, setLoading] = useState(true);

  const statusLabels: Record<string, string> = {
    ACTIVE: t('common.status.active'),
    INACTIVE: t('common.status.inactive'),
    SUSPENDED: t('common.status.suspended'),
    DELETED: t('common.status.deleted')
  };

  useEffect(() => {
    if (userId) {
      fetchOwnerDetail();
    }
  }, [userId]);

  const fetchOwnerDetail = async () => {
    if (!userId) return;

    setLoading(true);
    const result = await userApi.getOwnerDetail(userId);

    if (result.success && result.data) {
      setOwner(result.data.owner);
      setBranches(result.data.branches || []);
    } else {
      const errorMessage = result.message || t('admin.owner_detail.toast.fetchError');
      toast.error(errorMessage);
      console.error('Owner detail error:', result);
      navigate('/admin/accounts');
    }

    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-200',
      INACTIVE: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      SUSPENDED: 'bg-red-100 text-red-800 hover:bg-red-200',
      DELETED: 'bg-gray-200 text-gray-600 hover:bg-gray-300'
    };

    return (
      <Badge className={colors[status] || colors.INACTIVE} variant="outline">
        {statusLabels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.owner_detail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => navigate('/admin/accounts')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('admin.owner_detail.backButton')}
        </Button>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-gray-500">
              <p>{t('admin.owner_detail.empty')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/accounts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.actions.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.owner_detail.title')}</h1>
            <p className="text-gray-500 mt-1">{t('admin.owner_detail.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.owner_detail.info.title')}</CardTitle>
          <CardDescription>{t('admin.owner_detail.info.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              {owner.avatar?.url ? (
                <img
                  src={owner.avatar.url}
                  alt={owner.fullName || owner.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-gray-500" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">{owner.fullName || owner.username}</h3>
                <p className="text-gray-500">@{owner.username}</p>
                {getStatusBadge(owner.status)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{owner.email}</span>
              </div>
              {owner.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{owner.phoneNumber}</span>
                </div>
              )}
              {owner.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{owner.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {t('admin.owner_detail.info.joined', {
                    date: format(new Date(owner.createdAt), 'MMM dd, yyyy')
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branches List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t('admin.owner_detail.branches.title', { count: branches.length })}
          </CardTitle>
          <CardDescription>{t('admin.owner_detail.branches.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>{t('admin.owner_detail.branches.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.owner_detail.branches.columns.name')}</TableHead>
                    <TableHead>{t('admin.owner_detail.branches.columns.location')}</TableHead>
                    <TableHead>{t('admin.owner_detail.branches.columns.status')}</TableHead>
                    <TableHead>{t('admin.owner_detail.branches.columns.created')}</TableHead>
                    <TableHead className="text-right">{t('admin.owner_detail.branches.columns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch._id}>
                      <TableCell className="font-medium">{branch.branchName}</TableCell>
                      <TableCell>{branch.location || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          className={branch.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          variant="outline"
                        >
                          {branch.isActive ? t('common.status.active') : t('common.status.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(branch.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/branches/${branch._id}/customers`)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          {t('admin.owner_detail.actions.viewCustomers')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOwnerDetailPage;
