import { createContext, useContext, useState, useEffect } from 'react';
import { requestNotificationPermission, setupMessageHandler } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

const NotificacionesContext = createContext();

export function NotificacionesProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [permisoSolicitado, setPermisoSolicitado] = useState(false);
  const [inicializado, setInicializado] = useState(false);

  useEffect(() => {
    console.log('NotificacionesContext: Inicializando');
    
    // Verificar si el usuario está autenticado
    const obtenerUsuario = async () => {
      console.log('NotificacionesContext: Verificando usuario autenticado');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('NotificacionesContext: Usuario obtenido', user ? 'Sí' : 'No');
      
      if (user) {
        setUsuario(user);

        // Obtener rol del usuario
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', user.id)
          .single();

        console.log('NotificacionesContext: Rol del usuario', usuarioData ? usuarioData.rol : 'No encontrado');

        if (usuarioData) {
          // Solicitar permiso para notificaciones
          if (!permisoSolicitado) {
            console.log('NotificacionesContext: Solicitando permiso para notificaciones');
            const permisoConcedido = await requestNotificationPermission(user.id, usuarioData.rol);
            console.log('NotificacionesContext: Permiso concedido', permisoConcedido ? 'Sí' : 'No');
            
            if (permisoConcedido) {
              // Configurar manejador de mensajes en primer plano
              setupMessageHandler();
            }
            setPermisoSolicitado(true);
          }
        }
      }
      
      setInicializado(true);
    };

    obtenerUsuario();

    // Escuchar cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUsuario(session.user);
        
        // Obtener rol del usuario
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', session.user.id)
          .single();
          
        if (usuarioData && !permisoSolicitado) {
          // Solicitar permiso para notificaciones
          const permisoConcedido = await requestNotificationPermission(session.user.id, usuarioData.rol);
          if (permisoConcedido) {
            setupMessageHandler();
          }
          setPermisoSolicitado(true);
        }
      } else if (event === 'SIGNED_OUT') {
        setUsuario(null);
        // No eliminamos el token, solo lo marcamos como inactivo si es necesario
        // Esto permitirá que las notificaciones sigan llegando incluso cuando el usuario no está conectado
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [permisoSolicitado]);

  return (
    <NotificacionesContext.Provider value={{ inicializado, usuario, permisoSolicitado }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  return useContext(NotificacionesContext);
}