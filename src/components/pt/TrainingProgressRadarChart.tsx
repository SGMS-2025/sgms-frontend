import React from 'react';
import { useTranslation } from 'react-i18next';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TrainingProgressDisplay } from '@/types/api/TrainingProgress';

interface RadarChartDataPoint {
  metric: string;
  current: number;
  previous: number;
  fullMark: number;
}

interface TrainingProgressRadarChartProps {
  currentData?: TrainingProgressDisplay | null;
  previousData?: TrainingProgressDisplay | null;
}

// Normalize values to a 0-100 scale for better radar chart visualization
const normalizeValue = (value: number, min: number, max: number): number => {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
};

// Weight: normalized scale (40-150kg → 0-100)
const normalizeWeight = (weight: number): number => normalizeValue(weight, 40, 150);

// BMI: normalized scale - optimal is 18.5-25
const normalizeBMI = (bmi: number): number => {
  if (bmi >= 18.5 && bmi <= 25) {
    return 100;
  } else if (bmi < 18.5) {
    return normalizeValue(bmi, 10, 18.5);
  } else {
    return Math.max(0, 100 - normalizeValue(bmi, 25, 40) * 1.5);
  }
};

// Strength: normalized scale (0-100 → 0-100)
const normalizeStrength = (strength: number): number => normalizeValue(strength, 0, 100);

// Body Fat: lower is better (inverted)
const normalizeBodyFat = (bodyFat: number): number => {
  return Math.max(0, 100 - normalizeValue(bodyFat, 5, 50) * 1.5);
};

// Muscle Mass: higher is better (30-60% range)
const normalizeMuscleMass = (muscleMass: number): number => normalizeValue(muscleMass, 20, 60);

// Body Water: optimal is 50-65%
const normalizeBodyWater = (bodyWater: number): number => {
  if (bodyWater >= 50 && bodyWater <= 65) return 100;
  if (bodyWater < 50) return normalizeValue(bodyWater, 30, 50);
  return Math.max(0, 100 - normalizeValue(bodyWater, 65, 80));
};

// Circumference measurements (chest, waist, hips, arms, thighs)
// These are normalized differently - just show relative values
const normalizeCircumference = (value: number, min: number, max: number): number => {
  return normalizeValue(value, min, max);
};

