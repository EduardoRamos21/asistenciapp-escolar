import Layout from '@/components/Layout'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { HiPaperAirplane } from 'react-icons/hi2'

export default function DetalleTarea() {
  const router = useRouter()
  const { id } = router.query

  const [usuario, setUsuario] = useState(null)
  const [tarea, setTarea] = useState(null)
  const [entregas, setEntregas] = useState([])
  const [loading, setLoading] = useState(true)
  const [calificaciones, setCalificaciones] = useState({})
  const [mensajeExito, setMensajeExito] = useState('')
  const [mensajeError, setMensajeError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Obtener nombre del usuario
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', user.id)
        .single()
      setUsuario({ id: user.id, nombre: usuarioData?.nombre || '' })

      // Cargar tarea
      const { data: tareaData } = await supabase
        .from('tareas')
        .select('id, titulo, descripcion, fecha_entrega')
        .eq('id', id)
        .single()
      setTarea(tareaData)

      // Cargar entregas con nombre del alumno
      const { data: entregasData } = await supabase
        .from('entregas')
        .select('id, archivo_url, calificacion, alumno_id, fecha_entrega, alumnos:alumno_id (usuario_id), alumnos!inner.usuarios (nombre)')
        .eq('tarea_id', id)

      const entregasFormateadas = (entregasData || []).map((e) => ({
        id: e.id,
        archivo: e.archivo_url,
        calificacion: e.calificacion,
        alumno_id: e.alumno_id,
        nombre: e.usuarios?.nombre || 'Alumno',
      }))
      setEntregas(entregasFormateadas)

      // Inicializar calificaciones
      const inicial = {}
      entregasFormateadas.forEach(e => {
        inicial[e.id] = e.calificacion || ''
      })
      setCalificaciones(inicial)

      setLoading(false)
    }

    if (id) fetchData()
  }, [id])

  const handleChange = (entregaId, value) => {
    const numero = parseFloat(value)
    if (isNaN(numero) || numero < 0 || numero > 10) return
    setCalificaciones(prev => ({ ...prev, [entregaId]: value }))
  }

  const handleEnviar = async () => {
    const cambios = Object.entries(calificaciones)
      .filter(([_, calif]) => calif !== '')
      .map(([id, calif]) => ({
        id: parseInt(id),
        calificacion: parseFloat(calif),
      }))

    if (cambios.length === 0) {
      setMensajeError('No hay calificaciones para guardar.')
      return
    }

    setGuardando(true)
    setMensajeError('')
    setMensajeExito('')

    try {
      const { error } = await supabase
        .from('entregas')
        .upsert(cambios, { onConflict: 'id' })
      if (error) {
        setMensajeError(error.message)
      } else {
        setMensajeExito('Calificaciones guardadas correctamente.')
        setTimeout(() => setMensajeExito(''), 3000)
      }
    } catch (err) {
      setMensajeError('Error al guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {new Date().toLocaleDateString('es-MX', {
            day: '2-digit', month: 'long', year: 'numeric'
          })}
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

      <h3 className="text-lg font-bold mb-2">Detalles de tarea</h3>

      {mensajeExito && <p className="text-green-600 mb-3">{mensajeExito}</p>}
      {mensajeError && <p className="text-red-600 mb-3">{mensajeError}</p>}

      {loading ? (
        <p>Cargando...</p>
      ) : tarea ? (
        <>
          <h4 className="text-xl font-semibold mb-4">{tarea.titulo}</h4>
          <p className="mb-2 text-gray-700">{tarea.descripcion}</p>
          <p className="text-sm text-gray-500 mb-6">
            Fecha de entrega: {new Date(tarea.fecha_entrega).toLocaleDateString('es-MX')}
          </p>

          {entregas.length === 0 ? (
            <p className="text-gray-500">No hay entregas aún.</p>
          ) : (
            <>
              <div className="border rounded-lg">
                <div className="grid grid-cols-3 font-semibold px-4 py-2 bg-gray-100 border-b">
                  <span>Alumno</span>
                  <span>Archivo</span>
                  <span>Calificación</span>
                </div>
                {entregas.map(e => (
                  <div key={e.id} className="grid grid-cols-3 items-center px-4 py-2 border-b">
                    <span>{e.nombre}</span>
                    <a href={e.archivo} className="text-blue-600 hover:underline" target="_blank">
                      {e.archivo ? e.archivo.split('/').pop() : 'Sin archivo'}
                    </a>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={calificaciones[e.id] || ''}
                      onChange={(ev) => handleChange(e.id, ev.target.value)}
                      className="border w-20 p-1 rounded text-center"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleEnviar}
                  disabled={guardando}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 disabled:opacity-50"
                >
                  <HiPaperAirplane className="rotate-90" /> {guardando ? 'Guardando...' : 'Guardar calificaciones'}
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <p className="text-red-500">Tarea no encontrada.</p>
      )}
    </Layout>
  )
}
