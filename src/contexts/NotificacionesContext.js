import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const NotificacionesContext = createContext();

export function NotificacionesProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [permisos, setPermisos] = useState(null);
  const [inicializado, setInicializado] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [permisoSolicitado, setPermisoSolicitado] = useState(false);
  const [errorNotificaciones, setErrorNotificaciones] = useState(null);
  const [error, setError] = useState(null);
  
  // Referencias para evitar múltiples inicializaciones
  const inicializandoRef = useRef(false);
  const permisoSolicitadoRef = useRef(false);
  const serviceWorkerRegistradoRef = useRef(false);

  // Función para obtener usuario
  const obtenerUsuario = useCallback(async () => {
    if (inicializandoRef.current) return;
    inicializandoRef.current = true;
    
    try {
      console.log('NotificacionesContext: Verificando usuario autenticado');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('NotificacionesContext: Error al obtener sesión:', sessionError);
        setSessionReady(true);
        return;
      }
      
      if (!session || !session.user) {
        console.log('NotificacionesContext: No hay sesión activa');
        setSessionReady(true);
        return;
      }
      
      const user = session.user;
      console.log('NotificacionesContext: Usuario obtenido:', user.email);
      
      if (user) {
        setUsuario(user);
        
        if (!user.id) {
          console.error('NotificacionesContext: ID de usuario no válido');
          setSessionReady(true);
          return;
        }
        
        // Solo solicitar permiso una vez
        if (!permisoSolicitadoRef.current) {
          const { data: usuarioData, error: userError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', user.id)
            .single();
        
          if (userError) {
            console.error('NotificacionesContext: Error al obtener rol del usuario:', userError);
            setSessionReady(true);
            return;
          }
          
          console.log('NotificacionesContext: Rol del usuario:', usuarioData?.rol);
          
          if (usuarioData) {
            try {
              console.log('NotificacionesContext: Solicitando permiso para notificaciones');
              const permisoConcedido = await requestNotificationPermission(user.id, usuarioData.rol);
              console.log('NotificacionesContext: Permiso concedido:', permisoConcedido ? 'Sí' : 'No');
              
              setPermisoSolicitado(true);
              permisoSolicitadoRef.current = true;
            } catch (error) {
              console.error('NotificacionesContext: Error al solicitar permiso:', error);
            }
          }
        }
      }
      
      setSessionReady(true);
    } catch (error) {
      console.error('NotificacionesContext: Error general al obtener usuario:', error);
      setSessionReady(true);
    } finally {
      inicializandoRef.current = false;
    }
  }, []);

  // Función requestNotificationPermission
  const requestNotificationPermission = async (userId, userRole) => {
    try {
      console.log('🔔 Solicitando permisos para usuario:', userId, 'rol:', userRole);
      
      if (!('Notification' in window)) {
        console.log('❌ Este navegador no soporta notificaciones');
        return false;
      }

      const permission = await Notification.requestPermission();
      console.log('📋 Permiso obtenido:', permission);
      
      setPermisos(permission);
      
      if (permission === 'granted') {
        try {
          const { requestNotificationPermission: firebaseRequest } = await import('@/lib/firebase');
          const result = await firebaseRequest(userId, userRole);
          console.log('🔥 Resultado de Firebase:', result);
          
          // Configurar manejador después de obtener el token
          if (result) {
            await setupMessageHandler();
          }
          
          return result;
        } catch (importError) {
          console.error('❌ Error al importar Firebase:', importError);
          return false;
        }
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error al solicitar permiso de notificaciones:', error);
      return false;
    }
  };

  // Función para configurar el manejador de mensajes
  const setupMessageHandler = async () => {
    try {
      const { setupMessageHandler: firebaseSetup } = await import('@/lib/firebase');
      firebaseSetup();
      console.log('✅ Manejador de mensajes configurado');
    } catch (error) {
      console.error('❌ Error al configurar manejador de mensajes:', error);
    }
  };

  const verificarUsuarioAutenticado = useCallback(async () => {
    await obtenerUsuario();
  }, [obtenerUsuario]);

  const verificarServiceWorker = async () => {
    if (serviceWorkerRegistradoRef.current) return;
    
    try {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        serviceWorkerRegistradoRef.current = true;
        console.log('Service Worker registrado');
      }
    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
    }
  };

  // useEffect principal - Sistema de notificaciones
  useEffect(() => {
    const inicializar = async () => {
      if (inicializandoRef.current) return;
      inicializandoRef.current = true;
      
      try {
        console.log('🚀 Iniciando sistema de notificaciones...');
        
        // Verificar service worker
        await verificarServiceWorker();
        
        // Obtener usuario y configurar notificaciones
        await obtenerUsuario();
        
        // Configurar manejador de mensajes en primer plano
        await setupMessageHandler();
        
        console.log('✅ Sistema de notificaciones inicializado correctamente');
        setInicializado(true);
        
      } catch (error) {
        console.error('❌ Error al inicializar:', error);
        setError(error.message);
        setInicializado(true); // Marcar como inicializado para no bloquear
      } finally {
        inicializandoRef.current = false;
      }
    };
    
    // Inicializar inmediatamente
    inicializar();
  }, [obtenerUsuario]);

  // useEffect para escuchar cambios de autenticación
  useEffect(() => {
    if (!sessionReady || !inicializado) return;
    
    // Escuchar cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('NotificacionesContext: Auth state change:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUsuario(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUsuario(null);
        setPermisoSolicitado(false);
        permisoSolicitadoRef.current = false;
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [sessionReady, inicializado]);

  // Función para solicitar permiso manualmente
  const solicitarPermisoManualmente = async () => {
    if (permisoSolicitadoRef.current) return;
    permisoSolicitadoRef.current = true;
    
    try {
      const permission = await Notification.requestPermission();
      setPermisos(permission);
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
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