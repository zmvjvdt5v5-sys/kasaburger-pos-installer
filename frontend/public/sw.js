// KasaBurger Push Notification Service Worker
const CACHE_NAME = 'kasaburger-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let data = {
    title: 'KasaBurger',
    body: 'Yeni bildirim',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'kasaburger-notification',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/logo192.png',
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Get click action
  const action = event.action;
  const data = event.notification.data || {};

  let targetUrl = '/';

  // Determine where to navigate based on notification type
  if (data.type === 'new_order') {
    targetUrl = '/kiosk-orders';
  } else if (data.type === 'delivery_order') {
    targetUrl = '/delivery-panel';
  } else if (data.type === 'low_stock') {
    targetUrl = '/materials';
  } else if (data.url) {
    targetUrl = data.url;
  }

  // Handle action buttons
  if (action === 'view') {
    targetUrl = data.url || targetUrl;
  } else if (action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Background sync for offline orders
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Implement offline order sync if needed
  console.log('Syncing orders...');
}
