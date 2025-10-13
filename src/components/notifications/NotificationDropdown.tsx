import { Bell, Calendar, ExternalLink } from 'lucide-react';
import { useSocketNotifications } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Notification } from '@/contexts/SocketContext';
import type { WorkShiftNotificationData } from '@/types/api/NotificationWorkShift';

interface NotificationDropdownProps {
  showBadge?: boolean;
  className?: string;
  onClose?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  showBadge = true,
  className = '',
  onClose
}) => {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useSocketNotifications();
  const navigate = useNavigate();

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAllNotifications();
  };

  const handleViewWorkShift = (workShiftId?: string) => {
    console.log('Navigating to workshift calendar with ID:', workShiftId);

    // Navigate to workshift calendar page
    if (workShiftId && workShiftId !== 'undefined') {
      navigate(`/manage/workshifts/calendar?highlight=${workShiftId}`);
    } else {
      console.log('No workShiftId found, navigating to general calendar');
      navigate('/manage/workshifts/calendar');
    }

    // Close dropdown if onClose is provided
    if (onClose) {
      onClose();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log('Notification clicked:', notification);
    console.log('Notification type:', notification.type);
    console.log('Notification data:', notification.data);
    console.log('Has workShiftId:', notification.data?.workShiftId);

    // Always mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Check if it's a workshift notification by multiple criteria
    const workShiftData = notification.data as WorkShiftNotificationData;
    const isWorkShiftNotification =
      notification.type === 'WORKSHIFT_CREATED' ||
      workShiftData?.workShiftId ||
      notification.title?.includes('Work Shift') ||
      notification.message?.includes('work shift') ||
      notification.message?.includes('Work Shift');

    console.log('Is workshift notification:', isWorkShiftNotification);

    if (isWorkShiftNotification) {
      handleViewWorkShift(workShiftData?.workShiftId);
    }
  };

  return (
    <div className={`max-h-96 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="font-medium">{t('notifications.title', 'Notifications')}</span>
          {showBadge && unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-6 px-2 text-xs">
              {t('notifications.mark_all_read', 'Mark all read')}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
            >
              {t('notifications.clear_all', 'Clear all')}
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List - Scrollable Area */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">{t('notifications.no_notifications', 'No notifications')}</p>
            <p className="text-xs mt-2 text-gray-400">
              {t('notifications.no_notifications_description', "You're all caught up! No new notifications.")}
            </p>
          </div>
        ) : (
          <div className="p-4 pt-6 space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-all duration-200 rounded-lg cursor-pointer ${
                  !notification.read
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-sm'
                    : 'bg-white hover:shadow-sm border border-gray-100'
                }`}
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{notification.title}</h4>
                      {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>

                    {/* Display additional work shift details */}
                    {(notification.data as WorkShiftNotificationData)?.workShiftId && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="space-y-2">
                          {/* Time Range */}
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-900">Time:</span>
                            <span className="text-sm text-blue-800 font-semibold">
                              {(notification.data as WorkShiftNotificationData).formattedStartTime ||
                                ((notification.data as WorkShiftNotificationData).startTime &&
                                  new Date(
                                    (notification.data as WorkShiftNotificationData).startTime!
                                  ).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  }))}{' '}
                              -{' '}
                              {(notification.data as WorkShiftNotificationData).formattedEndTime ||
                                ((notification.data as WorkShiftNotificationData).endTime &&
                                  new Date(
                                    (notification.data as WorkShiftNotificationData).endTime!
                                  ).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  }))}
                            </span>
                          </div>

                          {/* Day */}
                          {(notification.data as WorkShiftNotificationData).dayOfTheWeek && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-900">Day:</span>
                              <span className="text-sm text-green-800 font-semibold">
                                {(notification.data as WorkShiftNotificationData).dayOfTheWeek}
                              </span>
                            </div>
                          )}

                          {/* Assigned By */}
                          {(notification.data as WorkShiftNotificationData).assignedBy && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-sm font-medium text-purple-900">Assigned by:</span>
                              <span className="text-sm text-purple-800 font-semibold">
                                {(notification.data as WorkShiftNotificationData).assignedBy}
                              </span>
                            </div>
                          )}

                          {/* Branch */}
                          {(notification.data as WorkShiftNotificationData).branchName && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="text-sm font-medium text-orange-900">Branch:</span>
                              <span className="text-sm text-orange-800 font-semibold">
                                {(notification.data as WorkShiftNotificationData).branchName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-1">{new Date(notification.timestamp).toLocaleString()}</p>

                    {/* Action buttons for workshift notifications */}
                    {(notification.type === 'WORKSHIFT_CREATED' ||
                      (notification.data as WorkShiftNotificationData)?.workShiftId ||
                      notification.title?.includes('Work Shift') ||
                      notification.message?.includes('work shift') ||
                      notification.message?.includes('Work Shift')) && (
                      <div className="flex gap-1 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Button clicked for notification:', notification);
                            console.log(
                              'Button workShiftId:',
                              (notification.data as WorkShiftNotificationData)?.workShiftId
                            );
                            handleViewWorkShift((notification.data as WorkShiftNotificationData)?.workShiftId);
                          }}
                          className="h-6 px-2 text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          title="View Work Shift Calendar"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          View Schedule
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                        {(notification.data as WorkShiftNotificationData)?.branchName && (
                          <Badge variant="secondary" className="text-xs">
                            {(notification.data as WorkShiftNotificationData).branchName}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
