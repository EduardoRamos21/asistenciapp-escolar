import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { HiMagnifyingGlass } from 'react-icons/hi2'
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

  // Obtener usuario y sus materias
  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', user.id)
        .single()

      setUsuario({ id: user.id, nombre: usuarioData?.nombre || 'Profesor' })

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
      const { data: materiasData } = await supabase
        .from('materias')
        .select('id, nombre')
        .eq('maestro_id', maestro.id)

      setMaterias(materiasData || [])
      setLoadingMaterias(false)

      // Cargar tareas del maestro
      const { data: tareasData } = await supabase
        .from('tareas')
        .select('id, titulo, fecha_entrega, materia_id')
        .in('materia_id', materiasData.map(m => m.id))

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
        .select('id, titulo, fecha_entrega, materia_id')
        .in('materia_id', materias.map(m => m.id))

      setTareas(nuevasTareas || [])

      setTimeout(() => setMensajeExito(''), 3000)
    }

    setGuardando(false)
  }

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
              <p className="text-sm text-gray-500">Profesor</p>
            </div>
            <Image src="/perfil.jpg" alt="perfil" width={40} height={40} className="rounded-full" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Tareas asignadas</h3>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="flex items-center gap-2 text-[#282424] font-semibold border border-[#282424] px-3 py-1 rounded hover:bg-[#282424] hover:text-white transition"
        >
          ➕ Añadir tarea
        </button>
      </div>

      {mensajeExito && <p className="text-green-600 mb-2">{mensajeExito}</p>}
      {mensajeError && <p className="text-red-600 mb-2">{mensajeError}</p>}

      {mostrarFormulario && (
        <div className="border p-4 rounded mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Título*</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border p-2 rounded"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Materia*</label>
            <select
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Selecciona una materia</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Fecha de entrega</label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="text-right">
            <button
              onClick={añadirTarea}
              disabled={guardando}
              className="bg-[#282424] text-white px-4 py-2 rounded hover:bg-[#1f1c1c] disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar tarea'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Cargando tareas...</p>
      ) : tareas.length === 0 ? (
        <p className="text-gray-500">No hay tareas asignadas</p>
      ) : (
        <div className="border border-black rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 font-semibold px-4 py-2 border-b bg-gray-100">
            <span>Título</span>
            <span>Fecha de entrega</span>
            <span>Ver entregas</span>
          </div>
          {tareas.map(t => (
            <div key={t.id} className="grid grid-cols-3 px-4 py-2 border-b items-center">
              <span>{t.titulo}</span>
              <span>{new Date(t.fecha_entrega).toLocaleDateString()}</span>
              <button
                onClick={() => router.push(`/maestro/tareas/${t.id}`)}
                className="hover:scale-110 transition text-gray-600"
              >
                <HiMagnifyingGlass size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
