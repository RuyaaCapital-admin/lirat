
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Notification } from '@/api/entities';
import { useAuth } from './useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTheme } from './ui/Theme';
import { toast } from 'sonner';

export default function NotificationBell() {
    const { user } = useAuth();
    const { language, t } = useTheme();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const lastNotificationIds = useRef(new Set());

    const getAlertIcon = useCallback((notification) => {
        const type = notification.notification_type;
        const metadata = notification.metadata || {};
        
        if (type === 'price_alert') {
            if (metadata.alertType === 'crossesAbove') {
                return <TrendingUp className="w-4 h-4 text-green-600" />;
            }
            if (metadata.alertType === 'crossesBelow') {
                return <TrendingDown className="w-4 h-4 text-red-600" />;
            }
            return <TrendingUp className="w-4 h-4 text-blue-600" />; // Fallback for price_alert
        }
        
        if (type === 'event_alert') {
            return <Calendar className="w-4 h-4 text-purple-600" />;
        }
        
        // Fallback for unexpected types
        return <Bell className="w-4 h-4 text-gray-500" />;
    }, []);

    const getAlertSummary = useCallback((notification) => {
        return notification.message;
    }, []);
    
    const fetchNotifications = useCallback(async () => {
        if (!user || !user.email) {
            setNotifications([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            // ONLY fetch ALERT notifications (price_alert, event_alert) that are unread
            const unreadNotifications = await Notification.filter({ 
                user_email: user.email, 
                is_read: false,
                notification_type: ['price_alert', 'event_alert'] 
            }, '-created_date', 15);
            
            const fetchedNotificationIds = new Set(unreadNotifications.map(n => n.id));
            
            // Identify genuinely new notifications that we haven't seen in the UI yet
            const justArrived = unreadNotifications.filter(n => !lastNotificationIds.current.has(n.id));

            if (justArrived.length > 0) {
                // Play sound once for the batch of new notifications
                if (window.playNotificationSound) window.playNotificationSound();
                
                // Show a toast for each new notification
                justArrived.forEach(n => {
                    toast(n.title, {
                      description: n.message,
                      icon: getAlertIcon(n),
                    });
                });
            }
            
            setNotifications(unreadNotifications);
            // Update the set of known notification IDs for the next fetch
            lastNotificationIds.current = fetchedNotificationIds;

        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, getAlertIcon]);

    useEffect(() => {
        fetchNotifications();
        
        // Poll for new alert notifications every 15 seconds
        const interval = setInterval(fetchNotifications, 15000);

        return () => {
            clearInterval(interval);
        };
    }, [fetchNotifications]);

    // Function to mark a single notification as read
    const markNotificationAsRead = useCallback(async (notificationId) => {
        if (!user || !user.email) return;
        try {
            await Notification.update(notificationId, { is_read: true, user_email: user.email });
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            console.log(`📖 Marked notification ${notificationId} as read.`);
        } catch (error) {
            console.error(`Failed to mark notification ${notificationId} as read:`, error);
        }
    }, [user]);

    // Helper to create page URLs (replace with actual router logic if available)
    const createPageUrl = useCallback((pageName) => {
        switch (pageName) {
            case 'Alerts':
                return '/alerts'; // Assuming /alerts is the path for the Alerts page
            default:
                return '/';
        }
    }, []);

    const handleNotificationClick = useCallback((notification) => {
        markNotificationAsRead(notification.id);
        
        // Navigate based on notification type
        if (notification.notification_type === 'price_alert' || notification.notification_type === 'event_alert') {
          // Scroll to alerts system on current page or navigate to Alerts page
          const alertsElement = document.getElementById('alerts-system-card');
          if (alertsElement) {
            alertsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            // Navigate to Alerts page
            window.location.href = createPageUrl('Alerts');
          }
        }
        
        setIsOpen(false); // Close the popover/dropdown
    }, [markNotificationAsRead, createPageUrl]);

    const handleOpenChange = async (open) => {
        setIsOpen(open);
        if (open && notifications.length > 0) {
            // When opening, mark all alert notifications as read after a delay
            setTimeout(async () => {
                const idsToUpdate = notifications.map(n => n.id);
                try {
                    console.log('📖 Marking notifications as read:', idsToUpdate.length);
                    await Promise.all(idsToUpdate.map(id => 
                        Notification.update(id, { 
                            is_read: true, 
                            user_email: user.email
                        })
                    ));
                    // Clear from UI
                    setNotifications([]);
                    // Let the AlertsSystem know that the user has seen the triggers
                    window.dispatchEvent(new CustomEvent('alerts-acknowledged'));
                } catch (error) {
                    console.error("Failed to mark notifications as read:", error);
                }
            }, 2000);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button
                    className="neumorphic-button p-3 rounded-xl flex items-center gap-2 relative"
                    title={t?.alertNotifications || (language === 'ar' ? 'تنبيهات التداول' : 'Trading Alerts')}
                >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center text-white text-xs font-bold">
                                {notifications.length > 9 ? '9+' : notifications.length}
                            </span>
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 neumorphic p-0 border-none" align={language === 'ar' ? 'start' : 'end'}>
                <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <h4 className="font-semibold text-primary">
                        {t?.alertNotifications || (language === 'ar' ? 'تنبيهات التداول' : 'Trading Alerts')}
                    </h4>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-secondary">
                            <div className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full mx-auto mb-2" style={{ borderColor: '#7cb342', borderTopColor: 'transparent' }}></div>
                            {t?.loading || (language === 'ar' ? 'جاري التحميل...' : 'Loading...')}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-secondary">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                            <p>{t?.noAlertNotifications || (language === 'ar' ? 'لا توجد تنبيهات جديدة' : 'No new alerts')}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                            {notifications.map(notification => (
                                <div 
                                    key={notification.id} 
                                    className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800/50 flex items-start gap-3 cursor-pointer"
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    {getAlertIcon(notification)}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-primary truncate">{notification.title}</p>
                                        <p className="text-sm text-secondary mb-1">{getAlertSummary(notification)}</p>
                                        <p className="text-xs text-muted" title={new Date(notification.created_date).toLocaleString()}>
                                            {formatDistanceToNow(new Date(notification.created_date), { 
                                                addSuffix: true, 
                                                locale: language === 'ar' ? ar : undefined 
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

