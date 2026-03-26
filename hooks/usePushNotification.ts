import { useEffect, useState } from 'react';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';

export const usePushNotification = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);

  const requestPermission = async () => {
    try {
      const { receive } = await FirebaseMessaging.requestPermissions();
      if (receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  const getToken = async () => {
    try {
      const { token } = await FirebaseMessaging.getToken();
      setFcmToken(token);
      console.log('FCM Token:', token);
      // TODO: Kirim token ini ke server/simpan ke Firestore untuk user yang sedang login
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      // Hanya jalankan di perangkat native (Android/iOS)
      if (!Capacitor.isNativePlatform()) return;

      const granted = await requestPermission();
      if (granted) await getToken();
    };

    init();

    // Listener: notifikasi saat app foreground
    FirebaseMessaging.addListener('notificationReceived', (event) => {
      console.log('Notification received (foreground):', event.notification);
      setNotification(event.notification);
    });

    // Listener: user tap notifikasi
    FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      console.log('Notification tapped:', event.notification);
      // Tambahkan navigasi di sini berdasarkan event.notification.data
      // Contoh: if (event.notification.data.route) navigate(event.notification.data.route);
    });

    return () => {
      FirebaseMessaging.removeAllListeners();
    };
  }, []);

  return { fcmToken, notification };
};
