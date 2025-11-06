import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Building2, Check, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import type { SubscriptionPackage } from '@/types/api/Subscription';

interface PurchaseSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: SubscriptionPackage | null;
  onSuccess?: () => void;
}

type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PAYOS';

export const PurchaseSubscriptionModal = ({
  open,
  onOpenChange,
  package: pkg,
  onSuccess
}: PurchaseSubscriptionModalProps) => {
  const { t } = useTranslation();

  const paymentMethods = [
    {
      value: 'CASH' as PaymentMethod,
      label: t('subscription.modal.payment.cash'),
      description: t('subscription.modal.payment.cashDesc'),
      icon: DollarSign,
      available: true
    },
    {
      value: 'BANK_TRANSFER' as PaymentMethod,
      label: t('subscription.modal.payment.bankTransfer'),
      description: t('subscription.modal.payment.bankTransferDesc'),
      icon: Building2,
      available: false
    },
    {
      value: 'CREDIT_CARD' as PaymentMethod,
      label: t('subscription.modal.payment.creditCard'),
      description: t('subscription.modal.payment.creditCardDesc'),
      icon: CreditCard,
      available: false
    }
  ];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [months, setMonths] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedMonths = [1, 3, 6, 9, 12];

  // Reset state when modal closes or package changes
  useEffect(() => {
    if (!open) {
      setMonths(1);
      setPaymentMethod('CASH');
    }
  }, [open]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleSubmit = async () => {
    if (!pkg) return;

    setIsSubmitting(true);

    const result = await subscriptionApi.purchaseSubscription({
      packageId: pkg._id,
      paymentMethod,
      months: Number(months) // Ensure it's a number
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success(t('subscription.modal.success.title'), {
        description: t('subscription.modal.success.description')
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }
  };

  if (!pkg) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200/60">
          <DialogTitle className="text-2xl font-semibold text-gray-900">{t('subscription.modal.title')}</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">{t('subscription.modal.description')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6">
          <div className="space-y-6 py-4">
            {/* Package Summary */}
            <div className="relative bg-gradient-to-br from-orange-50 via-orange-50/80 to-orange-100/60 rounded-xl p-5 border-2 border-orange-200/60 shadow-lg overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-300/20 rounded-full blur-xl -ml-12 -mb-12"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-orange-900">{pkg.name}</h3>
                  <div className="text-right bg-white/60 rounded-lg px-3 py-2 border border-orange-200/60 backdrop-blur-sm">
                    <div className="text-xs text-orange-600 font-medium mb-0.5">
                      {t('subscription.modal.pricePerMonth')}
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                      {formatPrice(pkg.price)}
                    </span>
                  </div>
                </div>

                {/* Month Selection */}
                <div className="mb-5">
                  <Label className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('subscription.modal.selectMonths')}
                  </Label>
                  <div className="grid grid-cols-5 gap-2.5">
                    {allowedMonths.map((month) => (
                      <button
                        key={month}
                        type="button"
                        onClick={() => setMonths(month)}
                        className={`relative px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-300 transform ${
                          months === month
                            ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50 scale-105 z-10'
                            : 'border-orange-200/60 bg-white text-orange-700 hover:border-orange-300 hover:bg-orange-50/80 hover:shadow-md hover:scale-105 active:scale-95'
                        }`}
                      >
                        {months === month && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-400 rounded-full border-2 border-white flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg font-bold">{month}</span>
                          <span className="text-xs opacity-90">{t('subscription.modal.month')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Price */}
                <div className="bg-gradient-to-r from-white via-orange-50/50 to-white rounded-xl p-4 border-2 border-orange-200/60 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-orange-700 font-semibold text-base flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      {t('subscription.modal.totalPayment')}:
                    </span>
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                      {formatPrice(pkg.price * months)}
                    </span>
                  </div>
                  {months > 1 && (
                    <div className="text-xs text-orange-600/80 mt-2 text-right font-medium">
                      {months} {t('subscription.modal.month')} × {formatPrice(pkg.price)}
                    </div>
                  )}
                </div>

                {/* Package Details */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-orange-200/60">
                    <div className="text-orange-600 font-medium text-xs mb-1">{t('subscription.modal.branches')}</div>
                    <div className="text-orange-900 font-bold text-base">
                      {t('subscription.modal.max')} {pkg.maxBranches}
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-orange-200/60">
                    <div className="text-orange-600 font-medium text-xs mb-1">{t('subscription.modal.customers')}</div>
                    <div className="text-orange-900 font-bold text-base">
                      {t('subscription.modal.max')} {pkg.maxCustomers}
                    </div>
                  </div>
                  <div className="col-span-2 bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-orange-200/60">
                    <div className="text-orange-600 font-medium text-xs mb-1">{t('subscription.modal.duration')}</div>
                    <div className="text-orange-900 font-bold text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {months} {t('subscription.modal.month')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500" />
                {t('subscription.modal.paymentMethod')}
              </Label>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.value}
                      className={`relative flex items-center space-x-3 rounded-lg border-2 p-3 transition-all duration-200 ${
                        paymentMethod === method.value
                          ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-orange-50/80 shadow-md shadow-orange-500/10'
                          : 'border-gray-200/60 bg-white hover:border-orange-200 hover:bg-orange-50/50'
                      } ${!method.available ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => method.available && setPaymentMethod(method.value)}
                    >
                      <RadioGroupItem
                        value={method.value}
                        id={method.value}
                        disabled={!method.available}
                        className={paymentMethod === method.value ? 'border-orange-500' : ''}
                      />
                      <div
                        className={`p-2 rounded-lg transition-all ${
                          paymentMethod === method.value
                            ? 'bg-orange-100 border border-orange-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <method.icon
                          className={`w-4 h-4 ${paymentMethod === method.value ? 'text-orange-600' : 'text-gray-500'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={method.value}
                          className={`text-sm font-semibold cursor-pointer flex items-center gap-2 ${
                            paymentMethod === method.value ? 'text-orange-900' : 'text-gray-700'
                          }`}
                        >
                          <span className="truncate">{method.label}</span>
                          {!method.available && (
                            <span className="text-xs font-normal px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full whitespace-nowrap">
                              {t('subscription.modal.payment.comingSoon')}
                            </span>
                          )}
                        </label>
                        <p
                          className={`text-xs mt-0.5 truncate ${
                            paymentMethod === method.value ? 'text-orange-600' : 'text-gray-500'
                          }`}
                        >
                          {method.description}
                        </p>
                      </div>
                      {paymentMethod === method.value && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-3 px-6 pb-6 pt-4 border-t border-gray-200/60 bg-gradient-to-r from-white to-orange-50/20">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="border-gray-300 hover:bg-gray-50 font-semibold"
          >
            {t('subscription.modal.button.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/60 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {t('subscription.modal.button.processing')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                {t('subscription.modal.button.confirm')}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
