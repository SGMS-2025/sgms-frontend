import React from 'react';
import type { LucideIcon } from 'lucide-react';

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
  const getCardClasses = (index: number) => {
    // First card has orange theme, rest are gray (matching Staff page style)
    if (index === 0) {
      return {
        container: 'border-orange-100 bg-[#FFF6EE]',
        title: 'text-orange-500',
        value: 'text-gray-900',
        icon: 'bg-white/70 text-orange-500',
        description: 'text-gray-500'
      };
    }

    return {
      container: 'border-gray-100 bg-gray-50',
      title: 'text-gray-600',
      value: 'text-gray-900',
      icon: 'bg-white text-gray-500',
      description: 'text-gray-500'
    };
  };

  return (
    <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const classes = getCardClasses(index);

        return (
          <div key={stat.key} className={`rounded-2xl border p-4 ${classes.container}`}>
            <div className={`text-xs font-semibold uppercase tracking-wide ${classes.title}`}>{stat.label}</div>
            <div className="mt-2 flex items-end justify-between">
              <div className={`text-3xl font-bold ${classes.value}`}>{stat.value}</div>
              <div className={`rounded-full p-2 ${classes.icon}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className={`mt-2 text-xs ${classes.description}`}>{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
};
