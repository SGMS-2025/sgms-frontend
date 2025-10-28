import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.customer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.customer';
import { Dialog, DialogContent } from '@/components/ui/dialog.customer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/utils/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TrendDataPoint, TrainingProgressEntry } from '@/types/customerTrainingProgress';

// Type for display in UI (with optional metrics)
export type DisplayProgressEntry = Omit<TrainingProgressEntry, 'weightKg' | 'bmi' | 'strengthScore' | 'heightCm'> & {
  weightKg?: number;
  bmi?: number;
  strengthScore?: number;
  heightCm?: number;
};

// ===== Header =====
export function Header({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">{t(title)}</h1>
    </div>
  );
}

// ===== Summary Card =====
export function ProgressSummaryCard({
  summary,
  loading
}: {
  summary?: {
    currentWeight?: number;
    currentBMI?: number;
    currentStrength?: number;
    ptName?: string;
    contractName?: string;
    lastUpdatedAt?: string;
  } | null;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">{t('training_progress.weight')}</div>
        <div className="mt-1 text-xl md:text-2xl font-semibold">
          {loading ? '…' : summary?.currentWeight ? `${summary.currentWeight} kg` : '--'}
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">{t('training_progress.bmi')}</div>
        <div className="mt-1 text-xl md:text-2xl font-semibold">{loading ? '…' : (summary?.currentBMI ?? '--')}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">{t('training_progress.strength')}</div>
        <div className="mt-1 text-xl md:text-2xl font-semibold">
          {loading ? '…' : (summary?.currentStrength ?? '--')}
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">{t('training_progress.updated')}</div>
        <div className="mt-1 text-xl md:text-2xl font-semibold">
          {loading ? '…' : summary?.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleDateString() : '--'}
        </div>
      </Card>
    </div>
  );
}

