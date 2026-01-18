import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Bell, BellOff, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// VAPID public key - generated for this app
const VAPID_PUBLIC_KEY = 'BLBz-YrPwIVMJzGlh3E8MHZdVJKYMfXnSNQCxP9KvzSrYfC4GnRU8TqPZDwWYrGDfKqT7QkNzVpAZyJjHmWpvvE';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      // Check current permission
      setPermission(Notification.permission);
      
      // Check if already subscribed
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribe = async () => {
    setLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        toast.error('Bildirim izni reddedildi');
        return false;
      }

      // Register service worker if not already registered
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send subscription to backend
      const token = localStorage.getItem('kasaburger_token');
      const response = await fetch(`${BACKEND_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(subscription.toJSON())
      });

      if (response.ok) {
        setIsSubscribed(true);
        toast.success('Bildirimler aktif edildi!');
        return true;
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      toast.error('Bildirim kaydı başarısız');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Remove from backend
        const token = localStorage.getItem('kasaburger_token');
        await fetch(`${BACKEND_URL}/api/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }

      setIsSubscribed(false);
      toast.success('Bildirimler kapatıldı');
      return true;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error('İşlem başarısız');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    if (isSubscribed) {
      return await unsubscribe();
    } else {
      return await subscribe();
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    toggle
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// UI Component
export default function PushNotificationSettings() {
  const { isSupported, isSubscribed, permission, loading, toggle } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="bg-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-zinc-500" />
          <div>
            <p className="font-medium text-zinc-400">Push Bildirimleri</p>
            <p className="text-xs text-zinc-500">Bu tarayıcı push bildirimleri desteklemiyor</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-green-400" />
          ) : (
            <BellOff className="h-5 w-5 text-zinc-500" />
          )}
          <div>
            <p className="font-medium">Push Bildirimleri</p>
            <p className="text-xs text-zinc-500">
              {isSubscribed 
                ? 'Yeni siparişler için bildirim alacaksınız' 
                : 'Bildirimleri etkinleştirin'}
            </p>
          </div>
        </div>
        <Switch 
          checked={isSubscribed} 
          onCheckedChange={toggle}
          disabled={loading}
        />
      </div>
      
      {permission === 'denied' && (
        <div className="mt-3 bg-red-500/20 border border-red-500/50 rounded p-2 text-xs text-red-400">
          <XCircle className="h-4 w-4 inline mr-1" />
          Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.
        </div>
      )}
    </div>
  );
}

// Compact toggle button for headers
export function PushNotificationToggle() {
  const { isSupported, isSubscribed, loading, toggle } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      disabled={loading}
      className={isSubscribed ? 'text-green-400' : 'text-zinc-500'}
      title={isSubscribed ? 'Bildirimler Açık' : 'Bildirimler Kapalı'}
    >
      {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
    </Button>
  );
}
