import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { FiUser, FiHelpCircle, FiLogOut, FiPlus, FiSend } from 'react-icons/fi'
import { FaAd, FaHome } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'

export default function LayoutAdmin({ children }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) router.push('/')
  }

  useEffect(() => {
    const verificarAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (error || !data || data.rol !== 'admin_sistema') {
        router.push('/')
        return
      }
    }

    verificarAdmin()
  }, [router])

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
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
          <div className="flex flex-col items-center py-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
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
            <p className="text-sm text-white/80">Administrador del Sistema</p>
          </div>

          <nav className="flex flex-col p-4 space-y-1 text-sm">
            <Link href="/admin" className={navStyle(router, '/admin')}>
              <span className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out">
                <FaHome className="text-xl" />
                <span>Dashboard</span>
              </span>
            </Link>
            <Link href="/admin/anuncios" className={navStyle(router, '/admin/anuncios')}>
              <span className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out">
                <FaAd className="text-xl" />
                <span>Gestión de Anuncios</span>
              </span>
            </Link>
            <Link href="/admin/notificaciones" className={navStyle(router, '/admin/notificaciones')}>
              <span className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out">
                <FiSend className="text-xl" />
                <span>Gestión de Notificaciones</span>
              </span>
            </Link>
            <Link href="/admin/cuenta" className={navStyle(router, '/admin/cuenta')}>
              <span className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out">
                <FiUser className="text-xl" />
                <span>Mi Cuenta</span>
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
      <main className="flex-1 p-4 md:p-6 overflow-y-auto animate-fade-in pt-16 md:pt-6 w-full max-h-[calc(100vh-60px)] flex flex-col">
        <div className="flex-1 w-full">
          {children}
        </div>
      </main>
    </div>
  )
}

function navStyle(router, path) {
  const isActive = router.pathname === path || router.pathname.startsWith(`${path}/`)
  return isActive 
    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium'
    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400'
}