import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef, useCallback } from 'react'
import { FiUser, FiHelpCircle, FiLogOut, FiPlus } from 'react-icons/fi'
import { FaHome, FaChild } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import BannerCarousel from '@/components/BannerCarousel'
import { useNotificaciones } from '@/contexts/NotificacionesContext';

export default function LayoutPadre({ children }) {
  const router = useRouter()
  const [hijos, setHijos] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [usuario, setUsuario] = useState(null)
  
  // Referencias para evitar múltiples verificaciones
  const verificandoRef = useRef(false)
  const usuarioVerificadoRef = useRef(false)
  // Nueva referencia para controlar la generación de tokens
  const tokenGeneradoRef = useRef(false)
  
  // Usamos useEffect para determinar si estamos en el cliente
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Solo accedemos al contexto de notificaciones si estamos en el cliente
  const notificaciones = useNotificaciones() || { inicializado: false }
  const { inicializado } = notificaciones

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) router.push('/')
  }

  // Nueva función para forzar la generación de token FCM
  const forzarGeneracionTokenFCM = useCallback(async (userId) => {
    if (tokenGeneradoRef.current) return;
    tokenGeneradoRef.current = true;
    
    try {
      console.log('🔄 Forzando generación de token FCM para padre:', userId);
      
      // Verificar si ya existe un token activo para este usuario
      const { data: tokenExistente, error: tokenError } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId)
        .eq('activo', true)
        .single();
      
      if (tokenExistente && !tokenError) {
        console.log('✅ Token FCM ya existe para este usuario');
        return;
      }
      
      // Verificar soporte del navegador
      if (!('Notification' in window)) {
        console.log('❌ Este navegador no soporta notificaciones');
        return;
      }
      
      // Solicitar permisos si no están concedidos
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        console.log('✅ Permisos concedidos, generando token FCM...');
        
        try {
          // Importar y ejecutar la función de Firebase
          const { requestNotificationPermission } = await import('@/lib/firebase');
          const token = await requestNotificationPermission(userId, 'padre');
          
          if (token) {
            console.log('🎉 Token FCM generado exitosamente:', token);
          } else {
            console.log('⚠️ No se pudo generar el token FCM');
          }
        } catch (firebaseError) {
          console.error('❌ Error al generar token FCM:', firebaseError);
        }
      } else {
        console.log('❌ Permisos de notificación denegados');
      }
    } catch (error) {
      console.error('❌ Error en forzarGeneracionTokenFCM:', error);
    }
  }, []);

  const fetchHijos = useCallback(async () => {
    if (verificandoRef.current || usuarioVerificadoRef.current) return;
    verificandoRef.current = true;
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Verificar que el usuario es padre
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('rol, nombre')
        .eq('id', user.id)
        .single()

      if (userError || userData?.rol !== 'padre') {
        router.push('/')
        return
      }

      setUsuario({
        id: user.id,
        nombre: userData.nombre,
        email: user.email
      })

      // Obtener hijos del padre
      const { data: hijosData, error: hijosError } = await supabase
        .from('padre_alumno')
        .select(`
          alumno_id,
          alumnos:alumno_id (id, usuarios:usuario_id (nombre))
        `)
        .eq('padre_id', user.id)

      if (!hijosError && hijosData) {
        const hijosFormateados = hijosData.map(h => ({
          id: h.alumno_id,
          nombre: h.alumnos?.usuarios?.nombre || 'Alumno'
        }))
        setHijos(hijosFormateados)
      }
      
      usuarioVerificadoRef.current = true;
      
      // Forzar generación de token FCM después de verificar el usuario
      setTimeout(() => {
        forzarGeneracionTokenFCM(user.id);
      }, 2000); // Esperar 2 segundos para que el contexto se inicialice

    } catch (error) {
      console.error('Error verificando padre:', error);
      router.push('/');
    } finally {
      setLoading(false)
      verificandoRef.current = false;
    }
  }, [router, forzarGeneracionTokenFCM])

  useEffect(() => {
    fetchHijos()
  }, [fetchHijos])

  // Mostrar indicador de carga si las notificaciones no están inicializadas
  if (isClient && !inicializado) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Botón de menú móvil */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md text-indigo-600 dark:text-indigo-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static top-0 left-0 z-40 h-full w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col justify-between overflow-hidden transition-all duration-300 ease-in-out`}>
        <div>
          <div className="flex items-center justify-center gap-3 p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full bg-white/10 animate-[ping_3s_infinite] opacity-75"></div>
              <div className="absolute w-[85%] h-[85%] rounded-full bg-white/20"></div>
              <div className="absolute w-[70%] h-[70%] rounded-full bg-white/30"></div>
              <div className="absolute w-[55%] h-[55%] rounded-full bg-white/40 flex items-center justify-center">
                <FiPlus className="text-white text-xl" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold">AsistenciApp</h1>
              <p className="text-sm opacity-90">Padre</p>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <Link href="/padre" className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${navStyle(router, '/padre')}`}>
              <FaHome className="text-lg" />
              <span>Dashboard</span>
            </Link>
            
            
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="space-y-2">
            <Link href="/ayuda" className="flex items-center gap-3 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <FiHelpCircle className="text-lg" />
              <span className="text-sm">Ayuda</span>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <FiLogOut className="text-lg" />
              <span className="text-sm">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
        
        <BannerCarousel />
      </main>
    </div>
  )
}

function navStyle(router, path) {
  const isActive = router.pathname === path || router.pathname.startsWith(`${path}/`)
  return isActive 
    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
}