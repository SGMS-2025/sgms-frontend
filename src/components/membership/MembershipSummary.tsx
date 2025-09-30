import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type SummaryTone = 'primary' | 'success' | 'info' | 'muted';

interface SummaryStat {
  key: string;
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone: SummaryTone;
}

interface MembershipSummaryProps {
  stats: SummaryStat[];
}

export const MembershipSummary: React.FC<MembershipSummaryProps> = ({ stats }) => {
  const getToneClasses = (tone: SummaryTone) => {
    switch (tone) {
      case 'primary':
        return 'bg-orange-50 border-orange-200 text-orange-600';
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-600';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'muted':
      default:
        return 'bg-slate-50 border-slate-200 text-slate-500';
    }
  };

  return (
    <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const toneClasses = getToneClasses(stat.tone);

        return (
          <Card key={stat.key} className={`border ${toneClasses}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100/50">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-orange-700">{stat.label}</p>
                  <p className="text-2xl font-bold text-orange-800">{stat.value}</p>
                  <p className="text-xs text-orange-600 mt-1">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
