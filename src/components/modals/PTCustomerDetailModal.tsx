import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/customer-progress';
import { Calendar, MessageSquare, ClipboardList, Clock, Users } from 'lucide-react';
import type { PTCustomerDetailModalProps } from '@/types/components/Customer';
import { usePTCustomerUtils } from '@/hooks/usePTCustomer';
import { useTranslation } from 'react-i18next';

export const PTCustomerDetailModal: React.FC<PTCustomerDetailModalProps> = ({ isOpen, onClose, customer }) => {
  const { t } = useTranslation();
  const { formatDate, calculateProgress, getUrgencyLevel } = usePTCustomerUtils();

  if (!customer) return null;

  const urgency = getUrgencyLevel(customer);
  const progress = calculateProgress(customer);

  const getStatusBadge = () => {
    const variants = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: t('pt_customer_detail.status_active') },
      urgent: {
        bg: 'bg-[#F05A29] bg-opacity-10',
        text: 'text-[#F05A29]',
        label: t('pt_customer_detail.status_urgent')
      },
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('pt_customer_detail.status_pending') },
      expired: { bg: 'bg-red-100', text: 'text-red-700', label: t('pt_customer_detail.status_expired') }
    };

    const variant = variants[urgency];
    return <Badge className={`${variant.bg} ${variant.text} border-0 font-medium`}>{variant.label}</Badge>;
  };

  const getPaymentStatusBadge = () => {
    const variants = {
      PAID: { bg: 'bg-green-100', text: 'text-green-700', label: t('pt_customer_detail.payment_paid') },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('pt_customer_detail.payment_pending') },
      PARTIAL: { bg: 'bg-orange-100', text: 'text-orange-700', label: t('pt_customer_detail.payment_partial') }
    };

    const variant = variants[customer.package.paymentStatus];
    return <Badge className={`${variant.bg} ${variant.text} border-0 font-medium`}>{variant.label}</Badge>;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-background">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-border shadow-md">
                <AvatarImage src={customer.avatar || '/placeholder.svg'} alt={customer.fullName} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xl font-semibold">
                  {customer.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {/* Status indicator */}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background shadow-sm flex items-center justify-center ${
                  urgency === 'active'
                    ? 'bg-green-500'
                    : urgency === 'urgent'
                      ? 'bg-orange-500'
                      : urgency === 'expired'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                }`}
              >
                <div className="w-1 h-1 rounded-full bg-white"></div>
              </div>
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl font-semibold text-foreground mb-1">{customer.fullName}</SheetTitle>
              <SheetDescription className="text-muted-foreground font-medium text-sm">
                {customer.phone}
              </SheetDescription>
              <div className="mt-2">{getStatusBadge()}</div>
            </div>
          </div>

          {/* Contract Info - Compact inline */}
          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.package_label')}</span>
                <span className="font-medium text-foreground">{customer.package.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.total_sessions')}</span>
                <span className="font-medium text-foreground">
                  {customer.package.totalSessions} {t('pt_customer_detail.sessions_left')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.sessions_used')}</span>
                <span className="font-medium text-foreground">
                  {customer.package.sessionsUsed} {t('pt_customer_detail.sessions_left')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.sessions_remaining')}</span>
                <span className="font-bold text-primary">
                  {customer.package.sessionsRemaining} {t('pt_customer_detail.sessions_left')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.start_date')}</span>
                <span className="font-medium text-foreground">{formatDate(customer.package.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pt_customer_detail.end_date')}</span>
                <span className="font-medium text-foreground">{formatDate(customer.package.endDate)}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">{t('pt_customer_detail.payment_status')}</span>
                {getPaymentStatusBadge()}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Progress Section */}
        <div className="mb-6">
          <div className="rounded-xl bg-card p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                <Users className="w-3 h-3 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{t('pt_customer_detail.training_progress')}</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {customer.package.sessionsUsed}/{customer.package.totalSessions}{' '}
                  {t('pt_customer_detail.sessions_completed')}
                </span>
                <span className="font-medium text-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 w-full bg-gray-200" indicatorClassName="bg-orange-500" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t('pt_customer_detail.sessions_remaining')} {customer.package.sessionsRemaining}{' '}
                  {t('pt_customer_detail.sessions_left')}
                </span>
                <span>
                  {t('pt_customer_detail.expires_on')} {formatDate(customer.package.endDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <div className="rounded-xl bg-card p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{t('pt_customer_detail.contact_info')}</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium text-sm">
                  {t('pt_customer_detail.phone_number')}
                </span>
                <span className="font-semibold text-foreground text-sm">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground font-medium text-sm">{t('pt_customer_detail.email')}</span>
                  <span className="font-semibold text-foreground text-sm">{customer.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm text-sm">
              <Calendar className="mr-2 h-4 w-4" />
              {t('pt_customer_detail.view_schedule')}
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl border-border hover:bg-secondary bg-transparent text-sm"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              {t('pt_customer_detail.add_note')}
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl border-border hover:bg-secondary bg-transparent text-sm"
            >
              <Clock className="mr-2 h-4 w-4" />
              {t('pt_customer_detail.training_history')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
