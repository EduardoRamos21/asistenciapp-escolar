import LayoutAlumno from '@/components/LayoutAlumno'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { HiOutlineDocumentText, HiOutlineCalendarDays, HiOutlineArrowLeft, HiOutlineCloudArrowUp, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2'

export default function DetalleTarea() {
  const router = useRouter()
  const { id } = router.query
  const fileInputRef = useRef(null)

  const [usuario, setUsuario] = useState(null)
  const [tarea, setTarea] = useState(null)
  const [entrega, setEntrega] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [mensajeExito, setMensajeExito] = useState('')
  const [mensajeError, setMensajeError] = useState('')

  // Modificar la función fetchData en el useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
  
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
  
      // Obtener nombre del usuario
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('nombre, avatar_url')
        .eq('id', user.id)
        .single()
      setUsuario({ 
        id: user.id, 
        nombre: usuarioData?.nombre || '',
        avatar_url: usuarioData?.avatar_url 
      })
  
      // Obtener el alumno_id
      const { data: alumno } = await supabase
        .from('alumnos')
        .select('id')
        .eq('usuario_id', user.id)
        .single()
  
      if (!alumno) {
        setMensajeError('No se encontró información del alumno')
        setLoading(false)
        return
      }
  
      // Cargar tarea
      const { data: tareaData } = await supabase
        .from('tareas')
        .select('id, titulo, descripcion, fecha_entrega, materia_id, materias(nombre)')
        .eq('id', id)
        .single()
      setTarea(tareaData)
  
      // Verificar si ya existe una entrega - MODIFICADO PARA USAR LA MISMA LÓGICA QUE EN TAREAS.JS
      const { data: entregasAlumno, error: entregasError } = await supabase
        .from('entregas')
        .select('id, archivo_url, calificacion, comentario, fecha_entrega')
        .eq('tarea_id', id)
        .eq('alumno_id', alumno.id)
      
      // Si hay entregas para esta tarea, usar la primera
      if (entregasAlumno && entregasAlumno.length > 0) {
        setEntrega(entregasAlumno[0])
      } else {
        setEntrega(null)
      }
  
      setLoading(false)
    }
  
    fetchData()
  }, [id])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Verificar que sea un archivo PDF
    if (file.type !== 'application/pdf') {
      setMensajeError('Solo se permiten archivos PDF')
      return
    }

    setArchivoSeleccionado(file)
    setMensajeError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!archivoSeleccionado) {
      setMensajeError('Debes seleccionar un archivo PDF')
      return
    }

    setSubiendoArchivo(true)
    setMensajeError('')
    setMensajeExito('')

    try {
      // Verificar y renovar la sesión
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !sessionData.session) {
        throw new Error('Sesión no válida. Por favor, inicia sesión nuevamente.')
      }
      
      // Obtener el alumno_id
      const { data, error: authError } = await supabase.auth.getUser()
      
      if (authError || !data.user) {
        throw new Error('Error de autenticación. Por favor, inicia sesión nuevamente.')
      }
      
      const user = data.user
      
      const { data: alumno } = await supabase
        .from('alumnos')
        .select('id')
        .eq('usuario_id', user.id)
        .single()

      if (!alumno) {
        throw new Error('No se encontró información del alumno')
      }

      // Crear un nombre único para el archivo
      const fileExt = archivoSeleccionado.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `entregas/${fileName}`

      // Subir el archivo a Supabase Storage con tipo MIME correcto
      const { error: uploadError } = await supabase.storage
        .from('archivos')
        .upload(filePath, archivoSeleccionado, {
          contentType: "application/pdf"
        })

      if (uploadError) {
        throw uploadError
      }

      // Obtener la URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('archivos')
        .getPublicUrl(filePath)

      // Crear o actualizar la entrega en la base de datos
      const entregaData = {
        tarea_id: id,
        alumno_id: alumno.id,
        archivo_url: publicUrl,
        fecha_entrega: new Date().toISOString()
      }

      let query
      let nuevaEntrega = null
      
      if (entrega) {
        // Actualizar entrega existente
        query = supabase
          .from('entregas')
          .update(entregaData)
          .eq('id', entrega.id)
          .select() // Añadir select para obtener los datos actualizados
      } else {
        // Crear nueva entrega
        query = supabase
          .from('entregas')
          .insert(entregaData)
          .select() // Añadir select para obtener los datos insertados
      }

      // En la función handleSubmit, después de la operación de inserción/actualización
      
      // Modificar esta parte:
      const { data: entregaActualizada, error: dbError } = await query
      
      if (dbError) {
        throw dbError
      }
      
      // Actualizar el estado local con la nueva entrega
      if (entregaActualizada && entregaActualizada.length > 0) {
        setEntrega(entregaActualizada[0])
      }
      
      // Añadir esta verificación adicional para asegurarnos de que la entrega se guardó correctamente
      // Consultar directamente la base de datos para confirmar que la entrega existe
      const { data: entregaConfirmada, error: confirmError } = await supabase
        .from('entregas')
        .select('*')
        .eq('tarea_id', id)
        .eq('alumno_id', alumno.id)
        .single()
      
      if (confirmError) {
        console.error('Error al confirmar la entrega:', confirmError)
        throw new Error('No se pudo confirmar que la entrega se guardó correctamente')
      }
      
      // Usar los datos confirmados para actualizar el estado
      setEntrega(entregaConfirmada)
      // Actualizar la UI
      setMensajeExito('¡Tarea entregada correctamente!')
      setArchivoSeleccionado(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // En lugar de recargar la página, actualiza el estado local
      // setTimeout(() => {
      //   router.reload()
      // }, 2000)

    } catch (error) {
      console.error('Error al entregar tarea:', error)
      setMensajeError(`Error al entregar la tarea: ${error.message}`)
    } finally {
      setSubiendoArchivo(false)
    }
  }

  return (
    <LayoutAlumno>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-300">
          {new Date().toLocaleDateString('es-MX', {
            day: '2-digit', month: 'long', year: 'numeric'
          })}
        </h2>
      </div>

      <button 
        onClick={() => router.push('/alumno/tareas')} 
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
      >
        <HiOutlineArrowLeft /> Volver a tareas
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 animate-fade-in">
        <h3 className="text-lg font-bold mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <HiOutlineDocumentText className="text-xl" />
          Detalles de tarea
        </h3>

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

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-700 rounded-full mb-3"></div>
              <div className="h-4 w-24 bg-blue-200 dark:bg-blue-700 rounded"></div>
            </div>
          </div>
        ) : tarea ? (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg mb-6">
              <h4 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-300">{tarea.titulo}</h4>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                <HiOutlineCalendarDays />
                <span>Fecha de entrega: {new Date(tarea.fecha_entrega).toLocaleDateString('es-MX')}</span>
              </div>
              <div className="mb-2 text-gray-700 dark:text-gray-300">{tarea.descripcion}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Materia: {tarea.materias?.nombre}
              </div>
            </div>

            {entrega ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HiOutlineCheckCircle className="text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-700 dark:text-green-400">Tarea entregada</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(entrega.fecha_entrega).toLocaleString('es-MX')}
                  </span>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Archivo entregado:</h5>
                    <a 
                      href={entrega.archivo_url} 
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded" 
                      target="_blank"
                    >
                      <HiOutlineDocumentText />
                      {entrega.archivo_url ? entrega.archivo_url.split('/').pop() : 'Sin archivo'}
                    </a>
                  </div>

                  {entrega.calificacion !== null && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Calificación:</h5>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          parseFloat(entrega.calificacion) >= 6 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {entrega.calificacion}
                        </span>
                      </div>
                    </div>
                  )}

                  {entrega.comentario && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comentarios del profesor:</h5>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                        {entrega.comentario}
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Quieres actualizar tu entrega?</h5>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Selecciona un nuevo archivo PDF:
                        </label>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={subiendoArchivo || !archivoSeleccionado}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                      >
                        <HiOutlineCloudArrowUp />
                        {subiendoArchivo ? 'Subiendo...' : 'Actualizar entrega'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 flex items-center">
                  <HiOutlineXCircle className="text-yellow-600 dark:text-yellow-400 mr-2" />
                  <span className="font-medium text-yellow-700 dark:text-yellow-400">Tarea pendiente de entrega</span>
                </div>
                <div className="p-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Selecciona un archivo PDF para entregar:
                      </label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={subiendoArchivo || !archivoSeleccionado}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    >
                      <HiOutlineCloudArrowUp />
                      {subiendoArchivo ? 'Subiendo...' : 'Entregar tarea'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-red-500">
            Tarea no encontrada.
          </div>
        )}
      </div>
    </LayoutAlumno>
  )
}