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
export const requestNotificationPermission = async (userId, userRole) => {
  try {
    if (!messaging) {
      console.log('Firebase Messaging no está soportado en este navegador');
      return false;
    }

    // Solicitar permiso
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Permiso de notificación denegado');
      return false;
    }

    // Obtener token FCM
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });

    if (token) {
      console.log('Token FCM:', token);
      
      // Guardar token en Supabase
      await guardarTokenEnBaseDeDatos(token, userId, userRole);
      return true;
    } else {
      console.log('No se pudo obtener el token');
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

export { firebaseApp, messaging };