import { useEffect } from 'react';
import { useEventStore } from '../stores/useEventStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { getDaysUntil } from '../utils/formatters';

export function useNotifications() {
  const { events } = useEventStore();
  const { settings } = useSettingsStore();

  const checkAndNotify = async () => {
    if (!settings.notifications.enabled) return;

    const reminderDays = settings.notifications.defaultReminderDays;

    for (const event of events) {
      const daysUntil = getDaysUntil(event.date);
      if (daysUntil < 0 || daysUntil > reminderDays) continue;

      let message = '';
      if (daysUntil === 0) message = `📅 ${event.title} is today!`;
      else if (daysUntil === 1) message = `⏰ ${event.title} is tomorrow!`;
      else message = `🔔 ${event.title} is in ${daysUntil} days`;

      try {
        const { isPermissionGranted, requestPermission, sendNotification } =
          await import('@tauri-apps/plugin-notification');

        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
          const permission = await requestPermission();
          permissionGranted = permission === 'granted';
        }

        if (permissionGranted) {
          sendNotification({
            title: 'BudgetFlow Reminder',
            body: message,
          });
        }
      } catch {
        // Notification API not available (dev browser mode)
        console.log('[Notification]', message);
      }
    }
  };

  useEffect(() => {
    // Check on load
    const timer = setTimeout(checkAndNotify, 2000);
    // Check every hour
    const interval = setInterval(checkAndNotify, 60 * 60 * 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [events, settings.notifications]);
}
