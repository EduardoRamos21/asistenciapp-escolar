import Link from 'next/link'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { FiUser, FiHelpCircle, FiLogOut } from 'react-icons/fi'
import { FaHome, FaChild } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'

export default function LayoutPadre({ children }) {
  const router = useRouter()
  const [hijos, setHijos] = useState([])
  const [loading, setLoading] = useState(true)

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
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#282424] text-white flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Image src="/logo.png" alt="Logo" width={40} height={40} />
            <h1 className="text-xl font-bold">AsistenciApp</h1>
          </div>

          <nav className="space-y-1">
            <Link href="/padre" className={`flex items-center gap-3 p-3 rounded-lg ${router.pathname === '/padre' ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <FaHome className="text-xl" />
              <span>Inicio</span>
            </Link>

            {/* Lista de hijos */}
            <div className="mt-6">
              <h2 className="text-sm uppercase text-gray-400 mb-2">Mis hijos</h2>
              {loading ? (
                <p className="text-sm text-gray-400">Cargando...</p>
              ) : hijos.length === 0 ? (
                <p className="text-sm text-gray-400">No hay hijos asignados</p>
              ) : (
                <div className="space-y-1">
                  {hijos.map(hijo => (
                    <div key={hijo.id} className="space-y-1">
                      <div className="flex items-center gap-2 p-2 rounded hover:bg-white/5">
                        <FaChild />
                        <span>{hijo.nombre}</span>
                      </div>
                      <div className="pl-6 space-y-1 text-sm">
                        <Link href={`/padre/hijo/${hijo.id}/asistencia`} className={`block p-2 rounded-lg ${router.pathname === `/padre/hijo/${hijo.id}/asistencia` ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                          Asistencia
                        </Link>
                        <Link href={`/padre/hijo/${hijo.id}/tareas`} className={`block p-2 rounded-lg ${router.pathname === `/padre/hijo/${hijo.id}/tareas` ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                          Tareas
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="space-y-1">
          <Link href="/padre/cuenta" className={`flex items-center gap-3 p-3 rounded-lg ${router.pathname === '/padre/cuenta' ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            <FiUser />
            <span>Mi cuenta</span>
          </Link>
          <Link href="/ayuda" className={`flex items-center gap-3 p-3 rounded-lg ${router.pathname === '/ayuda' ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            <FiHelpCircle />
            <span>Ayuda</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-white/5">
            <FiLogOut />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}