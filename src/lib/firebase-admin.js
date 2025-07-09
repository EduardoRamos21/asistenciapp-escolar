import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
};

// Inicializar Firebase Admin
const initializeFirebaseAdmin = () => {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error('Error: Faltan variables de entorno de Firebase Admin');
      console.error('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Definido' : 'No definido');
      console.error('CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'Definido' : 'No definido');
      console.error('PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Definido' : 'No definido');
      throw new Error('Configuración de Firebase Admin incompleta');
    }
    
    if (!getApps().length) {
      console.log('Inicializando Firebase Admin...');
      return initializeApp(firebaseAdminConfig);
    }
    return getApps()[0];
  } catch (error) {
    console.error('Error al inicializar Firebase Admin:', error);
    throw error;
  }
};

// Obtener instancia de Firebase Messaging
export const getFirebaseAdminMessaging = () => {
  try {
    const app = initializeFirebaseAdmin();
    return getMessaging(app);
  } catch (error) {
    console.error('Error al obtener Firebase Messaging:', error);
    throw error;
  }
};

// Función para enviar notificación a un token específico
export const enviarNotificacionAToken = async (token, titulo, cuerpo, datos = {}) => {
  try {
    const messaging = getFirebaseAdminMessaging();
    
    const mensaje = {
      token,
      notification: {
        title: titulo,
        body: cuerpo
      },
      data: datos,
      webpush: {
        fcmOptions: {
          link: datos.url || '/'
        },
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          actions: [
            {
              action: 'view',
              title: 'Ver'
            }
          ]
        }
      }
    };
    
    const response = await messaging.send(mensaje);
    console.log('Notificación enviada correctamente:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return { success: false, error: error.message };
  }
};

// Función para enviar notificación a múltiples tokens
export const enviarNotificacionAMultiplesTokens = async (tokens, titulo, cuerpo, datos = {}) => {
  try {
    if (!tokens || tokens.length === 0) {
      return { success: false, error: 'No hay tokens para enviar notificaciones' };
    }
    
    const messaging = getFirebaseAdminMessaging();
    
    // Asegurarse de que todos los valores en datos sean strings
    const datosString = {};
    Object.keys(datos).forEach(key => {
      datosString[key] = String(datos[key]);
    });
    
    // Enviar notificaciones individualmente en lugar de usar sendMulticast
    const resultados = await Promise.allSettled(
      tokens.map(async (token) => {
        try {
          // Definir el mensaje para cada token
          const mensaje = {
            token,
            notification: {
              title: titulo,
              body: cuerpo
            },
            data: datosString,
            webpush: {
              fcmOptions: {
                link: datosString.url || '/'
              },
              notification: {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                actions: [
                  {
                    action: 'view',
                    title: 'Ver'
                  }
                ]
              }
            }
          };
          
          const result = await messaging.send(mensaje);
          return { token, success: true, result };
        } catch (error) {
          // Si el error es porque el token es inválido, marcarlo como inactivo
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            try {
              await supabaseAdmin
                .from('push_tokens')
                .update({ activo: false })
                .eq('token', token);
              console.log(`Token inválido marcado como inactivo: ${token}`);
            } catch (dbError) {
              console.error('Error al marcar token como inactivo:', dbError);
            }
          }
          return { token, success: false, error };
        }
      })
    );
    
    // Mostrar más detalles sobre los errores
    resultados.filter(r => r.status === 'rejected').forEach((result, index) => {
      console.error(`Error en token ${index}:`, result.reason);
    });
    
    // Contar éxitos y fallos correctamente
    const successCount = resultados.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failureCount = resultados.length - successCount;
    
    console.log('Notificaciones enviadas:', {
      total: tokens.length,
      exitosas: successCount,
      fallidas: failureCount
    });
    
    return { 
      success: successCount > 0, 
      successCount,
      failureCount
    };
  } catch (error) {
    console.error('Error al enviar notificaciones:', error);
    return { success: false, error: error.message };
  }
};