// ===== Chart =====
export function TrainingChart({ data, loading }: { data?: TrendDataPoint[]; loading?: boolean }) {
  const { t, i18n } = useTranslation();
  const [metric, setMetric] = React.useState<'weight' | 'bmi' | 'strength'>('weight');

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!data?.length) return [];

    const localeCode = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

    return data.map((item) => ({
      date: new Date(item.date).toLocaleDateString(localeCode, {
        day: '2-digit',
        month: '2-digit'
      }),
      weight: item.weightKg,
      bmi: item.bmi,
      strength: item.strengthScore
    }));
  }, [data, i18n.language]);

  const getChartConfig = () => {
    switch (metric) {
      case 'weight':
        return {
          dataKey: 'weight',
          name: t('training_progress.weight_kg'),
          color: '#8884d8',
          unit: 'kg'
        };
      case 'bmi':
        return {
          dataKey: 'bmi',
          name: t('training_progress.bmi_name'),
          color: '#82ca9d',
          unit: ''
        };
      case 'strength':
        return {
          dataKey: 'strength',
          name: t('training_progress.strength_name'),
          color: '#ffc658',
          unit: ''
        };
      default:
        return {
          dataKey: 'weight',
          name: t('training_progress.weight_kg'),
          color: '#8884d8',
          unit: 'kg'
        };
    }
  };

  const config = getChartConfig();

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-medium">{t('training_progress.chart_title')}</div>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as 'weight' | 'bmi' | 'strength')}>
          <TabsList>
            <TabsTrigger value="weight">{t('training_progress.weight_tab')}</TabsTrigger>
            <TabsTrigger value="bmi">{t('training_progress.bmi_tab')}</TabsTrigger>
            <TabsTrigger value="strength">{t('training_progress.strength_tab')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-80">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t('training_progress.loading_chart')}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            {t('training_progress.no_chart_data')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={8} />
              <YAxis tick={{ fontSize: 12 }} tickMargin={8} />
              <Tooltip
                labelFormatter={(label) => `${t('training_progress.date_label')}: ${label}`}
                formatter={(value: number) => [`${value}${config.unit}`, config.name]}
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px'
                }}
              />
              <Line
                type="monotone"
                dataKey={config.dataKey}
                stroke={config.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6, stroke: config.color, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

// ===== Filter bar =====
export function FilterBar({ onChange }: { onChange?: (v: { from?: string; to?: string }) => void }) {
  const { t } = useTranslation();
  const [fromDate, setFromDate] = React.useState<Date>();
  const [toDate, setToDate] = React.useState<Date>();
  const [fromOpen, setFromOpen] = React.useState(false);
  const [toOpen, setToOpen] = React.useState(false);
  const [range, setRange] = React.useState<string>('last-4w');

  // Convert Date to string format for API
  const formatDateForApi = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className="flex flex-wrap items-end gap-2 md:gap-3">
      <div className="w-full sm:w-auto">
        <div className="mb-1 text-xs sm:text-sm">{t('training_progress.time_range')}</div>
        <Select value={range} onValueChange={(v) => setRange(v)}>
          <SelectTrigger className="w-full sm:w-[180px]" size="sm">
            <SelectValue placeholder={t('common.select')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-4w">{t('training_progress.last_4_weeks')}</SelectItem>
            <SelectItem value="last-3m">{t('training_progress.last_3_months')}</SelectItem>
            <SelectItem value="all">{t('training_progress.all_time')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[calc(50%-4px)] sm:w-auto">
        <div className="mb-1 text-xs sm:text-sm">{t('training_progress.from_date')}</div>
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal bg-white border-gray-200 hover:bg-gray-50 focus:border-orange-500 h-8 px-3 text-sm',
                !fromDate && 'text-muted-foreground'
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {fromDate ? format(fromDate, 'dd/MM/yyyy', { locale: vi }) : t('training_progress.select_date')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
            <CalendarComponent
              mode="single"
              selected={fromDate}
              onSelect={(date) => {
                setFromDate(date);
                if (date) setFromOpen(false);
              }}
              initialFocus
              locale={vi}
              className="bg-white border-0"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="w-[calc(50%-4px)] sm:w-auto">
        <div className="mb-1 text-xs sm:text-sm">{t('training_progress.to_date')}</div>
        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal bg-white border-gray-200 hover:bg-gray-50 focus:border-orange-500 h-8 px-3 text-sm',
                !toDate && 'text-muted-foreground'
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {toDate ? format(toDate, 'dd/MM/yyyy', { locale: vi }) : t('training_progress.select_date')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
            <CalendarComponent
              mode="single"
              selected={toDate}
              onSelect={(date) => {
                setToDate(date);
                if (date) setToOpen(false);
              }}
              initialFocus
              locale={vi}
              className="bg-white border-0"
              disabled={(date) => (fromDate ? date < fromDate : false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button
        className="w-full sm:w-auto h-8"
        onClick={() =>
          onChange?.({
            from: formatDateForApi(fromDate),
            to: formatDateForApi(toDate)
          })
        }
      >
        {t('training_progress.apply')}
      </Button>
    </div>
  );
}

// ===== Photo modal =====
export function PhotoModal({
  open,
  onOpenChange,
  srcList,
  startIndex = 0
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  srcList: string[];
  startIndex?: number;
}) {
  const { t } = useTranslation();
  const [index, setIndex] = React.useState(startIndex);
  React.useEffect(() => setIndex(startIndex), [startIndex, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="font-medium">{t('training_progress.photo_modal_title')}</div>
          <div className="text-sm text-muted-foreground">
            {index + 1}/{srcList.length}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <img src={srcList[index]} alt="" className="max-h-[70vh] rounded-md" />
        </div>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
            {t('training_progress.previous')}
          </Button>
          <Button variant="outline" onClick={() => setIndex((i) => Math.min(srcList.length - 1, i + 1))}>
            {t('training_progress.next_photo')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== Log table =====
export function TrainingLogTable({
  data,
  page,
  totalPages,
  loading,
  onPageChange
}: {
  data: DisplayProgressEntry[];
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange?: (p: number) => void;
}) {
  const { t } = useTranslation();
  const [photoOpen, setPhotoOpen] = React.useState(false);
  const [photoList, setPhotoList] = React.useState<string[]>([]);
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-3">{t('training_progress.date')}</th>
              <th className="px-4 py-3">{t('training_progress.weight')}</th>
              <th className="px-4 py-3">{t('training_progress.bmi')}</th>
              <th className="px-4 py-3">{t('training_progress.strength')}</th>
              <th className="px-4 py-3">{t('training_progress.note')}</th>
              <th className="px-4 py-3">{t('training_progress.photos')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={6}>
                  {t('training_progress.loading')}
                </td>
              </tr>
            ) : !Array.isArray(data) || data.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                  {t('training_progress.no_logs')}
                </td>
              </tr>
            ) : (
              data.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{r.weightKg ? `${r.weightKg} kg` : '-'}</td>
                  <td className="px-4 py-3">{r.bmi ?? '-'}</td>
                  <td className="px-4 py-3">{r.strengthScore ?? '-'}</td>
                  <td className="px-4 py-3">{r.note ?? '-'}</td>
                  <td className="px-4 py-3">
                    {r.photos?.length ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPhotoList(r.photos || []);
                          setPhotoOpen(true);
                        }}
                      >
                        {t('training_progress.view_photos', { count: r.photos.length })}
                      </Button>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t p-3">
        <div className="text-xs text-muted-foreground">
          {t('training_progress.page')} {page}/{Math.max(1, totalPages)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange?.(Math.max(1, page - 1))}>
            {t('training_progress.prev')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}>
            {t('training_progress.next')}
          </Button>
        </div>
      </div>

      <PhotoModal open={photoOpen} onOpenChange={setPhotoOpen} srcList={photoList} />
    </Card>
  );
}

export function EmptyState() {
  const { t } = useTranslation();
  return <Card className="p-8 text-center text-muted-foreground">{t('training_progress.empty_state')}</Card>;
}
