import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import { HiOutlineClipboardCheck, HiOutlineClipboardList } from 'react-icons/hi'
import { FiUser, FiHelpCircle, FiLogOut, FiPlus } from 'react-icons/fi'
import { FaChalkboardTeacher, FaUsers, FaHome } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import BannerCarousel from '@/components/BannerCarousel'

export default function LayoutDirector({ children }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const tokenGeneradoRef = useRef(false)

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) router.push('/')
  }

  // Función para forzar la generación del token FCM
  const forzarGeneracionTokenFCM = async () => {
    if (tokenGeneradoRef.current) {
      console.log('🔄 [LayoutDirector] Token FCM ya generado, evitando duplicación')
      return
    }

    try {
      console.log('🚀 [LayoutDirector] Iniciando generación forzada de token FCM para director...')
      
      // Verificar si ya existe un token activo para este usuario
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ [LayoutDirector] No hay usuario autenticado')
        return
      }

      const { data: tokenExistente } = await supabase
        .from('fcm_tokens')
        .select('token')
        .eq('user_id', user.id)
        .eq('activo', true)
        .single()

      if (tokenExistente) {
        console.log('✅ [LayoutDirector] Ya existe un token FCM activo para el director')
        tokenGeneradoRef.current = true
        return
      }

      // Verificar soporte de notificaciones
      if (!('Notification' in window)) {
        console.log('❌ [LayoutDirector] Este navegador no soporta notificaciones')
        return
      }

      // Verificar permisos
      let permission = Notification.permission
      if (permission === 'default') {
        console.log('🔔 [LayoutDirector] Solicitando permisos de notificación...')
        permission = await Notification.requestPermission()
      }

      if (permission === 'granted') {
        console.log('✅ [LayoutDirector] Permisos concedidos, generando token FCM...')
        
        // Importar y ejecutar la función de generación de token
        const { requestNotificationPermission } = await import('@/lib/firebase')
        await requestNotificationPermission('director')
        
        tokenGeneradoRef.current = true
        console.log('🎉 [LayoutDirector] Token FCM generado exitosamente para director')
      } else {
        console.log('❌ [LayoutDirector] Permisos de notificación denegados')
      }
    } catch (error) {
      console.error('💥 [LayoutDirector] Error al generar token FCM:', error)
    }
  }

  // Función para configurar el manejador de mensajes
  const configurarMensajes = async () => {
    try {
      console.log('📱 [LayoutDirector] Configurando manejador de mensajes...')
      
      // Importar y ejecutar setupMessageHandler directamente
      const { setupMessageHandler } = await import('@/lib/firebase')
      await setupMessageHandler()
      
      console.log('✅ [LayoutDirector] Manejador de mensajes configurado')
    } catch (error) {
      console.error('💥 [LayoutDirector] Error al configurar manejador de mensajes:', error)
    }
  }

  // Inicialización del cliente
  useEffect(() => {
    if (typeof window === 'undefined') return // Evitar SSR
    if (isClient) return
    
    console.log('🔧 [LayoutDirector] Inicializando cliente director...')
    setIsClient(true)
    
    const inicializar = async () => {
      try {
        // Verificar autenticación
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('❌ [LayoutDirector] Usuario no autenticado, redirigiendo...')
          router.push('/')
          return
        }

        // Verificar rol de director
        const { data: userData, error } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', user.id)
          .single()

        if (error || !userData || userData.rol !== 'director') {
          console.log('❌ [LayoutDirector] Usuario no es director, redirigiendo...')
          router.push('/')
          return
        }

        console.log('✅ [LayoutDirector] Usuario director verificado')
        
        // Configurar manejador de mensajes
        setTimeout(async () => {
          await configurarMensajes()
        }, 2000)

        // Generar token FCM con retraso
        setTimeout(() => {
          forzarGeneracionTokenFCM()
        }, 3000)
        
      } catch (error) {
        console.error('💥 [LayoutDirector] Error en inicialización:', error)
      }
    }

    inicializar()
  }, [isClient, router])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full mb-4 flex items-center justify-center">
            <div className="w-10 h-10 bg-blue-500/40 rounded-full"></div>
          </div>
          <div className="text-blue-600 dark:text-blue-400 font-medium">Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
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
          <div className="flex flex-col items-center py-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            {/* Logo animado */}
            <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full bg-white/10 animate-[ping_3s_infinite] opacity-75"></div>
              <div className="absolute w-[85%] h-[85%] rounded-full bg-white/20"></div>
              <div className="absolute w-[70%] h-[70%] rounded-full bg-white/30"></div>
              <div className="absolute w-[55%] h-[55%] rounded-full bg-white/40 flex items-center justify-center">
                <FiPlus className="text-white text-2xl" />
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-wide">AsistenciAPP</h1>
          </div>

          <nav className="flex flex-col p-4 space-y-1 text-sm">
            <Link href="/director" className={navStyle(router, '/director')}>
              <span className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out">
                <FaHome className="text-xl" />
                <span>Dashboard</span>
              </span>
            </Link>
            <Link href="/director/maestros" className={navStyle(router, '/director/maestros')}>
              <span className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out">
                <FaChalkboardTeacher className="text-xl" />
                <span>Maestros</span>
              </span>
            </Link>
            <Link href="/director/grupos" className={navStyle(router, '/director/grupos')}>
              <span className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out">
                <FaUsers className="text-xl" />
                <span>Grupos</span>
              </span>
            </Link>
            <Link href="/director/cuenta" className={navStyle(router, '/director/cuenta')}>
              <span className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out">
                <FiUser className="text-xl" />
                <span>Cuenta</span>
              </span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-1 text-sm">
          <Link href="/ayuda" className="flex items-center gap-3 p-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out">
            <FiHelpCircle className="text-xl" />
            <span>Ayuda</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 ease-in-out"
          >
            <FiLogOut className="text-xl" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay para cerrar el sidebar en móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto animate-fade-in pt-16 md:pt-6 w-full max-h-[calc(100vh-60px)] flex flex-col pb-24">
        <div className="flex-1 w-full">
          {children}
        </div>
      </main>
      
      {/* Footer con anuncios */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 backdrop-blur-sm shadow-lg w-full border-t border-blue-100 dark:border-gray-700 md:ml-64">
        <div className="md:-ml-64"> {/* Compensación para centrar en pantallas grandes */}
          <BannerCarousel />
        </div>
      </footer>
    </div>
  )
}

function navStyle(router, path) {
  const isActive = router.pathname === path || router.pathname.startsWith(`${path}/`)
  return isActive 
    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
}