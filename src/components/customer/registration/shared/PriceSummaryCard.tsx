import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/utils/utils';

interface PriceSummaryCardProps {
  basePrice: number;
  discountAmount: number;
  totalPrice: number;
}

interface PriceRowProps {
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
  containerClassName?: string;
}

const PriceRow: React.FC<PriceRowProps> = ({
  label,
  value,
  labelClassName = 'text-sm text-muted-foreground',
  valueClassName = 'text-sm font-semibold',
  containerClassName = ''
}) => (
  <div className={cn('flex justify-between items-center', containerClassName)}>
    <span className={labelClassName}>{label}</span>
    <span className={valueClassName}>{value}</span>
  </div>
);

export const PriceSummaryCard: React.FC<PriceSummaryCardProps> = ({ basePrice, discountAmount, totalPrice }) => {
  const { t } = useTranslation();
  const rows = [
    {
      label: t('shared_form.base_price'),
      value: formatCurrency(basePrice),
      labelClassName: 'text-xs text-muted-foreground',
      valueClassName: 'text-sm font-semibold'
    },
    ...(discountAmount > 0
      ? [
          {
            label: t('shared_form.discount'),
            value: `-${formatCurrency(discountAmount)}`,
            labelClassName: 'text-xs',
            valueClassName: 'text-sm font-semibold',
            containerClassName: 'text-green-600'
          }
        ]
      : []),
    {
      label: t('shared_form.total'),
      value: formatCurrency(totalPrice),
      labelClassName: 'text-sm font-semibold',
      valueClassName: 'text-lg font-bold text-primary',
      containerClassName: 'border-t border-border pt-2'
    }
  ];

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-3 space-y-2">
      {rows.map((row, index) => (
        <PriceRow key={`${row.label}-${index}`} {...row} />
      ))}
    </div>
  );
};
