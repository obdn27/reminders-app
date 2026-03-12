import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const request = await Notifications.requestPermissionsAsync();
  return Boolean(request.granted || request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
}

export async function registerForPushToken() {
  // Expo Go has limitations for full push testing; dev build is recommended.
  if (!Device.isDevice) {
    return null;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) {
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data || null;
  } catch (error) {
    return null;
  }
}

export async function scheduleDebugLocalNotification({
  title = 'Discipline Sprint',
  body = 'Debug reminder fired.',
  secondsFromNow = 2,
} = {}) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsFromNow },
  });
}
