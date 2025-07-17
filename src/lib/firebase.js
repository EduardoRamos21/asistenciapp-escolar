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
    console.log('🔔 Iniciando proceso de notificaciones...');
    
    if (!messaging) {
      console.log('❌ Firebase Messaging no está soportado en este navegador');
      return false;
    }

    // Verificar si las notificaciones están soportadas
    if (!('Notification' in window)) {
      console.log('❌ Este navegador no soporta notificaciones');
      return false;
    }

    // Detectar si es Edge
    const isEdge = /Edg/i.test(navigator.userAgent);
    console.log('🌐 Navegador detectado:', isEdge ? 'Edge' : 'Otro');

    // Verificar si ya tenemos permiso
    if (Notification.permission === 'granted') {
      console.log('✅ Permiso de notificación ya concedido');
    } else if (Notification.permission === 'denied') {
      console.log('❌ Permiso de notificación denegado previamente');
      return false;
    } else {
      // Solicitar permiso
      console.log('🔔 Solicitando permiso de notificación...');
      
      try {
        let permission;
        
        if (isEdge) {
          // Para Edge, usar la versión síncrona sin Promise.race
          console.log('🔧 Usando método específico para Edge...');
          
          // Intentar primero la versión moderna
          if (typeof Notification.requestPermission === 'function') {
            try {
              // Llamar de forma síncrona para Edge
              const result = Notification.requestPermission();
              
              // Si devuelve una Promise (Edge moderno)
              if (result && typeof result.then === 'function') {
                permission = await Promise.race([
                  result,
                  new Promise((resolve) => {
                    setTimeout(() => {
                      console.log('⏰ Timeout en Edge, verificando permiso actual...');
                      resolve(Notification.permission);
                    }, 5000); // 5 segundos para Edge
                  })
                ]);
              } else {
                // Si devuelve directamente el resultado (Edge legacy)
                permission = result;
              }
            } catch (edgeError) {
              console.log('⚠️ Error en método moderno de Edge, intentando método legacy...');
              
              // Método legacy para Edge más antiguo
              permission = await new Promise((resolve) => {
                try {
                  Notification.requestPermission((result) => {
                    resolve(result);
                  });
                  
                  // Timeout de seguridad
                  setTimeout(() => {
                    resolve(Notification.permission);
                  }, 5000);
                } catch (legacyError) {
                  console.error('❌ Error en método legacy:', legacyError);
                  resolve(Notification.permission);
                }
              });
            }
          }
        } else {
          // Para otros navegadores, método normal
          permission = await Promise.race([
            Notification.requestPermission(),
            new Promise((resolve) => {
              setTimeout(() => {
                console.log('⏰ Timeout general, verificando permiso actual...');
                resolve(Notification.permission);
              }, 5000);
            })
          ]);
        }
        
        console.log('🔔 Resultado del permiso:', permission);
        
        if (permission !== 'granted') {
          console.log('❌ Permiso de notificación no concedido:', permission);
          
          // Para Edge, mostrar instrucciones al usuario
          if (isEdge && permission === 'default') {
            console.log('💡 Sugerencia: En Edge, es posible que necesites habilitar las notificaciones manualmente en la configuración del sitio.');
          }
          
          return false;
        }
        
        console.log('✅ Permiso de notificación concedido');
      } catch (permissionError) {
        console.error('❌ Error al solicitar permiso:', permissionError);
        
        // Verificar si el permiso se concedió a pesar del error
        if (Notification.permission === 'granted') {
          console.log('✅ Permiso concedido a pesar del error');
        } else {
          return false;
        }
      }
    }

    // Verificar y esperar a que el service worker esté activo
    console.log('🔧 Verificando service worker...');
    const swReady = await waitForServiceWorkerReady();
    if (!swReady) {
      console.log('⚠️ Service worker no está listo, continuando sin token FCM');
      return false;
    }

    // Obtener token FCM con timeout
    console.log('🎯 Obteniendo token FCM...');
    
    try {
      const tokenTimeout = isEdge ? 8000 : 5000; // Más tiempo para Edge
      
      const token = await Promise.race([
        getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT_FCM_TOKEN')), tokenTimeout);
        })
      ]);

      if (token) {
        console.log('✅ Token FCM obtenido exitosamente');
        
        // Guardar token en Supabase con timeout
        const saveResult = await Promise.race([
          guardarTokenEnBaseDeDatos(token, userId, userRole),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT_SAVE_TOKEN')), 3000);
          })
        ]);
        
        console.log('💾 Token guardado:', saveResult ? '✅' : '❌');
        return saveResult;
      } else {
        console.log('❌ No se pudo obtener el token FCM');
        return false;
      }
    } catch (tokenError) {
      console.error('❌ Error al obtener token FCM:', tokenError.message);
      
      // Si es timeout, continuar sin bloquear
      if (tokenError.message.includes('TIMEOUT')) {
        console.log('⏰ Timeout detectado, continuando sin token FCM');
        return false;
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error general en requestNotificationPermission:', error);
    return false;
  }
};

