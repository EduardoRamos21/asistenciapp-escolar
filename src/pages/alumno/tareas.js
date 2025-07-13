import Layout from '@/components/LayoutAlumno'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { HiMagnifyingGlass, HiOutlineCloudArrowUp } from 'react-icons/hi2'
import { supabase } from '@/lib/supabase'

export default function TareasAlumno() {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)

  // Obtener usuario y sus tareas
  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', user.id)
        .single()

      setUsuario({ id: user.id, nombre: usuarioData?.nombre || 'Alumno' })

      // Obtener el alumno_id
      const { data: alumno } = await supabase
        .from('alumnos')
        .select('id, grupo_id')
        .eq('usuario_id', user.id)
        .single()

      if (!alumno) {
        console.error('No se encontró al alumno')
        setLoading(false)
        return
      }

      // Obtener materias del grupo del alumno a través de asignaciones
      const { data: asignacionesGrupo } = await supabase
        .from('asignaciones')
        .select('materia_id')
        .eq('grupo_id', alumno.grupo_id)

      if (!asignacionesGrupo || asignacionesGrupo.length === 0) {
        setLoading(false)
        return
      }

      // Extraer IDs de materias de las asignaciones
      const materiaIds = asignacionesGrupo.map(a => a.materia_id);

      // Obtener TODAS las tareas de las materias del grupo
      const { data: todasLasTareas } = await supabase
        .from('tareas')
        .select(`
          id, 
          titulo, 
          descripcion,
          fecha_entrega,
          materia_id,
          materias:materia_id (nombre)
        `)
        .in('materia_id', materiaIds)

      // Obtener todas las entregas del alumno
      const { data: entregasAlumno } = await supabase
        .from('entregas')
        .select('tarea_id, archivo_url, calificacion')
        .eq('alumno_id', alumno.id)

      // Crear un mapa de entregas por tarea_id para búsqueda rápida
      const entregasPorTarea = {}
      if (entregasAlumno) {
        entregasAlumno.forEach(entrega => {
          entregasPorTarea[entrega.tarea_id] = entrega
        })
      }

      // Combinar y formatear tareas
      const tareasFormateadas = (todasLasTareas || []).map(tarea => {
        const entrega = entregasPorTarea[tarea.id]
        return {
          id: tarea.id,
          titulo: tarea.titulo,
          descripcion: tarea.descripcion,
          fecha_entrega: tarea.fecha_entrega,
          materia: tarea.materias?.nombre || 'Sin materia',
          entregada: !!entrega,
          calificacion: entrega?.calificacion,
          archivo_url: entrega?.archivo_url
        }
      })

      // Ordenar por fecha de entrega (más recientes primero)
      tareasFormateadas.sort((a, b) => new Date(b.fecha_entrega) - new Date(a.fecha_entrega))

      setTareas(tareasFormateadas)
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
        {/* Se eliminó la información del usuario que aparecía aquí */}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Mis tareas</h3>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : tareas.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No tienes tareas asignadas</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tareas.map(tarea => (
            <div 
              key={tarea.id} 
              className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${tarea.entregada ? 'border-green-200 dark:border-green-900' : 'border-yellow-200 dark:border-yellow-900'}`}
            >
              <div className={`px-4 py-3 ${tarea.entregada ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'} flex justify-between items-center`}>
                <h4 className="font-medium">{tarea.titulo}</h4>
                <span className="text-xs px-2 py-1 rounded-full ${tarea.entregada ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'}">
                  {tarea.entregada ? 'Entregada' : 'Pendiente'}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{tarea.descripcion || 'Sin descripción'}</p>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>Materia: {tarea.materia}</span>
                  <span>Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString()}</span>
                </div>
                
                {tarea.entregada && tarea.calificacion !== null && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-medium">Calificación:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${Number(tarea.calificacion) >= 6 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {tarea.calificacion}
                    </span>
                  </div>
                )}
                
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => router.push(`/alumno/tareas/${tarea.id}`)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    {tarea.entregada ? <HiMagnifyingGlass size={18} /> : <HiOutlineCloudArrowUp size={18} />}
                    <span>{tarea.entregada ? 'Ver entrega' : 'Entregar'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}