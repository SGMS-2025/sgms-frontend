import React from 'react';
import { Calculator } from 'lucide-react';
import { calculateBMI, getBMICategory } from '@/utils/progressUtils';
import type { BMIDisplayProps } from '@/types/components/pt/Progress';

export const BMIDisplay: React.FC<BMIDisplayProps> = ({ weight, height }) => {
  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);
  const bmi = calculateBMI(weightNum, heightNum);

  if (!weight || !height || bmi === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F05A29] bg-opacity-10 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-[#F05A29]" />
          </div>
          <span className="text-sm font-medium text-gray-700">BMI Calculator</span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#101D33]">{bmi.toFixed(1)}</p>
          <p className="text-xs text-gray-500">{getBMICategory(bmi)}</p>
        </div>
      </div>
    </div>
  );
};
