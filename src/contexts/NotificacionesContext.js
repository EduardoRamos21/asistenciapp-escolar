import { createContext, useContext, useState, useEffect } from 'react';
import { requestNotificationPermission, setupMessageHandler, checkServiceWorkerRegistration } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

const NotificacionesContext = createContext();

export function NotificacionesProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [permisoSolicitado, setPermisoSolicitado] = useState(false);
  const [inicializado, setInicializado] = useState(false);
  const [errorNotificaciones, setErrorNotificaciones] = useState(null);

  useEffect(() => {
    // Evitar inicialización si ya está inicializado
    if (inicializado) return;
    
    console.log('NotificacionesContext: Inicializando');
    
    // Verificar registro del service worker
    const verificarServiceWorker = async () => {
      try {
        const registrado = await checkServiceWorkerRegistration();
        console.log('NotificacionesContext: Service Worker registrado:', registrado ? 'Sí' : 'No');
      } catch (error) {
        console.error('NotificacionesContext: Error al verificar Service Worker:', error);
        setErrorNotificaciones('Error al verificar Service Worker: ' + error.message);
      }
    };
    
    verificarServiceWorker();
    
    // Verificar si el usuario está autenticado
    const obtenerUsuario = async () => {
      try {
        console.log('NotificacionesContext: Verificando usuario autenticado');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('NotificacionesContext: Usuario obtenido', user ? 'Sí' : 'No');
        
        if (user) {
          setUsuario(user);

          // Obtener rol del usuario
          const { data: usuarioData, error: userError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', user.id)
            .single();

          if (userError) {
            console.error('NotificacionesContext: Error al obtener rol del usuario:', userError);
            setErrorNotificaciones('Error al obtener rol del usuario: ' + userError.message);
            setInicializado(true);
            return;
          }

          console.log('NotificacionesContext: Rol del usuario', usuarioData ? usuarioData.rol : 'No encontrado');

          if (usuarioData) {
            // Solicitar permiso para notificaciones
            if (!permisoSolicitado) {
              try {
                console.log('NotificacionesContext: Solicitando permiso para notificaciones');
                const permisoConcedido = await requestNotificationPermission(user.id, usuarioData.rol);
                console.log('NotificacionesContext: Permiso concedido', permisoConcedido ? 'Sí' : 'No');
                
                if (permisoConcedido) {
                  // Configurar manejador de mensajes en primer plano
                  setupMessageHandler();
                } else {
                  console.warn('NotificacionesContext: Permiso de notificaciones denegado por el usuario');
                }
                setPermisoSolicitado(true);
              } catch (error) {
                console.error('NotificacionesContext: Error al solicitar permiso:', error);
                setErrorNotificaciones('Error al solicitar permiso: ' + error.message);
              }
            }
          }
        }
        
        setInicializado(true);
      } catch (error) {
        console.error('NotificacionesContext: Error general:', error);
        setErrorNotificaciones('Error general: ' + error.message);
        setInicializado(true);
      }
    };

    obtenerUsuario();

    // Escuchar cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUsuario(session.user);
        
        try {
          // Obtener rol del usuario
          const { data: usuarioData, error: userError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', session.user.id)
            .single();
            
          if (userError) {
            console.error('NotificacionesContext: Error al obtener rol del usuario (auth change):', userError);
            return;
          }
            
          if (usuarioData && !permisoSolicitado) {
            // Solicitar permiso para notificaciones
            try {
              const permisoConcedido = await requestNotificationPermission(session.user.id, usuarioData.rol);
              if (permisoConcedido) {
                setupMessageHandler();
              }
              setPermisoSolicitado(true);
            } catch (error) {
              console.error('NotificacionesContext: Error al solicitar permiso (auth change):', error);
            }
          }
        } catch (error) {
          console.error('NotificacionesContext: Error general (auth change):', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUsuario(null);
        // No eliminamos el token, solo lo marcamos como inactivo si es necesario
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [permisoSolicitado, inicializado]); 

  // Función para solicitar permiso manualmente
  const solicitarPermisoManualmente = async () => {
    try {
      if (!usuario) {
        console.error('NotificacionesContext: No hay usuario autenticado');
        return false;
      }
      
      // Obtener rol del usuario
      const { data: usuarioData, error: userError } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', usuario.id)
        .single();
        
      if (userError) {
        console.error('NotificacionesContext: Error al obtener rol del usuario (manual):', userError);
        return false;
      }
      
      if (usuarioData) {
        console.log('NotificacionesContext: Solicitando permiso manualmente');
        const permisoConcedido = await requestNotificationPermission(usuario.id, usuarioData.rol);
        console.log('NotificacionesContext: Permiso concedido (manual)', permisoConcedido ? 'Sí' : 'No');
        
        if (permisoConcedido) {
          setupMessageHandler();
          setPermisoSolicitado(true);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('NotificacionesContext: Error al solicitar permiso manualmente:', error);
      return false;
    }
  };

  return (
    <NotificacionesContext.Provider value={{ 
      inicializado, 
      usuario, 
      permisoSolicitado, 
      errorNotificaciones,
      solicitarPermisoManualmente 
    }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  return useContext(NotificacionesContext);
}