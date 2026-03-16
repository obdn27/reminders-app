import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { parseReminderTimeParts } from '../data/reminderTimes';

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

function getAnchorReminderCopy(anchor, { retentionState = 'steady' } = {}) {
  const anchorLabel = anchor.label || anchor.title;
  if (retentionState === 'drifting') {
    return {
      title: `Ready to restart ${anchorLabel}?`,
      body: "Let's restart with a short session today.",
    };
  }
  switch (anchor.anchorType) {
    case 'deep_work':
      return { title: `Time for ${anchorLabel}.`, body: 'Protect one focused block.' };
    case 'upskilling':
      return { title: `${anchorLabel} reminder.`, body: 'Keep the learning anchor alive today.' };
    case 'movement':
      return { title: `Time for ${anchorLabel}.`, body: 'A short movement block is enough to keep the anchor alive.' };
    case 'job_applications':
      return { title: `${anchorLabel} reminder.`, body: 'Clear at least one application block today.' };
    case 'chores_admin':
      return { title: `${anchorLabel} reminder.`, body: 'Clear one practical task before it piles up.' };
    case 'meals_cooking':
      return { title: `${anchorLabel} reminder.`, body: 'Take care of the food anchor today.' };
    default:
      return { title: `${anchorLabel} reminder.`, body: 'Check back into this anchor today.' };
  }
}

async function cancelExistingAnchorNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content?.data?.kind === 'anchor_reminder')
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );
}

export async function syncAnchorReminderNotifications(input = []) {
  const options = Array.isArray(input) ? { anchors: input } : input;
  const anchors = options.anchors || [];
  const todayAnchors = options.todayAnchors || [];
  const activeSession = options.activeSession || null;
  const retentionState = options.retentionState || 'steady';
  const settings = await Notifications.getPermissionsAsync();
  const granted =
    settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted) {
    return [];
  }

  await cancelExistingAnchorNotifications();

  const progressByCategory = Object.fromEntries(
    todayAnchors.map((anchor) => [anchor.category || anchor.anchorType, anchor])
  );
  const activeAnchors = anchors.filter((anchor) => {
    if (anchor.active === false || !anchor.reminderTime) {
      return false;
    }

    const progress = progressByCategory[anchor.category || anchor.anchorType];
    if (progress?.completed) {
      return false;
    }

    if (progress?.trackingType === 'session' && progress.progressValue > 0) {
      return false;
    }

    if (activeSession?.anchorType && activeSession.anchorType === (anchor.category || anchor.anchorType)) {
      return false;
    }

    return true;
  });
  const scheduledIds = [];

  for (const anchor of activeAnchors) {
    const { hour, minute, second } = parseReminderTimeParts(anchor.reminderTime);
    const copy = getAnchorReminderCopy(anchor, { retentionState });

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        data: {
          kind: 'anchor_reminder',
          anchorType: anchor.anchorType,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        second,
        repeats: true,
      },
    });
    scheduledIds.push(identifier);
  }

  return scheduledIds;
}
