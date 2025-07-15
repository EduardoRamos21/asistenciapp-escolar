import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from './supabase';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase solo en el cliente
let firebaseApp;
let messaging;

if (typeof window !== 'undefined') {
  firebaseApp = initializeApp(firebaseConfig);
  
  // Verificar soporte para notificaciones
  try {
    messaging = getMessaging(firebaseApp);
  } catch (error) {
    console.log('Firebase Messaging no está soportado en este navegador', error);
  }
}

// Función para solicitar permiso y registrar el token FCM
// Reemplazar la función existente con esta versión mejorada
export const requestNotificationPermission = async (userId, userRole) => {
  try {
    if (!messaging) {
      console.log('Firebase Messaging no está soportado en este navegador');
      return false;
    }

    // Verificar si las notificaciones están soportadas
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return false;
    }

    // Verificar si ya tenemos permiso
    if (Notification.permission === 'granted') {
      console.log('Permiso de notificación ya concedido, obteniendo token...');
    } else {
      // Solicitar permiso
      console.log('Solicitando permiso de notificación...');
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Permiso de notificación denegado');
        return false;
      }
      console.log('Permiso de notificación concedido');
    }

    // Verificar si el service worker está registrado
    await checkServiceWorkerRegistration();

    // Obtener token FCM
    console.log('Obteniendo token FCM...');
    console.log('VAPID Key:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
    
    try {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });

      if (token) {
        console.log('Token FCM obtenido:', token);
        
        // Guardar token en Supabase
        await guardarTokenEnBaseDeDatos(token, userId, userRole);
        return true;
      } else {
        console.log('No se pudo obtener el token');
        return false;
      }
    } catch (tokenError) {
      console.error('Error al obtener token FCM:', tokenError);
      
      // Verificar si el error está relacionado con el service worker
      if (tokenError.code === 'messaging/failed-service-worker-registration') {
        console.log('Error con el registro del service worker, intentando registrar manualmente...');
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service worker registrado manualmente, reintentando obtener token...');
          
          // Reintentar obtener el token
          const tokenRetry = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
          });
          
          if (tokenRetry) {
            console.log('Token FCM obtenido en segundo intento:', tokenRetry);
            await guardarTokenEnBaseDeDatos(tokenRetry, userId, userRole);
            return true;
          }
        } catch (swError) {
          console.error('Error al registrar service worker manualmente:', swError);
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error al solicitar permiso de notificación:', error);
    return false;
  }
};

// Función para guardar el token en la base de datos
const guardarTokenEnBaseDeDatos = async (token, userId, userRole) => {
  try {
    console.log('Guardando token en base de datos:', { token, userId, userRole });
    
    // Verificar si el token ya existe
    const { data: existingTokens, error: selectError } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('token', token);
      
    if (selectError) {
      console.error('Error al verificar token existente:', selectError);
      return false;
    }
    
    if (existingTokens && existingTokens.length > 0) {
      // Actualizar token existente con la nueva información
      const { error: updateError } = await supabase
        .from('push_tokens')
        .update({
          usuario_id: userId,
          rol: userRole, // Añadir el rol del usuario
          plataforma: detectarPlataforma(),
          ultimo_acceso: new Date().toISOString(),
          activo: true
        })
        .eq('token', token);
        
      if (updateError) {
        console.error('Error al actualizar token:', updateError);
        return false;
      }
      
      console.log('Token actualizado correctamente');
      return true;
    } else {
      // Insertar nuevo token
      const { error: insertError } = await supabase
        .from('push_tokens')
        .insert([
          {
            token,
            usuario_id: userId,
            rol: userRole, // Añadir el rol del usuario
            plataforma: detectarPlataforma(),
            fecha_registro: new Date().toISOString(),
            ultimo_acceso: new Date().toISOString(),
            activo: true
          }
        ]);
        
      if (insertError) {
        console.error('Error al insertar nuevo token:', insertError);
        return false;
      }
      
      console.log('Nuevo token insertado correctamente');
      return true;
    }
  } catch (error) {
    console.error('Error al guardar token en la base de datos:', error);
    return false;
  }
};

// Función auxiliar para detectar la plataforma
const detectarPlataforma = () => {
  if (typeof window !== 'undefined') {
    const userAgent = window.navigator.userAgent;
    if (/Android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    // Simplificar las plataformas de escritorio a solo 'web'
    if (/Windows|Mac|Linux/i.test(userAgent)) return 'web';
  }
  return 'web'; // Valor predeterminado seguro
};

// Configurar manejador de mensajes en primer plano
export const setupMessageHandler = () => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('Mensaje recibido en primer plano:', payload);
    
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return;
    }
    
    // Mostrar notificación personalizada cuando la app está abierta
    if (Notification.permission === 'granted') {
      const { title, body } = payload.notification || {};
      const notificationTitle = title || 'AsistenciApp Escolar';
      const notificationOptions = {
        body: body || 'Tienes una nueva notificación',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: payload.data || {}
      };
      
      // Usar la API de notificaciones del navegador
      new Notification(notificationTitle, notificationOptions);
    } else {
      console.log('Permiso de notificación no concedido:', Notification.permission);
    }
  });
};

// Añadir esta función después de setupMessageHandler

// Función para verificar el registro del service worker
export const checkServiceWorkerRegistration = async () => {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker no está soportado en este navegador');
      return false;
    }

    // Verificar si firebase-messaging-sw.js está registrado
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('Service Workers registrados:', registrations.length);
    
    // Mostrar detalles de cada service worker registrado
    registrations.forEach((registration, index) => {
      console.log(`Service Worker ${index + 1}:`, {
        scope: registration.scope,
        active: registration.active ? true : false,
        installing: registration.installing ? true : false,
        waiting: registration.waiting ? true : false,
        state: registration.active ? registration.active.state : 'no active worker'
      });
    });

    // Verificar si hay un service worker con el scope correcto
    const hasFirebaseMessagingSW = registrations.some(reg => 
      reg.scope.includes(window.location.origin) && 
      (reg.active || reg.installing || reg.waiting)
    );

    if (!hasFirebaseMessagingSW) {
      console.warn('No se encontró un Service Worker para Firebase Messaging');
      
      // Intentar registrar el service worker manualmente
      try {
        console.log('Intentando registrar firebase-messaging-sw.js manualmente...');
        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registrado manualmente:', swRegistration);
        return true;
      } catch (regError) {
        console.error('Error al registrar el Service Worker manualmente:', regError);
        return false;
      }
    }

    return hasFirebaseMessagingSW;
  } catch (error) {
    console.error('Error al verificar el registro del Service Worker:', error);
    return false;
  }
};

export { firebaseApp, messaging };