import React from 'react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import type { ProfileUserData, User as ApiUser } from '@/types/api/User';

interface StatCard {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  badgeClass?: string;
}

interface ProfileTopSectionProps {
  userData: ProfileUserData;
  profile: ApiUser | null;
  isUploading: boolean;
  setIsUploading: (val: boolean) => void;
  setUserData: React.Dispatch<React.SetStateAction<ProfileUserData>>;
  setShowDeleteDialog: (val: boolean) => void;
  statCards: StatCard[];
}

export const ProfileTopSection: React.FC<ProfileTopSectionProps> = ({
  userData,
  profile,
  isUploading,
  setIsUploading,
  setUserData,
  setShowDeleteDialog,
  statCards
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <ProfileHeader
        userData={userData}
        userRole={profile?.role}
        username={profile?.username}
        isUploading={isUploading}
        setIsUploading={setIsUploading}
        setUserData={setUserData}
        setShowDeleteDialog={setShowDeleteDialog}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-br from-orange-50/70 to-white">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Icon className="w-5 h-5" />
                </div>
                {card.badgeClass && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${card.badgeClass}`}>
                    {card.value}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-3">{card.title}</p>
              {!card.badgeClass && <p className="text-lg font-semibold text-gray-900 mt-1">{card.value}</p>}
              <p className="text-xs text-gray-400 mt-1">{card.hint}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
