/**
 * HoraMed Service Worker - Notificações e Alarmes
 * Handles push notifications, background sync, and scheduled alarms
 */

const CACHE_NAME = 'horamed-notifications-v1';
const NOTIFICATION_TAG_PREFIX = 'horamed-alarm-';

// IndexedDB for storing alarms
const DB_NAME = 'horamed-alarms';
const DB_VERSION = 1;
const STORE_NAME = 'alarms';

// Open IndexedDB
function openAlarmsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('scheduledAt', 'scheduledAt', { unique: false });
        store.createIndex('enabled', 'enabled', { unique: false });
      }
    };
  });
}

// Get all alarms from IndexedDB
async function getAlarms() {
  const db = await openAlarmsDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

// Save alarm to IndexedDB
async function saveAlarm(alarm) {
  const db = await openAlarmsDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(alarm);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Delete alarm from IndexedDB
async function deleteAlarm(id) {
  const db = await openAlarmsDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Check and trigger due alarms
async function checkAlarms() {
  try {
    const alarms = await getAlarms();
    const now = Date.now();
    
    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      
      const scheduledTime = new Date(alarm.scheduledAt).getTime();
      
      // If alarm is due (within 1 minute window)
      if (scheduledTime <= now && scheduledTime > now - 60000) {
        await showNotification(alarm);
        
        // Handle recurrence
        if (alarm.recurrence && alarm.recurrence !== 'once') {
          const nextTime = calculateNextOccurrence(alarm);
          alarm.scheduledAt = nextTime.toISOString();
          await saveAlarm(alarm);
        } else {
          // Disable one-time alarm after triggering
          alarm.enabled = false;
          alarm.lastTriggered = new Date().toISOString();
          await saveAlarm(alarm);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Error checking alarms:', error);
  }
}

// Calculate next occurrence for recurring alarms
function calculateNextOccurrence(alarm) {
  const current = new Date(alarm.scheduledAt);
  const next = new Date(current);
  
  switch (alarm.recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'hourly':
      next.setHours(next.getHours() + 1);
      break;
    default:
      break;
  }
  
  return next;
}

// Show notification
async function showNotification(alarm) {
  const options = {
    body: alarm.message || 'Lembrete do HoraMed',
    icon: '/icons/icon-192.png',
    badge: '/favicon.png',
    tag: NOTIFICATION_TAG_PREFIX + alarm.id,
    renotify: true,
    requireInteraction: alarm.requireInteraction !== false,
    silent: alarm.silent === true,
    vibrate: alarm.vibrate !== false ? [200, 100, 200] : undefined,
    data: {
      alarmId: alarm.id,
      url: alarm.url || '/hoje',
      action: alarm.action || 'open',
    },
    actions: [
      {
        action: 'complete',
        title: '✓ Concluído',
        icon: '/icons/check.png',
      },
      {
        action: 'snooze',
        title: '⏰ Adiar 15min',
        icon: '/icons/snooze.png',
      },
      {
        action: 'dismiss',
        title: '✕ Dispensar',
        icon: '/icons/close.png',
      },
    ],
  };
  
  try {
    await self.registration.showNotification(alarm.title || '💊 HoraMed', options);
    console.log('[SW] Notification shown for alarm:', alarm.id);
  } catch (error) {
    console.error('[SW] Error showing notification:', error);
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action, event.notification.data);
  
  const data = event.notification.data || {};
  const action = event.action;
  
  event.notification.close();
  
  event.waitUntil(
    (async () => {
      if (action === 'complete') {
        // Mark as complete - could send to server
        console.log('[SW] Alarm marked as complete:', data.alarmId);
        // Broadcast to clients
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => {
          client.postMessage({
            type: 'ALARM_COMPLETED',
            alarmId: data.alarmId,
          });
        });
        return;
      }
      
      if (action === 'snooze') {
        // Snooze for 15 minutes
        const alarm = {
          id: data.alarmId + '-snooze-' + Date.now(),
          title: '⏰ Lembrete Adiado',
          message: 'Você adiou este lembrete',
          scheduledAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          enabled: true,
          recurrence: 'once',
          url: data.url,
        };
        await saveAlarm(alarm);
        console.log('[SW] Alarm snoozed for 15 minutes');
        return;
      }
      
      if (action === 'dismiss') {
        console.log('[SW] Alarm dismissed:', data.alarmId);
        return;
      }
      
      // Default action - open app
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      
      // Check if app is already open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          await client.focus();
          client.postMessage({
            type: 'NAVIGATE',
            url: data.url || '/hoje',
          });
          return;
        }
      }
      
      // Open new window
      await self.clients.openWindow(data.url || '/hoje');
    })()
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  const data = event.notification.data || {};
  
  // Broadcast to clients
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_CLOSED',
          alarmId: data.alarmId,
        });
      });
    })
  );
});

// Handle push events
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body || 'Nova notificação do HoraMed',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/favicon.png',
    tag: data.tag || 'horamed-push-' + Date.now(),
    renotify: true,
    requireInteraction: data.requireInteraction !== false,
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '💊 HoraMed', options)
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-dose-actions') {
    event.waitUntil(syncDoseActions());
  }
  
  if (event.tag === 'check-alarms') {
    event.waitUntil(checkAlarms());
  }
});

// Sync offline dose actions
async function syncDoseActions() {
  try {
    const cache = await caches.open('offline-actions');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const data = await response.json();
        
        // Try to sync with server
        try {
          await fetch('/api/dose-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          
          // Remove from cache on success
          await cache.delete(request);
        } catch (error) {
          console.error('[SW] Failed to sync action:', error);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Error in sync:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', async (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SCHEDULE_ALARM':
      await saveAlarm(payload);
      console.log('[SW] Alarm scheduled:', payload.id);
      event.ports[0]?.postMessage({ success: true, id: payload.id });
      break;
      
    case 'CANCEL_ALARM':
      await deleteAlarm(payload.id);
      console.log('[SW] Alarm cancelled:', payload.id);
      event.ports[0]?.postMessage({ success: true });
      break;
      
    case 'GET_ALARMS':
      const alarms = await getAlarms();
      event.ports[0]?.postMessage({ success: true, alarms });
      break;
      
    case 'UPDATE_ALARM':
      await saveAlarm(payload);
      console.log('[SW] Alarm updated:', payload.id);
      event.ports[0]?.postMessage({ success: true });
      break;
      
    case 'TEST_NOTIFICATION':
      await showNotification({
        id: 'test-' + Date.now(),
        title: payload.title || '🔔 Notificação de Teste',
        message: payload.message || 'Esta é uma notificação de teste do HoraMed!',
        requireInteraction: false,
      });
      event.ports[0]?.postMessage({ success: true });
      break;
      
    case 'CHECK_ALARMS':
      await checkAlarms();
      event.ports[0]?.postMessage({ success: true });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Periodic alarm check (every minute when active)
setInterval(() => {
  checkAlarms();
}, 60000);

// Initial alarm check on activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Notifications service worker activated');
  event.waitUntil(
    (async () => {
      // Claim all clients
      await self.clients.claim();
      // Check alarms immediately
      await checkAlarms();
    })()
  );
});

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Notifications service worker installed');
  self.skipWaiting();
});
