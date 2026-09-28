import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import api from './api';

// Expo Go (StoreClient) does not support remote push notifications in SDK 51+
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

let Notifications = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    console.log('Error initializing notification handler:', err?.message);
  }
}

export async function registerForPushNotificationsAsync() {
  if (isExpoGo) {
    console.log('[Push] Push notifications are not supported in Expo Go. Use a development build or APK.');
    return null;
  }

  try {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'f1c2a6b5-b92d-4cd5-a58a-a4322d7f2b1e';
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Expo Push Token:", token);
      return token;
    } else {
      console.log('Must use physical device for Push Notifications');
      return null;
    }
  } catch (err) {
    console.log('Error registering push notifications:', err?.message);
    return null;
  }
}

export async function savePushTokenToBackend(token) {
  if (!token) return;
  try {
    await api.put('/auth/profile', { expoPushToken: token });
    console.log('Push token saved to backend');
  } catch (error) {
    console.log('Error saving push token', error);
  }
}
