// Scripts necesarios para Firebase Messaging en Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración de Firebase (debe coincidir con la configuración del cliente)
firebase.initializeApp({
  apiKey: "AIzaSyCy6KBErNeKix6A2-t80tc_kUUofWBT46U",
  authDomain: "notifi-assistenciapp.firebaseapp.com",
  projectId: "notifi-assistenciapp",
  storageBucket: "notifi-assistenciapp.firebasestorage.app",
  messagingSenderId: "88636871902",
  appId: "1:88636871902:web:663f4ca70742f0205a1e4f"
});

// Obtener instancia de Firebase Messaging
const messaging = firebase.messaging();

// Manejar mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Mensaje recibido en segundo plano:', payload);

  const { title, body, icon } = payload.notification || {};
  const notificationTitle = title || 'AsistenciApp Escolar';
  const notificationOptions = {
    body: body || 'Tienes una nueva notificación',
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clic en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('Notificación clickeada:', event);

  event.notification.close();

  // Obtener datos de la notificación
  const urlToOpen = event.notification.data?.url || '/';

  // Abrir URL específica al hacer clic en la notificación
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Verificar si ya hay una ventana abierta y navegar a la URL
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      // Si no hay ventanas abiertas, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});