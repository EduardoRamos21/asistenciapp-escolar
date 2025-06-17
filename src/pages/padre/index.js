import Layout from '@/components/Layout'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function VistaPadre() {
  const [usuario, setUsuario] = useState(null)
  const [hijos, setHijos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Obtener datos del usuario
        const { data } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', user.id)
          .single()

        if (data) {
          setUsuario({
            id: user.id,
            nombre: data.nombre,
            email: user.email
          })
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
      }
      setLoading(false)
    }

    obtenerDatos()
  }, [])

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
        </h2>
        {usuario && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold">{usuario.nombre}</p>
              <p className="text-sm text-gray-500">Padre</p>
            </div>
            <Image src="/perfil.jpg" alt="perfil" width={40} height={40} className="rounded-full" />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Mis hijos</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : hijos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No tienes hijos asignados todavía.</p>
            <p className="text-sm text-gray-500">El director de la escuela debe asignarte como padre de un alumno.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hijos.map(hijo => (
              <div key={hijo.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-3">
                  <Image src="/alumno1.jpg" alt={hijo.nombre} width={50} height={50} className="rounded-full" />
                  <h4 className="font-medium">{hijo.nombre}</h4>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/padre/hijo/${hijo.id}/asistencia`} className="flex-1">
                    <button className="w-full bg-[#282424] text-white px-3 py-2 rounded hover:bg-[#3b3939] text-sm">
                      Ver asistencia
                    </button>
                  </Link>
                  <Link href={`/padre/hijo/${hijo.id}/tareas`} className="flex-1">
                    <button className="w-full bg-[#282424] text-white px-3 py-2 rounded hover:bg-[#3b3939] text-sm">
                      Ver tareas
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
