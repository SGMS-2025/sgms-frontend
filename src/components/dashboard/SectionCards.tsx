import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TotalRevenueCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-6 h-full shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600">Total Revenue</span>
        </div>
        <div className="flex items-center bg-orange-50 text-orange-500 rounded-full px-2 py-1">
          <TrendingUp className="w-3 h-3 mr-1" />
          <span className="text-xs font-medium">+12.5%</span>
        </div>
      </div>
      <div className="mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">$1,250.00</div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-orange-500 mb-1">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Trending up this month</span>
          </div>
          <div className="text-xs text-gray-500">Revenue for the last 6 months</div>
        </div>
      </div>
    </div>
  );
};

const NewCustomersCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-6 h-full shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600">New Customers</span>
        </div>
        <div className="flex items-center bg-red-50 text-red-500 rounded-full px-2 py-1">
          <TrendingDown className="w-3 h-3 mr-1" />
          <span className="text-xs font-medium">-20%</span>
        </div>
      </div>
      <div className="mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">1,234</div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-red-500 mb-1">
            <TrendingDown className="w-4 h-4 mr-1" />
            <span>Down 20% this period</span>
          </div>
          <div className="text-xs text-gray-500">Acquisition needs attention</div>
        </div>
      </div>
    </div>
  );
};

const ActiveAccountsCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-6 h-full shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600">Active Accounts</span>
        </div>
        <div className="flex items-center bg-green-50 text-green-500 rounded-full px-2 py-1">
          <TrendingUp className="w-3 h-3 mr-1" />
          <span className="text-xs font-medium">+12.5%</span>
        </div>
      </div>
      <div className="mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">45,678</div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-green-500 mb-1">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Strong user retention</span>
          </div>
          <div className="text-xs text-gray-500">Engagement exceed targets</div>
        </div>
      </div>
    </div>
  );
};

export const SectionCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <TotalRevenueCard />
      <NewCustomersCard />
      <ActiveAccountsCard />
    </div>
  );
};
