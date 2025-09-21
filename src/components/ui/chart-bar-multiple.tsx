'use client';

import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export const description = 'A multiple bar chart';

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 }
];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: '#f97316'
  },
  mobile: {
    label: 'Mobile',
    color: '#fdba74'
  }
} satisfies ChartConfig;

export function ChartBarMultiple() {
  return (
    <Card className="bg-white border-gray-200 shadow-md flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base text-gray-900">Revenue Chart</CardTitle>
            <CardDescription className="text-sm text-gray-600">January - June 2024</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: chartConfig.desktop.color }}></div>
              <span className="text-xs text-gray-600">Desktop</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: chartConfig.mobile.color }}></div>
              <span className="text-xs text-gray-600">Mobile</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="relative w-full h-[280px] md:h-[300px] xl:h-[340px]">
          <ChartContainer config={chartConfig} className="h-full w-full !aspect-auto">
            <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                fontSize={12}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <Bar dataKey="desktop" fill={chartConfig.desktop.color} radius={[3, 3, 0, 0]} />
              <Bar dataKey="mobile" fill={chartConfig.mobile.color} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="pt-3 text-sm flex-shrink-0">
        <div className="flex gap-2 leading-none font-medium text-orange-500">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  );
}
