import Link from 'next/link'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { useState, useEffect } from 'react'
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
          <div className="mb-8">
            <Image src="/logo.png" alt="AsistenciApp" width={180} height={40} />
          </div>
          
          <nav className="space-y-6">
            {rol === 'director' && (
              <>
                <Link href="/director" className="flex items-center gap-3 text-gray-300 hover:text-white">
                  <FaHome className="text-xl" />
                  <span>Inicio</span>
                </Link>
                <Link href="/director/maestros" className="flex items-center gap-3 text-gray-300 hover:text-white">
                  <FaChalkboardTeacher className="text-xl" />
                  <span>Maestros</span>
                </Link>
                <Link href="/director/grupos" className="flex items-center gap-3 text-gray-300 hover:text-white">
                  <FaUsers className="text-xl" />
                  <span>Grupos</span>
                </Link>
              </>
            )}

            {rol === 'maestro' && (
              <>
                <Link href="/maestro" className="flex items-center gap-3 text-gray-300 hover:text-white">
                  <FaHome className="text-xl" />
                  <span>Inicio</span>
                </Link>
                <Link href="/maestro/asistencia" className="flex items-center gap-3 text-gray-300 hover:text-white">
                  <HiOutlineClipboardCheck className="text-xl" />
                  <span>Asistencia</span>
                </Link>
                <Link href="/maestro/tareas" className="flex items-center gap-3 text-gray-300 hover:text-white">
                  <HiOutlineClipboardList className="text-xl" />
                  <span>Tareas</span>
                </Link>
              </>
            )}

            {rol === 'padre' && (
              <>
                <Link href="/padre" className="flex items-center gap-3 text-gray-300 hover:text-white">
                  <FaHome className="text-xl" />
                  <span>Inicio</span>
                </Link>
              </>
            )}

            <Link href={`/${rol}/cuenta`} className="flex items-center gap-3 text-gray-300 hover:text-white">
              <FiUser className="text-xl" />
              <span>Mi cuenta</span>
            </Link>

            <Link href="/ayuda" className="flex items-center gap-3 text-gray-300 hover:text-white">
              <FiHelpCircle className="text-xl" />
              <span>Ayuda</span>
            </Link>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-gray-300 hover:text-white"
        >
          <FiLogOut className="text-xl" />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}