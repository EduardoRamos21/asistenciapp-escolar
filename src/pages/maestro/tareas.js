import Layout from '@/components/LayoutMaestro'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { HiMagnifyingGlass, HiOutlineDocumentText, HiOutlinePlus, HiOutlineCalendarDays, HiOutlineBookOpen } from 'react-icons/hi2'
import { supabase } from '@/lib/supabase'

export default function Tareas() {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [materias, setMaterias] = useState([])
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMaterias, setLoadingMaterias] = useState(true)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [materiaId, setMateriaId] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [mensajeError, setMensajeError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  // Obtener usuario y sus materias
  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('nombre, avatar_url')
        .eq('id', user.id)
        .single()

      setUsuario({ 
        id: user.id, 
        nombre: usuarioData?.nombre || 'Profesor',
        avatar_url: usuarioData?.avatar_url
      })

      const { data: maestro } = await supabase
        .from('maestros')
        .select('id')
        .eq('usuario_id', user.id)
        .single()

      if (!maestro) {
        setMensajeError('No se encontró al maestro')
        return
      }

      // Cargar materias del maestro
      const { data: asignacionesData, error: errorAsignaciones } = await supabase
        .from('asignaciones')
        .select('materia_id, materias(id, nombre)')
        .eq('maestro_id', maestro.id);
      
      if (errorAsignaciones) {
        setMensajeError('Error al cargar materias: ' + errorAsignaciones.message);
        return;
      }
      
      // Extraer materias únicas de las asignaciones
      const materiasMap = {};
      asignacionesData.forEach(asignacion => {
        if (asignacion.materias) {
          materiasMap[asignacion.materias.id] = asignacion.materias;
        }
      });
      const materiasData = Object.values(materiasMap);
      
      setMaterias(materiasData || []);
      setLoadingMaterias(false);

      // Cargar tareas del maestro
      const { data: tareasData } = await supabase
        .from('tareas')
        .select('id, titulo, descripcion, fecha_entrega, materia_id, materias(nombre)')
        .in('materia_id', materiasData.map(m => m.id))
        .order('fecha_entrega', { ascending: false })

      setTareas(tareasData || [])
      setLoading(false)
    }

    obtenerDatos()
  }, [])

  const añadirTarea = async () => {
    setMensajeError('')
    setMensajeExito('')

    if (titulo.trim() === '') {
      setMensajeError('El título es obligatorio')
      return
    }

    if (!materiaId) {
      setMensajeError('Selecciona una materia')
      return
    }

    setGuardando(true)

    const fechaFormateada = fechaEntrega
      ? new Date(fechaEntrega).toISOString()
      : new Date().toISOString()

    const { error } = await supabase.from('tareas').insert([{
      titulo,
      descripcion,
      materia_id: parseInt(materiaId),
      fecha_entrega: fechaFormateada
    }])

    if (error) {
      setMensajeError(error.message)
    } else {
      setMensajeExito('Tarea creada correctamente')
      setTitulo('')
      setDescripcion('')
      setMateriaId('')
      setFechaEntrega('')
      setMostrarFormulario(false)

      // Actualizar lista
      const { data: nuevasTareas } = await supabase
        .from('tareas')
        .select('id, titulo, descripcion, fecha_entrega, materia_id, materias(nombre)')
        .in('materia_id', materias.map(m => m.id))
        .order('fecha_entrega', { ascending: false })

      setTareas(nuevasTareas || [])

      setTimeout(() => setMensajeExito(''), 3000)
    }

    setGuardando(false)
  }

  // Filtrar tareas según búsqueda
  const tareasFiltradas = tareas.filter(tarea => 
    tarea.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    tarea.materias?.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-indigo-800 dark:text-indigo-300">
          {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
        </h2>
        {usuario && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold">{usuario.nombre}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Profesor</p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center">
              {usuario.avatar_url ? (
                <Image src={usuario.avatar_url} alt="perfil" width={40} height={40} className="rounded-full object-cover" />
              ) : (
                <Image src="/perfil.jpg" alt="perfil" width={40} height={40} className="rounded-full" />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <HiOutlineDocumentText className="text-xl" />
            Gestión de Tareas
          </h3>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            <HiOutlinePlus className="text-lg" /> {mostrarFormulario ? 'Cancelar' : 'Nueva tarea'}
          </button>
        </div>

        {mensajeExito && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded animate-fade-in">
            {mensajeExito}
          </div>
        )}
        
        {mensajeError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded animate-fade-in">
            {mensajeError}
          </div>
        )}

        {mostrarFormulario && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg mb-6 animate-fade-in">
            <h4 className="font-medium text-indigo-800 dark:text-indigo-300 mb-4">Nueva Tarea</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título*</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Título de la tarea"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Materia*</label>
                <div className="relative">
                  <select
                    value={materiaId}
                    onChange={(e) => setMateriaId(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
                  >
                    <option value="">Selecciona una materia</option>
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <HiOutlineBookOpen className="text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Instrucciones detalladas para los alumnos"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de entrega</label>
              <div className="relative">
                <input
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <HiOutlineCalendarDays className="text-gray-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={añadirTarea}
                disabled={guardando}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {guardando ? 'Guardando...' : 'Guardar tarea'}
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <HiMagnifyingGlass className="text-gray-500" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 bg-indigo-200 dark:bg-indigo-700 rounded-full mb-3"></div>
              <div className="h-4 w-24 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
            </div>
          </div>
        ) : tareasFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {busqueda ? 'No se encontraron tareas con esa búsqueda' : 'No hay tareas asignadas'}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="grid grid-cols-12 font-semibold px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-b">
              <span className="col-span-5">Título</span>
              <span className="col-span-3">Materia</span>
              <span className="col-span-3">Fecha de entrega</span>
              <span className="col-span-1 text-center">Ver</span>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {tareasFiltradas.map(t => (
                <div key={t.id} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <span className="col-span-5 font-medium text-gray-800 dark:text-gray-200">{t.titulo}</span>
                  <span className="col-span-3 text-gray-600 dark:text-gray-400">{t.materias?.nombre}</span>
                  <span className="col-span-3 text-gray-600 dark:text-gray-400">{new Date(t.fecha_entrega).toLocaleDateString()}</span>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => router.push(`/maestro/tareas/${t.id}`)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                      title="Ver entregas y calificar"
                    >
                      <HiMagnifyingGlass size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}