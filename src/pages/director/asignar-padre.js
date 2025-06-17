import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { HiMagnifyingGlass, HiPlus, HiTrash } from 'react-icons/hi2'

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Asignar Padres a Alumnos</h1>
        <p className="text-gray-600">Gestiona las relaciones entre padres y alumnos</p>
      </div>

      {mensaje.texto && (
        <div className={`p-4 mb-6 rounded-lg ${
          mensaje.tipo === 'exito' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Selección de Padre */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Seleccionar Padre</h2>
          
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Buscar padre por nombre o email"
              className="w-full p-3 border rounded-lg pl-10"
              value={busquedaPadre}
              onChange={(e) => setBusquedaPadre(e.target.value)}
            />
            <HiMagnifyingGlass className="absolute left-3 top-3.5 text-gray-400" />
          </div>

          <div className="h-64 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
              </div>
            ) : padresFiltrados.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500">
                No se encontraron padres
              </div>
            ) : (
              <ul className="divide-y">
                {padresFiltrados.map(padre => (
                  <li 
                    key={padre.id} 
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${
                      padreSeleccionado?.id === padre.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setPadreSeleccionado(padre)}
                  >
                    <div className="font-medium">{padre.nombre}</div>
                    <div className="text-sm text-gray-500">{padre.email}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {padreSeleccionado && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="font-medium">Padre seleccionado:</div>
              <div>{padreSeleccionado.nombre}</div>
              <button 
                className="mt-2 text-sm text-red-600 hover:text-red-800"
                onClick={() => setPadreSeleccionado(null)}
              >
                Cancelar selección
              </button>
            </div>
          )}
        </div>

        {/* Selección de Alumno */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Seleccionar Alumno</h2>
          
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Buscar alumno por nombre, email o grupo"
              className="w-full p-3 border rounded-lg pl-10"
              value={busquedaAlumno}
              onChange={(e) => setBusquedaAlumno(e.target.value)}
            />
            <HiMagnifyingGlass className="absolute left-3 top-3.5 text-gray-400" />
          </div>

          <div className="h-64 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
              </div>
            ) : alumnosFiltrados.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500">
                No se encontraron alumnos
              </div>
            ) : (
              <ul className="divide-y">
                {alumnosFiltrados.map(alumno => (
                  <li 
                    key={alumno.id} 
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${
                      alumnoSeleccionado?.id === alumno.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setAlumnoSeleccionado(alumno)}
                  >
                    <div className="font-medium">{alumno.nombre}</div>
                    <div className="text-sm text-gray-500">{alumno.email}</div>
                    <div className="text-xs text-gray-400">Grupo: {alumno.grupo}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {alumnoSeleccionado && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="font-medium">Alumno seleccionado:</div>
              <div>{alumnoSeleccionado.nombre}</div>
              <div className="text-sm text-gray-500">Grupo: {alumnoSeleccionado.grupo}</div>
              <button 
                className="mt-2 text-sm text-red-600 hover:text-red-800"
                onClick={() => setAlumnoSeleccionado(null)}
              >
                Cancelar selección
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Botón para asignar */}
      <div className="flex justify-center mb-8">
        <button
          className="flex items-center gap-2 bg-[#282424] text-white px-6 py-3 rounded-lg shadow hover:bg-[#3b3939] transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={asignarPadreAlumno}
          disabled={!padreSeleccionado || !alumnoSeleccionado}
        >
          <HiPlus />
          <span>Asignar Padre a Alumno</span>
        </button>
      </div>

      {/* Lista de asignaciones */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Asignaciones Actuales</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : asignaciones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay asignaciones de padres a alumnos
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Padre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {asignaciones.map(asignacion => (
                  <tr key={asignacion.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{asignacion.nombrePadre}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{asignacion.nombreAlumno}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => eliminarAsignacion(asignacion.id)}
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
    </Layout>
  )
}