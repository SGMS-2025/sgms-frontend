import React, { useState, useEffect } from 'react';
import { useSocketConnection, useSocketActions } from '@/hooks/useSocket';
import { useTranslation } from 'react-i18next';
import { Bell, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { t } = useTranslation();
  const { connectionStatus, isLoading } = useSocketConnection();
  const { reconnect } = useSocketActions();

  const [isOpen, setIsOpen] = useState(false);

  // Auto-close after 5 seconds if no interaction
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleReconnect = async () => {
    const success = await reconnect();
    if (success) {
      toast.success('Reconnected successfully');
    } else {
      toast.error('Failed to reconnect');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
        disabled={isLoading}
      >
        <Bell className="h-5 w-5" />
        {/* Badge count will be handled by NotificationDropdown */}
      </Button>

      {/* Connection Status */}
      <div className="absolute -bottom-1 -right-1">{getConnectionIcon()}</div>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          {/* Connection Status */}
          {connectionStatus === 'error' && (
            <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  {t('notifications.error', 'Connection lost. Click reconnect to restore notifications.')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReconnect}
                  className="text-xs text-blue-600 hover:text-blue-700"
                  disabled={isLoading}
                >
                  <Wifi className="h-3 w-3 mr-1" />
                  {t('notifications.reconnect', 'Reconnect')}
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">{t('notifications.connecting', 'Connecting...')}</span>
              </div>
            </div>
          )}

          {/* Use NotificationDropdown as base */}
          <NotificationDropdown showBadge={false} onClose={handleClose} />
        </div>
      )}
    </div>
  );
};