// Nueva función para esperar a que el service worker esté listo
const waitForServiceWorkerReady = async () => {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    // Verificar si ya hay un service worker activo
    const registrations = await navigator.serviceWorker.getRegistrations();
    const activeRegistration = registrations.find(reg => reg.active && reg.active.state === 'activated');
    
    if (activeRegistration) {
      console.log('✅ Service worker ya está activo');
      return true;
    }

    // Si no hay service worker activo, intentar registrar uno nuevo
    console.log('🔧 Registrando service worker...');
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // Detectar Edge para ajustar timeout
      const isEdge = /Edg/i.test(navigator.userAgent);
      const swTimeout = isEdge ? 12000 : 8000; // Más tiempo para Edge
      
      // Esperar a que el service worker esté listo
      const isReady = await Promise.race([
        new Promise((resolve) => {
          if (registration.active) {
            resolve(true);
            return;
          }
          
          const checkReady = () => {
            if (registration.active && registration.active.state === 'activated') {
              resolve(true);
            } else if (registration.installing) {
              registration.installing.addEventListener('statechange', () => {
                if (registration.active && registration.active.state === 'activated') {
                  resolve(true);
                }
              });
            }
          };
          
          checkReady();
          
          // Verificar cada 500ms
          const interval = setInterval(() => {
            checkReady();
            if (registration.active && registration.active.state === 'activated') {
              clearInterval(interval);
            }
          }, 500);
        }),
        new Promise((resolve) => {
          setTimeout(() => resolve(false), swTimeout);
        })
      ]);
      
      if (isReady) {
        console.log('✅ Service worker registrado y activo');
        return true;
      } else {
        console.log('⏰ Timeout esperando service worker');
        return false;
      }
    } catch (regError) {
      console.error('❌ Error al registrar service worker:', regError);
      return false;
    }
  } catch (error) {
    console.error('❌ Error en waitForServiceWorkerReady:', error);
    return false;
  }
};

// Función para guardar el token en la base de datos
const guardarTokenEnBaseDeDatos = async (token, userId, userRole) => {
  try {
    console.log('💾 Guardando token en base de datos...');
    
    // Validar parámetros
    if (!token || !userId || !userRole) {
      console.error('❌ Parámetros inválidos para guardar token');
      return false;
    }
    
    // Verificar si el token ya existe
    const { data: existingTokens, error: selectError } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('token', token);
      
    if (selectError) {
      console.error('❌ Error al verificar token existente:', selectError.message);
      return false;
    }
    
    const tokenData = {
      usuario_id: userId,
      rol: userRole,
      plataforma: detectarPlataforma(),
      ultimo_acceso: new Date().toISOString(),
      activo: true
    };
    
    if (existingTokens && existingTokens.length > 0) {
      // Actualizar token existente
      const { error: updateError } = await supabase
        .from('push_tokens')
        .update(tokenData)
        .eq('token', token);
        
      if (updateError) {
        console.error('❌ Error al actualizar token:', updateError.message);
        return false;
      }
      
      console.log('✅ Token actualizado correctamente');
      return true;
    } else {
      // Insertar nuevo token
      const { error: insertError } = await supabase
        .from('push_tokens')
        .insert({ token, ...tokenData });
        
      if (insertError) {
        console.error('❌ Error al insertar token:', insertError.message);
        return false;
      }
      
      console.log('✅ Nuevo token insertado correctamente');
      return true;
    }
  } catch (error) {
    console.error('❌ Error general al guardar token:', error.message);
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