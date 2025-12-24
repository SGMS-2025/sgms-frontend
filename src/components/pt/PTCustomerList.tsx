import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/customer-progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, User, Users, Clock, AlertCircle } from 'lucide-react';
import { PagePagination } from '@/components/ui/PagePagination';
import { Skeleton } from '@/components/ui/skeleton';
import { PTCustomerDetailModal } from '@/components/modals/PTCustomerDetailModal';
import { usePTCustomerList, usePTCustomerFilters, usePTCustomerUtils } from '@/hooks/usePTCustomer';
import { useUser } from '@/hooks/useAuth';
import { useBranch } from '@/contexts/BranchContext';
import type { PTCustomer } from '@/types/api/Customer';
import type { PTCustomerListProps } from '@/types/components/Customer';

export default function PTCustomerList({ trainerId }: PTCustomerListProps) {
  const { t } = useTranslation();
  const currentUser = useUser();
  const { currentBranch } = useBranch();
  const [selectedCustomer, setSelectedCustomer] = useState<PTCustomer | null>(null);
  const [backendSearchTerm, setBackendSearchTerm] = useState('');

  // Use the current user's ID as trainerId if not provided
  const actualTrainerId = trainerId || currentUser?._id || '';

  // Fetch customer data using the hook
  const { customerList, loading, error, stats, pagination, refetch, goToPage } = usePTCustomerList({
    trainerId: actualTrainerId,
    limit: 6, // Show 6 customers per page
    packageType: 'PT', // Only show PT packages
    branchId: currentBranch?._id, // Add branchId for permission validation
    searchTerm: backendSearchTerm
  });

  // Handle filtering and sorting
  const { filters, filteredAndSortedCustomers, updateFilters, debouncedSearch } = usePTCustomerFilters(customerList);

  // Keep backend search term in sync with debounced UI input
  useEffect(() => {
    setBackendSearchTerm(debouncedSearch);
  }, [debouncedSearch]);

  // Utility functions
  const { formatDate, calculateProgress, getUrgencyLevel } = usePTCustomerUtils();

  const getStatusBadge = (customer: PTCustomer) => {
    const urgency = getUrgencyLevel(customer);

    const variants = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: t('pt_customer.status_badge.active') },
      urgent: { bg: 'bg-orange-100', text: 'text-orange-700', label: t('pt_customer.status_badge.urgent') },
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('pt_customer.status_badge.pending') },
      expired: { bg: 'bg-red-100', text: 'text-red-700', label: t('pt_customer.status_badge.expired') }
    };

    const variant = variants[urgency];
    return <Badge className={`${variant.bg} ${variant.text} border-0 font-medium`}>{variant.label}</Badge>;
  };

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    updateFilters({ searchTerm: value });
  };

  const handleStatusFilterChange = (value: string) => {
    updateFilters({ statusFilter: value });
  };

  const handleExpirationFilterChange = (value: string) => {
    updateFilters({ expirationFilter: value });
  };

  const handleSessionsFilterChange = (value: string) => {
    updateFilters({ sessionsFilter: value });
  };

  const handleSortChange = (value: string) => {
    updateFilters({ sortBy: value });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t('pt_customer.my_customers')}</h1>
          <p className="text-muted-foreground text-lg">{t('pt_customer.manage_assigned_customers')}</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-5 rounded-[20px] bg-white">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-24" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refetch} className="bg-[#f05a29] hover:bg-[#df4615] text-white">
                {t('common.try_again')}
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="p-5 rounded-[20px] bg-white border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t('pt_customer.stats.total_customers')}
                </span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{t('pt_customer.stats.total_customers_desc')}</p>
            </Card>

            <Card className="p-5 rounded-[20px] bg-white border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-muted-foreground">{t('pt_customer.stats.active')}</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.active}</div>
              <p className="text-xs text-muted-foreground">{t('pt_customer.stats.active_desc')}</p>
            </Card>

            <Card className="p-5 rounded-[20px] bg-white border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-[#F05A29]" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t('pt_customer.stats.expiring_soon')}
                </span>
              </div>
              <div className="text-3xl font-bold text-[#F05A29] mb-1">{stats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">{t('pt_customer.stats.expiring_soon_desc')}</p>
            </Card>

            <Card className="p-5 rounded-[20px] bg-white border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{t('pt_customer.stats.expired')}</span>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-1">{stats.expired}</div>
              <p className="text-xs text-muted-foreground">{t('pt_customer.stats.expired_desc')}</p>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search bar - takes available space */}
            <div className="relative flex-1 min-w-0 flex items-center">
              <Search className="absolute left-3 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
              <Input
                placeholder={t('pt_customer.search_placeholder')}
                value={filters.searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-[48px] rounded-[20px] border-gray-200 bg-white focus-visible:ring-[#F05A29] focus-visible:ring-offset-0"
                style={{ paddingTop: '12px', paddingBottom: '12px' }}
              />
            </div>

            {/* Filter dropdowns - all same height and aligned */}
            <div className="flex flex-wrap gap-3 lg:flex-nowrap lg:items-center">
              <Select value={filters.statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger
                  className="w-full lg:w-[200px] rounded-[20px] bg-white border-gray-200 focus:ring-[#F05A29] focus:ring-offset-0"
                  style={{ height: '48px', paddingTop: '12px', paddingBottom: '12px' }}
                >
                  <SelectValue placeholder={t('pt_customer.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('pt_customer.filter.all_status')}</SelectItem>
                  <SelectItem value="ACTIVE">{t('pt_customer.filter.active')}</SelectItem>
                  <SelectItem value="PENDING_ACTIVATION">{t('pt_customer.filter.pending_activation')}</SelectItem>
                  <SelectItem value="EXPIRED">{t('pt_customer.filter.expired')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.expirationFilter} onValueChange={handleExpirationFilterChange}>
                <SelectTrigger
                  className="w-full lg:w-[200px] rounded-[20px] bg-white border-gray-200 focus:ring-[#F05A29] focus:ring-offset-0"
                  style={{ height: '48px', paddingTop: '12px', paddingBottom: '12px' }}
                >
                  <SelectValue placeholder={t('pt_customer.expiration_filter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('pt_customer.filter.all_expiration')}</SelectItem>
                  <SelectItem value="7">{t('pt_customer.filter.days_7')}</SelectItem>
                  <SelectItem value="14">{t('pt_customer.filter.days_14')}</SelectItem>
                  <SelectItem value="30">{t('pt_customer.filter.days_30')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sessionsFilter} onValueChange={handleSessionsFilterChange}>
                <SelectTrigger
                  className="w-full lg:w-[200px] rounded-[20px] bg-white border-gray-200 focus:ring-[#F05A29] focus:ring-offset-0"
                  style={{ height: '48px', paddingTop: '12px', paddingBottom: '12px' }}
                >
                  <SelectValue placeholder={t('pt_customer.sessions_remaining')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('pt_customer.filter.all_sessions')}</SelectItem>
                  <SelectItem value="3">{t('pt_customer.filter.sessions_3')}</SelectItem>
                  <SelectItem value="5">{t('pt_customer.filter.sessions_5')}</SelectItem>
                  <SelectItem value="10">{t('pt_customer.filter.sessions_10')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By Dropdown */}
              <Select value={filters.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger
                  className="w-full lg:w-[200px] rounded-[20px] bg-white border-gray-200 focus:ring-[#F05A29] focus:ring-offset-0"
                  style={{ height: '48px', paddingTop: '12px', paddingBottom: '12px' }}
                >
                  <SelectValue placeholder={t('pt_customer.sort.label', 'Sort by')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEAREST_EXPIRATION">
                    {t('pt_customer.sort.nearest_expiration', 'Nearest expiration')}
                  </SelectItem>
                  <SelectItem value="RECENTLY_UPDATED">
                    {t('pt_customer.sort.recently_updated', 'Recently updated')}
                  </SelectItem>
                  <SelectItem value="NEWEST_CONTRACT">
                    {t('pt_customer.sort.newest_contract', 'Newest contract')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Customer Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 rounded-[20px] bg-white">
                <div className="flex items-start gap-4 mb-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-2 w-full mb-4" />
                <Skeleton className="h-4 w-28" />
              </Card>
            ))}
          </div>
        ) : filteredAndSortedCustomers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-32 h-32 mb-6 rounded-full bg-white flex items-center justify-center border-2 border-dashed border-gray-200">
              <User className="w-16 h-16 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">{t('pt_customer.no_customers_found')}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {filters.searchTerm || filters.statusFilter !== 'ALL' || filters.expirationFilter !== 'ALL'
                ? t('pt_customer.try_adjust_filters')
                : t('pt_customer.assigned_customers_appear_here')}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedCustomers.map((customer, index) => {
                const urgency = getUrgencyLevel(customer);
                const isKpi = customer.contractType === 'MEMBERSHIP_KPI';
                const progress = calculateProgress(customer);

                const getPaymentStatusBadge = () => (
                  <Badge
                    className={`${
                      customer.package.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : customer.package.paymentStatus === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-orange-100 text-orange-700'
                    } border-0 font-medium`}
                  >
                    {customer.package.paymentStatus === 'PAID'
                      ? t('pt_customer.payment.paid')
                      : customer.package.paymentStatus === 'PENDING'
                        ? t('pt_customer.payment.pending')
                        : t('pt_customer.payment.partial')}
                  </Badge>
                );

                const getProgressIndicatorClass = () => {
                  if (urgency === 'expired') return 'bg-red-500';
                  if (urgency === 'urgent') return 'bg-[#F05A29]';
                  if (urgency === 'pending') return 'bg-gray-400';
                  return 'bg-green-500';
                };

                return (
                  <motion.div
                    key={customer._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="h-full p-6 rounded-[20px] shadow-sm hover:shadow-md transition-shadow bg-white border-gray-200">
                      <div className="flex h-full flex-col">
                        {/* Customer Info */}
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14 cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                            <AvatarImage src={customer.avatar || '/placeholder.svg'} alt={customer.fullName} />
                            <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                              {customer.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                            <h3 className="font-semibold text-lg text-foreground truncate">{customer.fullName}</h3>
                            <p className="text-sm text-foreground">{customer.phone}</p>
                          </div>
                        </div>

                        <div
                          className="flex-1 pt-4 space-y-4 cursor-pointer"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          {/* Package & Status */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {customer.package.name}
                              </span>
                              {isKpi && (
                                <Badge className="bg-blue-100 text-blue-700 border-0 text-xs font-medium">
                                  {t('pt_customer.kpi_badge')}
                                </Badge>
                              )}
                            </div>
                            {getStatusBadge(customer)}
                          </div>

                          {/* Highlight Row */}
                          <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2">
                            {isKpi ? (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {t('pt_customer.payment_status')}
                                </span>
                                <div className="flex items-center gap-2">{getPaymentStatusBadge()}</div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  className={`text-sm font-semibold ${
                                    urgency === 'urgent' ? 'text-[#F05A29]' : 'text-foreground'
                                  }`}
                                >
                                  {t('pt_customer.sessions_remaining_count', {
                                    count: customer.package.sessionsRemaining
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-foreground">
                                {isKpi
                                  ? `${formatDate(customer.package.startDate)} - ${formatDate(customer.package.endDate)}`
                                  : t('pt_customer.sessions_completed', {
                                      used: customer.package.sessionsUsed,
                                      total: customer.package.totalSessions
                                    })}
                              </span>
                              <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
                            </div>
                            <Progress
                              value={progress}
                              className="h-2.5 w-full bg-gray-200"
                              indicatorClassName={getProgressIndicatorClass()}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination - Show when there are multiple pages (more than 6 customers) */}
        {pagination && pagination.totalPages > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <PagePagination pagination={pagination} goToPage={goToPage} />
          </motion.div>
        )}
      </div>

      {/* Customer Detail Modal */}
      <PTCustomerDetailModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />
    </div>
  );
}
