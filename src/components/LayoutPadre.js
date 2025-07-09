import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { FiUser, FiHelpCircle, FiLogOut, FiPlus } from 'react-icons/fi'
import { FaHome, FaChild } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'
import BannerCarousel from '@/components/BannerCarousel'

export default function LayoutPadre({ children }) {
  const router = useRouter()
  const [hijos, setHijos] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) router.push('/')
  }

  useEffect(() => {
    const fetchHijos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Verificar que el usuario es padre
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (userError || userData?.rol !== 'padre') {
        router.push('/')
        return
      }

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

      setLoading(false)
    }

    fetchHijos()
  }, [router])

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
          <div className="flex items-center justify-center gap-3 p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            {/* Logo animado */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full bg-white/10 animate-[ping_3s_infinite] opacity-75"></div>
              <div className="absolute w-[85%] h-[85%] rounded-full bg-white/20"></div>
              <div className="absolute w-[70%] h-[70%] rounded-full bg-white/30"></div>
              <div className="absolute w-[55%] h-[55%] rounded-full bg-white/40 flex items-center justify-center">
                <FiPlus className="text-white text-xl" />
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-wide">AsistenciApp</h1>
          </div>

          <nav className="p-4 space-y-4">
            <Link href="/padre" className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out ${router.pathname === '/padre' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'}`}>
              <FaHome className="text-xl" />
              <span>Inicio</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-1">
          <Link href="/padre/cuenta" className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out ${router.pathname === '/padre/cuenta' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'}`}>
            <FiUser className="text-xl" />
            <span>Mi cuenta</span>
          </Link>
          <Link href="/ayuda" className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out ${router.pathname === '/ayuda' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'}`}>
            <FiHelpCircle className="text-xl" />
            <span>Ayuda</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 ease-in-out">
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
      <main className="flex-1 flex flex-col w-full max-h-[calc(100vh-60px)] p-4 md:p-6 overflow-y-auto animate-fade-in pt-16 md:pt-6 pb-24">
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