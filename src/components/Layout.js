import Link from 'next/link'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { HiOutlineClipboardCheck, HiOutlineClipboardList } from 'react-icons/hi'
import { FiUser, FiHelpCircle, FiLogOut } from 'react-icons/fi'
import { FaChalkboardTeacher, FaUsers, FaHome } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'

export default function Layout({ children }) {
  const router = useRouter()
  const [rol, setRol] = useState(null)

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) router.push('/')
  }

  useEffect(() => {
    const fetchRol = async () => {
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

      if (error || !data) {
        router.push('/')
        return
      }

      setRol(data.rol)
    }

    fetchRol()
  }, [router])

  if (!rol) return <div className="p-6">Cargando...</div>

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#282424] text-white flex flex-col justify-between p-6">
        <div>
          <div className="flex flex-col items-center mb-10">
            <Image src="/logo.png" alt="Logo" width={100} height={100} className="mb-3" />
            <h1 className="text-xl font-bold">AsistenciAPP</h1>
          </div>

          <nav className="flex flex-col space-y-4 text-sm">
            {rol === 'maestro' && (
              <>
                <Link href="/maestro/asistencia" className={navStyle(router, '/maestro/asistencia')}>
                  <span className="flex items-center gap-3">
                    <HiOutlineClipboardCheck className="text-xl" />
                    <span>Asistencias</span>
                  </span>
                </Link>
                <Link href="/maestro/tareas" className={navStyle(router, '/maestro/tareas')}>
                  <span className="flex items-center gap-3">
                    <HiOutlineClipboardList className="text-xl" />
                    <span>Tareas</span>
                  </span>
                </Link>
                <Link href="/maestro/cuenta" className={navStyle(router, '/maestro/cuenta')}>
                  <span className="flex items-center gap-3">
                    <FiUser className="text-xl" />
                    <span>Cuenta</span>
                  </span>
                </Link>
              </>
            )}

            {rol === 'padre' && (
              <>
                <Link href="/padre" className={navStyle(router, '/padre')}>
                  <span className="flex items-center gap-3">
                    <FaHome className="text-xl" />
                    <span>Inicio</span>
                  </span>
                </Link>
                <Link href="/padre/hijo/1/asistencia" className={navStyle(router, '/padre/hijo')}>
                  <span className="flex items-center gap-3">
                    <HiOutlineClipboardCheck className="text-xl" />
                    <span>Asistencia hijo</span>
                  </span>
                </Link>
                <Link href="/padre/hijo/1/tareas" className={navStyle(router, '/padre/hijo')}>
                  <span className="flex items-center gap-3">
                    <HiOutlineClipboardList className="text-xl" />
                    <span>Tareas hijo</span>
                  </span>
                </Link>
              </>
            )}

            {rol === 'director' && (
              <>
                <Link href="/director" className={navStyle(router, '/director')}>
                  <span className="flex items-center gap-3">
                    <FaHome className="text-xl" />
                    <span>Dashboard</span>
                  </span>
                </Link>
                <Link href="/director/maestros" className={navStyle(router, '/director/maestros')}>
                  <span className="flex items-center gap-3">
                    <FaChalkboardTeacher className="text-xl" />
                    <span>Maestros</span>
                  </span>
                </Link>
                <Link href="/director/grupos" className={navStyle(router, '/director/grupos')}>
                  <span className="flex items-center gap-3">
                    <FaUsers className="text-xl" />
                    <span>Grupos</span>
                  </span>
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex flex-col space-y-2 text-sm">
          <Link href="/ayuda" className="hover:text-purple-400 transition-colors">
            <span className="flex items-center gap-3">
              <FiHelpCircle className="text-xl" />
              <span>Ayuda</span>
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-left hover:text-red-400 transition-colors"
          >
            <span className="flex items-center gap-3">
              <FiLogOut className="text-xl" />
              <span>Cerrar sesión</span>
            </span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}

function navStyle(router, path) {
  const isActive = router.pathname === path || router.pathname.startsWith(`${path}/`)
  return `hover:text-purple-400 transition-colors ${
    isActive ? 'text-purple-500 font-semibold' : 'text-white'
  }`
}
