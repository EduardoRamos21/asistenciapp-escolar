import { createContext, useContext, useState, useEffect } from 'react';
import { requestNotificationPermission, setupMessageHandler, checkServiceWorkerRegistration } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

const NotificacionesContext = createContext();

export function NotificacionesProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [permisoSolicitado, setPermisoSolicitado] = useState(false);
  const [inicializado, setInicializado] = useState(false);
  const [errorNotificaciones, setErrorNotificaciones] = useState(null);

  // Verificar si el usuario está autenticado
  const obtenerUsuario = async () => {
    try {
      console.log('NotificacionesContext: Verificando usuario autenticado');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('NotificacionesContext: Error al obtener usuario:', authError);
        return;
      }
      
      console.log('NotificacionesContext: Usuario obtenido', user ? 'Sí' : 'No');
      
      if (user) {
        setUsuario(user);
        
        // Verificar que el ID de usuario sea válido antes de consultar
        if (!user.id) {
          console.error('NotificacionesContext: ID de usuario no válido');
          return;
        }
        
        // Obtener rol del usuario
        const { data: usuarioData, error: userError } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', user.id)
          .single();
        
        if (userError) {
          console.error('NotificacionesContext: Error al obtener rol del usuario:', userError);
          return;
        }
        
        console.log('NotificacionesContext: Rol del usuario', usuarioData?.rol);
        
        // Solicitar permiso para notificaciones
        if (usuarioData && !permisoSolicitado) {
          try {
            console.log('NotificacionesContext: Solicitando permiso para notificaciones');
            const permisoConcedido = await requestNotificationPermission(user.id, usuarioData.rol);
            console.log('NotificacionesContext: Permiso concedido', permisoConcedido ? 'Sí' : 'No');
            
            if (permisoConcedido) {
              setupMessageHandler();
            }
            setPermisoSolicitado(true);
          } catch (error) {
            console.error('NotificacionesContext: Error al solicitar permiso:', error);
          }
        }
      }
    } catch (error) {
      console.error('NotificacionesContext: Error general al obtener usuario:', error);
    }
  };

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
    
    // Añadir un pequeño retraso para asegurar que la autenticación esté lista
    setTimeout(async () => {
      try {
        await verificarServiceWorker();
        await obtenerUsuario();
        setInicializado(true);
      } catch (error) {
        console.error('NotificacionesContext: Error en inicialización:', error);
        setErrorNotificaciones('Error en inicialización: ' + error.message);
      }
    }, 1000); // Retraso de 1 segundo
  }, []);

  useEffect(() => {
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