export const TrainingProgressRadarChart: React.FC<TrainingProgressRadarChartProps> = ({
  currentData,
  previousData
}) => {
  const { t } = useTranslation();
  const [chartView, setChartView] = React.useState<'basic' | 'measurements'>('basic');
  const hasBaseline = Boolean(previousData);

  // Basic metrics chart data
  const basicChartData = React.useMemo((): RadarChartDataPoint[] => {
    const current = currentData;
    const previous = previousData;

    return [
      {
        metric: t('radar_chart.weight', 'Cân nặng'),
        current: current?.weight ? normalizeWeight(current.weight) : 0,
        previous: previous?.weight ? normalizeWeight(previous.weight) : 50,
        fullMark: 100
      },
      {
        metric: t('radar_chart.bmi', 'BMI'),
        current: current?.bmi ? normalizeBMI(current.bmi) : 0,
        previous: previous?.bmi ? normalizeBMI(previous.bmi) : 100,
        fullMark: 100
      },
      {
        metric: t('radar_chart.strength', 'Sức mạnh'),
        current: current?.strength ? normalizeStrength(current.strength) : 0,
        previous: previous?.strength ? normalizeStrength(previous.strength) : 50,
        fullMark: 100
      },
      {
        metric: t('radar_chart.body_fat', 'Mỡ cơ thể'),
        current: current?.bodyFatPercentage ? normalizeBodyFat(current.bodyFatPercentage) : 50,
        previous: previous?.bodyFatPercentage ? normalizeBodyFat(previous.bodyFatPercentage) : 50,
        fullMark: 100
      },
      {
        metric: t('radar_chart.muscle_mass', '% Cơ bắp'),
        current: current?.muscleMassPercentage ? normalizeMuscleMass(current.muscleMassPercentage) : 50,
        previous: previous?.muscleMassPercentage ? normalizeMuscleMass(previous.muscleMassPercentage) : 50,
        fullMark: 100
      },
      {
        metric: t('radar_chart.body_water', '% Nước'),
        current: current?.bodyWaterPercentage ? normalizeBodyWater(current.bodyWaterPercentage) : 50,
        previous: previous?.bodyWaterPercentage ? normalizeBodyWater(previous.bodyWaterPercentage) : 50,
        fullMark: 100
      }
    ];
  }, [currentData, previousData, t]);

  // Body measurements chart data
  const measurementsChartData = React.useMemo((): RadarChartDataPoint[] => {
    const current = currentData;
    const previous = previousData;

    return [
      {
        metric: t('radar_chart.chest', 'Ngực'),
        current: current?.chest ? normalizeCircumference(current.chest, 70, 130) : 0,
        previous: previous?.chest ? normalizeCircumference(previous.chest, 70, 130) : 50,
        fullMark: 100
      },
      {
        metric: t('radar_chart.waist', 'Eo'),
        current: current?.waist ? normalizeCircumference(current.waist, 50, 120) : 0,
        previous: previous?.waist ? normalizeCircumference(previous.waist, 50, 120) : 50,
        fullMark: 100
      },
      {
        metric: t('radar_chart.hips', 'Mông'),
        current: current?.hips ? normalizeCircumference(current.hips, 70, 130) : 0,
        previous: previous?.hips ? normalizeCircumference(previous.hips, 70, 130) : 50,
        fullMark: 100
      },
      {
        metric: t('radar_chart.arms', 'Tay'),
        current: current?.arms ? normalizeCircumference(current.arms, 20, 50) : 0,
        previous: previous?.arms ? normalizeCircumference(previous.arms, 20, 50) : 50,
        fullMark: 100
      },
      {
        metric: t('radar_chart.thighs', 'Đùi'),
        current: current?.thighs ? normalizeCircumference(current.thighs, 40, 80) : 0,
        previous: previous?.thighs ? normalizeCircumference(previous.thighs, 40, 80) : 50,
        fullMark: 100
      }
    ];
  }, [currentData, previousData, t]);

  const chartData = chartView === 'basic' ? basicChartData : measurementsChartData;

  // Get actual values for display
  const basicValues = React.useMemo(
    () => ({
      weight: currentData?.weight ? `${currentData.weight} kg` : '--',
      bmi: currentData?.bmi?.toFixed(1) || '--',
      strength: currentData?.strength ?? '--',
      bodyFat: currentData?.bodyFatPercentage ? `${currentData.bodyFatPercentage}%` : '--',
      muscleMass: currentData?.muscleMassPercentage ? `${currentData.muscleMassPercentage}%` : '--',
      bodyWater: currentData?.bodyWaterPercentage ? `${currentData.bodyWaterPercentage}%` : '--',
      metabolicAge: currentData?.metabolicAge ?? '--'
    }),
    [currentData]
  );

  const measurementValues = React.useMemo(
    () => ({
      chest: currentData?.chest ? `${currentData.chest} cm` : '--',
      waist: currentData?.waist ? `${currentData.waist} cm` : '--',
      hips: currentData?.hips ? `${currentData.hips} cm` : '--',
      arms: currentData?.arms ? `${currentData.arms} cm` : '--',
      thighs: currentData?.thighs ? `${currentData.thighs} cm` : '--'
    }),
    [currentData]
  );

  const hasData = currentData && (currentData.weight || currentData.bmi || currentData.strength);
  const hasMeasurements =
    currentData &&
    (currentData.chest || currentData.waist || currentData.hips || currentData.arms || currentData.thighs);

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="items-center pb-4">
          <CardTitle className="text-xl font-bold text-[#101D33]">
            {t('radar_chart.title', 'Biểu đồ Radar - Chỉ số cơ thể')}
          </CardTitle>
          <CardDescription>{t('radar_chart.no_data', 'Chưa có dữ liệu để hiển thị')}</CardDescription>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            {t('radar_chart.add_progress', 'Thêm dữ liệu tiến trình để xem biểu đồ')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4 gap-3">
        <CardTitle className="text-xl font-bold text-[#101D33]">
          {t('radar_chart.title', 'Biểu đồ Radar - Chỉ số cơ thể')}
        </CardTitle>
        <CardDescription>{t('radar_chart.description', 'So sánh các chỉ số thể chất theo thời gian')}</CardDescription>

        {/* View Toggle */}
        {hasMeasurements && (
          <Tabs
            value={chartView}
            onValueChange={(v) => setChartView(v as 'basic' | 'measurements')}
            className="w-full gap-0"
          >
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-full bg-slate-100 p-1 shadow-inner">
              <TabsTrigger
                value="basic"
                className="h-full rounded-full text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#101D33] data-[state=active]:shadow-sm text-slate-600"
              >
                {t('radar_chart.basic_tab', 'Cơ bản')}
              </TabsTrigger>
              <TabsTrigger
                value="measurements"
                className="h-full rounded-full text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#101D33] data-[state=active]:shadow-sm text-slate-600"
              >
                {t('radar_chart.measurements_tab', 'Số đo')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <div className="mx-auto aspect-square max-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#6B7280' }} />
              {hasBaseline && (
                <Radar
                  name={t('radar_chart.first', 'Lần đầu')}
                  dataKey="previous"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              )}
              <Radar
                name={t('radar_chart.current', 'Hiện tại')}
                dataKey="current"
                stroke="#F05A29"
                fill="#F05A29"
                fillOpacity={0.5}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#F05A29]" />
            <span>{t('radar_chart.current', 'Hiện tại')}</span>
          </div>
          {hasBaseline && (
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" />
              <span>{t('radar_chart.first', 'Lần đầu')}</span>
            </div>
          )}
        </div>

        {/* Actual Values Display */}
        {chartView === 'basic' ? (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">{t('radar_chart.weight', 'Cân nặng')}</div>
              <div className="text-sm font-semibold text-[#101D33]">{basicValues.weight}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">{t('radar_chart.bmi', 'BMI')}</div>
              <div className="text-sm font-semibold text-[#101D33]">{basicValues.bmi}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">{t('radar_chart.strength', 'Sức mạnh')}</div>
              <div className="text-sm font-semibold text-[#101D33]">{basicValues.strength}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">{t('radar_chart.body_fat', 'Mỡ')}</div>
              <div className="text-sm font-semibold text-[#101D33]">{basicValues.bodyFat}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">{t('radar_chart.muscle_mass', 'Cơ bắp')}</div>
              <div className="text-sm font-semibold text-[#101D33]">{basicValues.muscleMass}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">{t('radar_chart.body_water', 'Nước')}</div>
              <div className="text-sm font-semibold text-[#101D33]">{basicValues.bodyWater}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg col-span-2">
              <div className="text-xs text-muted-foreground">
                {t('radar_chart.metabolic_age', 'Tuổi trao đổi chất')}
              </div>
              <div className="text-sm font-semibold text-[#101D33]">{basicValues.metabolicAge}</div>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">{t('radar_chart.chest', 'Ngực')}</div>
              <div className="text-sm font-semibold text-[#101D33]">{measurementValues.chest}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">{t('radar_chart.waist', 'Eo')}</div>
              <div className="text-sm font-semibold text-[#101D33]">{measurementValues.waist}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">{t('radar_chart.hips', 'Mông')}</div>
              <div className="text-sm font-semibold text-[#101D33]">{measurementValues.hips}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">{t('radar_chart.arms', 'Tay')}</div>
              <div className="text-sm font-semibold text-[#101D33]">{measurementValues.arms}</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">{t('radar_chart.thighs', 'Đùi')}</div>
              <div className="text-sm font-semibold text-[#101D33]">{measurementValues.thighs}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingProgressRadarChart;
