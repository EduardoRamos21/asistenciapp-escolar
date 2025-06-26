import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { HiMagnifyingGlass, HiPlus, HiTrash } from 'react-icons/hi2'
import { RiParentLine } from 'react-icons/ri'
import { FaUserGraduate } from 'react-icons/fa'

export default function AsignarPadre() {
  const [loading, setLoading] = useState(true)
  const [padres, setPadres] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [busquedaPadre, setBusquedaPadre] = useState('')
  const [busquedaAlumno, setBusquedaAlumno] = useState('')
  const [padreSeleccionado, setPadreSeleccionado] = useState(null)
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [escuelaId, setEscuelaId] = useState(null)

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        setLoading(true)

        // Obtener el ID de la escuela del director actual
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: directorData } = await supabase
          .from('directores')
          .select('escuela_id')
          .eq('usuario_id', user.id)
          .single()

        if (!directorData) return
        setEscuelaId(directorData.escuela_id)

        // Cargar padres de la escuela
        const { data: padresData } = await supabase
          .from('usuarios')
          .select('id, nombre, email')
          .eq('rol', 'padre')
          

        if (padresData) {
          setPadres(padresData)
        }

        // Cargar alumnos de la escuela
        const { data: alumnosData } = await supabase
          .from('alumnos')
          .select(`
            id,
            usuarios:usuario_id (id, nombre, email),
            grupos:grupo_id (nombre)
          `)
          .eq('escuela_id', directorData.escuela_id)

        if (alumnosData) {
          const alumnosFormateados = alumnosData.map(a => ({
            id: a.id,
            nombre: a.usuarios?.nombre || 'Sin nombre',
            email: a.usuarios?.email || 'Sin email',
            grupo: a.grupos?.nombre || 'Sin grupo'
          }))
          setAlumnos(alumnosFormateados)
        }

        // Para las asignaciones, usar un cliente con la clave anónima
        // Esto es similar a lo que haces en el API endpoint
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfpacewgyctqtqnlbvhj.supabase.co',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGFjZXdneWN0cXRxbmxidmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTQxNjUsImV4cCI6MjA2NDczMDE2NX0.voerUotXFpQLoTwr-1Ky9RiO6dmDmQ3Aq_IZxXdPD2Q'
        )

        console.log('Intentando consultar con cliente alternativo');
            
        // Primero verificar si hay datos en la tabla padre_alumno
        const { data: checkData, error: checkError } = await supabaseAdmin
          .from('padre_alumno')
          .select('*')

        console.log('Verificación de datos en padre_alumno (admin):', checkData);
        console.log('Error en verificación (admin):', checkError);

        if (checkData && checkData.length > 0) {
          // Si hay datos, hacer la consulta completa
          const { data: asignacionesData, error: asignacionesError } = await supabaseAdmin
            .from('padre_alumno')
            .select(`
              id,
              padre_id,
              alumno_id,
              usuarios:padre_id (id, nombre, email),
              alumnos:alumno_id (id, usuarios:usuario_id (nombre, email), escuela_id)
            `)

          console.log('Asignaciones cargadas (admin):', asignacionesData);
          console.log('Error en asignaciones (admin):', asignacionesError);

          if (asignacionesData) {
            // Filtrar manualmente por escuela_id
            const filteredAsignaciones = asignacionesData.filter(a => 
              a.alumnos?.escuela_id === directorData.escuela_id
            );
            
            console.log('Asignaciones filtradas por escuela:', filteredAsignaciones);
            
            const asignacionesFormateadas = filteredAsignaciones.map(a => ({
              id: a.id,
              padre_id: a.padre_id,
              alumno_id: a.alumno_id,
              nombrePadre: a.usuarios?.nombre || 'Padre',
              nombreAlumno: a.alumnos?.usuarios?.nombre || 'Alumno'
            }))
            
            console.log('Asignaciones formateadas:', asignacionesFormateadas);
            setAsignaciones(asignacionesFormateadas)
          }
        } else {
          console.log('No hay datos en la tabla padre_alumno o error:', checkError);
          setAsignaciones([]);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    obtenerDatos()
  }, [])

  // Filtrar padres según la búsqueda
  const padresFiltrados = padres.filter(padre =>
    padre.nombre.toLowerCase().includes(busquedaPadre.toLowerCase()) ||
    padre.email.toLowerCase().includes(busquedaPadre.toLowerCase())
  )

  // Filtrar alumnos según la búsqueda
  const alumnosFiltrados = alumnos.filter(alumno =>
    alumno.nombre.toLowerCase().includes(busquedaAlumno.toLowerCase()) ||
    alumno.email.toLowerCase().includes(busquedaAlumno.toLowerCase()) ||
    alumno.grupo.toLowerCase().includes(busquedaAlumno.toLowerCase())
  )

  // Asignar un alumno a un padre
  const asignarPadreAlumno = async () => {
    if (!padreSeleccionado || !alumnoSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'Debes seleccionar un padre y un alumno' })
      return
    }

    try {
      // Verificar si ya existe la asignación
      const asignacionExistente = asignaciones.find(
        a => a.padre_id === padreSeleccionado.id && a.alumno_id === alumnoSeleccionado.id
      )

      if (asignacionExistente) {
        setMensaje({ tipo: 'error', texto: 'Esta asignación ya existe' })
        return
      }

      // Obtener el ID del director actual
      const { data: { user } } = await supabase.auth.getUser()
      
      // Usar el endpoint API en lugar de insertar directamente
      const response = await fetch('/api/asignar-padre-alumno', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          padre_id: padreSeleccionado.id,
          alumno_id: alumnoSeleccionado.id,
          directorId: user.id
        }),
      })

      const resultado = await response.json()

      if (!response.ok) {
        throw new Error(resultado.error || 'Error al crear la asignación')
      }

      // Actualizar la lista de asignaciones
      setAsignaciones([
        ...asignaciones,
        {
          id: resultado.data.id,
          padre_id: padreSeleccionado.id,
          alumno_id: alumnoSeleccionado.id,
          nombrePadre: padreSeleccionado.nombre,
          nombreAlumno: alumnoSeleccionado.nombre
        }
      ])

      setMensaje({ tipo: 'exito', texto: 'Asignación creada correctamente' })
      setPadreSeleccionado(null)
      setAlumnoSeleccionado(null)
    } catch (error) {
      console.error('Error al asignar:', error)
      setMensaje({ tipo: 'error', texto: error.message || 'Error al crear la asignación' })
    }
  }

  // Eliminar una asignación
  const eliminarAsignacion = async (id) => {
    try {
      const { error } = await supabase
        .from('padre_alumno')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Actualizar la lista de asignaciones
      setAsignaciones(asignaciones.filter(a => a.id !== id))
      setMensaje({ tipo: 'exito', texto: 'Asignación eliminada correctamente' })
    } catch (error) {
      console.error('Error al eliminar:', error)
      setMensaje({ tipo: 'error', texto: 'Error al eliminar la asignación' })
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Encabezado con gradiente */}
        <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Asignar Padres a Alumnos</h1>
          <p className="text-indigo-100">Gestiona las relaciones entre padres y alumnos de tu escuela</p>
        </div>

        {/* Mensajes de éxito o error con animación y gradiente */}
        {mensaje.texto && (
          <div 
            className={`p-4 mb-8 rounded-xl shadow-md border-l-4 flex items-center animate-fadeIn ${mensaje.tipo === 'exito' 
              ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-500 text-green-800' 
              : 'bg-gradient-to-r from-red-50 to-red-100 border-red-500 text-red-800'
            }`}
          >
            <div className={`rounded-full p-2 mr-3 ${mensaje.tipo === 'exito' ? 'bg-green-200' : 'bg-red-200'}`}>
              {mensaje.tipo === 'exito' 
                ? <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                : <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              }
            </div>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Selección de Padre */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 p-4 flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <RiParentLine className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">Seleccionar Padre</h2>
            </div>
            
            <div className="p-6">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Buscar padre por nombre o email"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  value={busquedaPadre}
                  onChange={(e) => setBusquedaPadre(e.target.value)}
                />
                <HiMagnifyingGlass className="absolute left-3 top-3.5 text-gray-400" />
              </div>

              <div className="h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                  </div>
                ) : padresFiltrados.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
                    No se encontraron padres
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {padresFiltrados.map(padre => (
                      <li 
                        key={padre.id} 
                        className={`p-3 cursor-pointer transition-colors duration-150 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${padreSeleccionado?.id === padre.id ? 'bg-indigo-100 dark:bg-indigo-800/30' : ''}`}
                        onClick={() => setPadreSeleccionado(padre)}
                      >
                        <div className="font-medium dark:text-white">{padre.nombre}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{padre.email}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {padreSeleccionado && (
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="font-medium text-indigo-800 dark:text-indigo-200">Padre seleccionado:</div>
                  <div className="dark:text-white">{padreSeleccionado.nombre}</div>
                  <button 
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    onClick={() => setPadreSeleccionado(null)}
                  >
                    Cancelar selección
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Selección de Alumno */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-4 flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FaUserGraduate className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">Seleccionar Alumno</h2>
            </div>
            
            <div className="p-6">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Buscar alumno por nombre, email o grupo"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  value={busquedaAlumno}
                  onChange={(e) => setBusquedaAlumno(e.target.value)}
                />
                <HiMagnifyingGlass className="absolute left-3 top-3.5 text-gray-400" />
              </div>

              <div className="h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
                  </div>
                ) : alumnosFiltrados.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
                    No se encontraron alumnos
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {alumnosFiltrados.map(alumno => (
                      <li 
                        key={alumno.id} 
                        className={`p-3 cursor-pointer transition-colors duration-150 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${alumnoSeleccionado?.id === alumno.id ? 'bg-purple-100 dark:bg-purple-800/30' : ''}`}
                        onClick={() => setAlumnoSeleccionado(alumno)}
                      >
                        <div className="font-medium dark:text-white">{alumno.nombre}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{alumno.email}</div>
                        <div className="text-xs mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {alumno.grupo}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {alumnoSeleccionado && (
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="font-medium text-purple-800 dark:text-purple-200">Alumno seleccionado:</div>
                  <div className="dark:text-white">{alumnoSeleccionado.nombre}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {alumnoSeleccionado.grupo}
                    </span>
                  </div>
                  <button 
                    className="mt-2 text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                    onClick={() => setAlumnoSeleccionado(null)}
                  >
                    Cancelar selección
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botón para asignar con efecto de gradiente */}
        <div className="flex justify-center mb-8">
          <button
            className={`flex items-center gap-2 px-8 py-4 rounded-xl shadow-lg transition-all duration-300 ${!padreSeleccionado || !alumnoSeleccionado 
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transform hover:scale-105 hover:shadow-xl'}`}
            onClick={asignarPadreAlumno}
            disabled={!padreSeleccionado || !alumnoSeleccionado}
          >
            <HiPlus className="h-5 w-5" />
            <span className="font-medium">Asignar Padre a Alumno</span>
          </button>
        </div>

        {/* Lista de asignaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
            <h2 className="text-lg font-semibold text-white">Asignaciones Actuales</h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : asignaciones.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-lg font-medium">No hay asignaciones de padres a alumnos</p>
                <p className="mt-2">Las asignaciones que crees aparecerán aquí</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">Padre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">Alumno</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {asignaciones.map(asignacion => (
                      <tr key={asignacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                              <RiParentLine className="h-4 w-4" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{asignacion.nombrePadre}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center">
                              <FaUserGraduate className="h-4 w-4" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{asignacion.nombreAlumno}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            className="inline-flex items-center justify-center p-2 rounded-full text-red-600 hover:text-white hover:bg-red-600 transition-colors duration-200"
                            onClick={() => eliminarAsignacion(asignacion.id)}
                            title="Eliminar asignación"
                          >
                            <HiTrash className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}