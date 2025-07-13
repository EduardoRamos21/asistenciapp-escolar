import LayoutPadre from '@/components/LayoutPadre'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FaUserGraduate, FaClipboardCheck, FaBook, FaChild, FaUser } from 'react-icons/fa'

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

  // Función para obtener un color aleatorio pero consistente para cada hijo
  const getColorForChild = (id) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-amber-500 to-amber-600',
      'from-rose-500 to-rose-600',
      'from-cyan-500 to-cyan-600'
    ]
    // Usar el ID para seleccionar un color consistente
    const colorIndex = parseInt(id.toString().slice(-1)) % colors.length
    return colors[colorIndex]
  }

  return (
    <LayoutPadre>
      {/* Encabezado con fecha y perfil */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bienvenido, {usuario?.nombre || 'Padre'}</h1>
          <p className="text-blue-100 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {usuario && (
          <Link href="/padre/cuenta">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right">
                <p className="font-semibold">{usuario.nombre}</p>
                <p className="text-sm text-blue-200">Padre de familia</p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <FaUser className="h-6 w-6 text-white" />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Sección de hijos */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 mb-8">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 p-4 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <FaUserGraduate className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white">Mis hijos</h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
                <div className="w-16 h-16 border-l-4 border-r-4 border-transparent rounded-full animate-spin absolute top-0 opacity-75"></div>
              </div>
            </div>
          ) : hijos.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 max-w-md mx-auto">
                <svg className="mx-auto h-16 w-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tienes hijos asignados todavía</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">El director de la escuela debe asignarte como padre de un alumno para que puedas ver su información.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hijos.map(hijo => (
                <div 
                  key={hijo.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:transform hover:scale-[1.02]"
                >
                  <div className={`bg-gradient-to-r ${getColorForChild(hijo.id)} p-4 flex items-center gap-3`}>
                    <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center">
                      <FaChild className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{hijo.nombre}</h3>
                      <p className="text-white/80 text-sm">Estudiante</p>
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Link href={`/padre/hijo/${hijo.id}/asistencia`}>
                        <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors duration-200 group">
                          <div className="p-3 bg-blue-100 dark:bg-blue-800/50 rounded-full mb-2 group-hover:bg-blue-200 dark:group-hover:bg-blue-700/50 transition-colors duration-200">
                            <FaClipboardCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-blue-700 dark:text-blue-300 font-medium text-sm">Asistencia</span>
                        </div>
                      </Link>
                      
                      <Link href={`/padre/hijo/${hijo.id}/tareas`}>
                        <div className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors duration-200 group">
                          <div className="p-3 bg-purple-100 dark:bg-purple-800/50 rounded-full mb-2 group-hover:bg-purple-200 dark:group-hover:bg-purple-700/50 transition-colors duration-200">
                            <FaBook className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-purple-700 dark:text-purple-300 font-medium text-sm">Tareas</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Sección de información o consejos */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">Consejos para padres</h3>
        <p className="text-blue-700 dark:text-blue-400 mb-4">Mantente al día con la asistencia y tareas de tus hijos para apoyar su educación.</p>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Revisa regularmente la plataforma para estar informado.</span>
        </div>
      </div>
    </LayoutPadre>
  )
}