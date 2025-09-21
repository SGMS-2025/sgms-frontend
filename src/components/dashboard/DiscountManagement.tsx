import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Calendar, Percent, Users, MapPin, User, Search } from 'lucide-react';
import { useDiscountCampaignList } from '@/hooks/useDiscount';
import { formatDate } from '@/utils/utils';
import { getStatusBadgeConfig } from '@/utils/discountUtils';

const DiscountManagement: React.FC = () => {
  const { t } = useTranslation();
  const { campaigns, pagination, loading, error, refetch, statusFilter, setStatusFilter } = useDiscountCampaignList();
  const [searchTerm, setSearchTerm] = React.useState('');

  // Handle search with debouncing
  const handleSearchChange = React.useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = React.useCallback(
    (value: string) => {
      setStatusFilter(value);
    },
    [setStatusFilter]
  );

  // Calculate stats for display
  const campaignStats = React.useMemo(() => {
    return {
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === 'ACTIVE').length,
      expired: campaigns.filter((c) => c.status === 'EXPIRED').length,
      pending: campaigns.filter((c) => c.status === 'PENDING').length
    };
  }, [campaigns]);

  // Use React.useMemo for better performance
  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesStatus = !statusFilter || statusFilter === 'all' || campaign.status === statusFilter;

      const matchesSearch =
        !searchTerm ||
        campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.createBy.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.branchId.some((branch) => branch.branchName.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [campaigns, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('discount.loading_campaigns')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            {t('discount.try_again')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('discount.title')}</h1>
          <p className="text-gray-600 mt-1">{t('discount.subtitle')}</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          {t('discount.add_campaign')}
        </Button>
      </div>

      {/* Stats Cards */}
      {pagination && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Percent className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('discount.total_campaigns')}</p>
                  <p className="text-2xl font-bold text-gray-900">{campaignStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('discount.active_campaigns')}</p>
                  <p className="text-2xl font-bold text-gray-900">{campaignStats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('discount.expired_campaigns')}</p>
                  <p className="text-2xl font-bold text-gray-900">{campaignStats.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('discount.pending_campaigns')}</p>
                  <p className="text-2xl font-bold text-gray-900">{campaignStats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('discount.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('discount.filter_by_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('discount.all_status')}</SelectItem>
                  <SelectItem value="ACTIVE">{t('discount.active')}</SelectItem>
                  <SelectItem value="PENDING">{t('discount.pending')}</SelectItem>
                  <SelectItem value="EXPIRED">{t('discount.expired')}</SelectItem>
                  <SelectItem value="INACTIVE">{t('discount.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign._id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-gray-900">{campaign.campaignName}</CardTitle>
                {(() => {
                  const badgeConfig = getStatusBadgeConfig(campaign, t);
                  return <Badge variant={badgeConfig.variant}>{badgeConfig.text}</Badge>;
                })()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">{campaign.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{t('discount.discount')}:</span>
                <span className="font-semibold text-orange-600">{campaign.discountPercentage}%</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{t('discount.start_date')}:</span>
                  <span className="text-sm font-medium">{formatDate(campaign.startDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{t('discount.end_date')}:</span>
                  <span className="text-sm font-medium">{formatDate(campaign.endDate)}</span>
                </div>
              </div>

              {campaign.branchId && campaign.branchId.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">{t('discount.branches')}:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {campaign.branchId.slice(0, 2).map((branch, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {branch.branchName}
                      </Badge>
                    ))}
                    {campaign.branchId.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{campaign.branchId.length - 2} {t('discount.more')}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{t('discount.created_by')}:</span>
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  <span className="text-sm font-medium">{campaign.createBy.fullName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Percent className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('discount.no_campaigns_found')}</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? t('discount.no_campaigns_filtered')
                : t('discount.no_campaigns_message')}
            </p>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              {t('discount.add_campaign')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiscountManagement;
