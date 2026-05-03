import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Set how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  async setupNotifications(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#632ce5',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    if (!Device.isDevice) {
      console.log('Running on emulator: Only local notifications will work.');
    }
    
    return true;
  }

  async scheduleDailyReminder() {
    // First, cancel all previously scheduled notifications to reset the timer
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule a new notification for 24 hours from now
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "We miss you! 👋",
        body: "It's been 24 hours since your last visit. Come back and continue learning!",
      },
      trigger: {
        seconds: 10, // 10 seconds for testing (previously 24h)
        repeats: false,
      },
    });
    
    console.log('[NotificationService] Scheduled 24h reminder');
  }

  async checkBookmarkMilestone(bookmarkCount: number) {
    if (bookmarkCount === 5) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Milestone Reached! 🎉",
          body: "You've bookmarked 5 courses! Ready to start learning?",
        },
        trigger: null, // Send immediately
      });
    }
  }
}

export default new NotificationService();
