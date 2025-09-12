import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Users, Dumbbell, Calendar, Percent, User, Grid3X3, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  opacity?: number;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive = false, opacity = 1, onClick }) => {
  return (
    <div
      className={`text-white text-center cursor-pointer transition-all duration-300 hover:scale-105 w-[79px] h-[59px] flex flex-col items-center justify-center gap-1 ${
        isActive ? 'bg-white/10 rounded-lg' : 'hover:bg-white/5 rounded-lg'
      }`}
      style={{ opacity }}
      onClick={onClick}
    >
      <div className="w-6 h-6">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
};

export const OwnerSidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarItems = [
    {
      icon: <Grid3X3 className="w-6 h-6" />,
      label: t('sidebar.dashboard'),
      isActive: location.pathname === '/manage/owner',
      opacity: 1,
      onClick: () => navigate('/manage/owner')
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: t('sidebar.users'),
      isActive: location.pathname === '/manage/staff',
      opacity: 1,
      onClick: () => navigate('/manage/staff')
    },
    {
      icon: <Dumbbell className="w-6 h-6" />,
      label: t('sidebar.equipment'),
      opacity: 1,
      onClick: () => console.log('Thiết bị clicked')
    },
    {
      icon: <Percent className="w-6 h-6" />,
      label: t('sidebar.services_promotions'),
      opacity: 1,
      onClick: () => console.log('Dịch vụ & Khuyến mãi clicked')
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      label: t('sidebar.finance'),
      opacity: 1,
      onClick: () => console.log('Tài chính clicked')
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      label: t('sidebar.work_schedule'),
      opacity: 1,
      onClick: () => console.log('Lịch làm việc clicked')
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      label: t('sidebar.feedback'),
      opacity: 1,
      onClick: () => console.log('Phản hồi clicked')
    },
    {
      icon: <User className="w-6 h-6" />,
      label: t('sidebar.account'),
      opacity: 1,
      onClick: () => navigate('/profile')
    }
  ];

  return (
    <div className="w-[100px] bg-[#f05a29] flex flex-col items-center py-4 space-y-4 min-h-screen rounded-r-[20px]">
      {sidebarItems.map((item, index) => (
        <SidebarItem
          key={index}
          icon={item.icon}
          label={item.label}
          isActive={item.isActive}
          opacity={item.opacity}
          onClick={item.onClick}
        />
      ))}
    </div>
  );
};
