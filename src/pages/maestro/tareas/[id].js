import LayoutMaestro from '@/components/LayoutMaestro'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { HiPaperAirplane, HiOutlineDocumentText, HiOutlineCalendarDays, HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2'
import { Document, Page, pdfjs } from 'react-pdf';
// Configurar el worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function DetalleTarea() {
  const router = useRouter()
  const { id } = router.query

  const [usuario, setUsuario] = useState(null)
  const [tarea, setTarea] = useState(null)
  const [entregas, setEntregas] = useState([])
  const [loading, setLoading] = useState(true)
  const [calificaciones, setCalificaciones] = useState({})
  const [comentarios, setComentarios] = useState({})
  const [mensajeExito, setMensajeExito] = useState('')
  const [mensajeError, setMensajeError] = useState('')
  const [guardando, setGuardando] = useState(false)
  
  // Estados para el visor de PDF
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
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

      // Cargar tarea
      const { data: tareaData } = await supabase
        .from('tareas')
        .select('id, titulo, descripcion, fecha_entrega, materia_id, materias(nombre)')
        .eq('id', id)
        .single()
      setTarea(tareaData)

      // Cargar entregas con nombre del alumno
      // En el useEffect, modificar la consulta de entregas
      const { data: entregasData, error: entregasError } = await supabase
        .from('entregas')
        .select(`
          id, 
          archivo_url, 
          calificacion, 
          comentario, 
          alumno_id, 
          fecha_entrega, 
          alumnos:alumno_id (usuario_id, usuarios:usuario_id (nombre, avatar_url))
        `)
        .eq('tarea_id', id)
      
      if (entregasError) {
        console.error('Error al obtener entregas:', entregasError)
        setMensajeError('Error al cargar las entregas')
      }
      
      console.log('Entregas obtenidas:', entregasData) // Para depuración
      
      const entregasFormateadas = (entregasData || []).map((e) => ({
        id: e.id,
        archivo_url: e.archivo_url,  // Cambia 'archivo' a 'archivo_url' para mantener consistencia
        calificacion: e.calificacion,
        comentario: e.comentario || '',
        alumno_id: e.alumno_id,
        fecha_entrega: e.fecha_entrega,
        nombre: e.alumnos?.usuarios?.nombre || 'Alumno',
        avatar_url: e.alumnos?.usuarios?.avatar_url
      }))
      setEntregas(entregasFormateadas)

      // Inicializar calificaciones y comentarios
      const inicialCalif = {}
      const inicialComent = {}
      entregasFormateadas.forEach(e => {
        inicialCalif[e.id] = e.calificacion || ''
        inicialComent[e.id] = e.comentario || ''
      })
      setCalificaciones(inicialCalif)
      setComentarios(inicialComent)

      setLoading(false)
    }

    if (id) fetchData()
  }, [id])

  const handleCalificacionChange = (entregaId, value) => {
    const numero = parseFloat(value)
    if (isNaN(numero) || numero < 0 || numero > 10) return
    setCalificaciones(prev => ({ ...prev, [entregaId]: value }))
  }

  const handleComentarioChange = (entregaId, value) => {
    setComentarios(prev => ({ ...prev, [entregaId]: value }))
  }

  // Funciones para el visor de PDF
  const handleOpenPdf = (url) => {
    // Usar el proxy para servir el PDF con los encabezados correctos
    const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
    setPdfUrl(proxyUrl);
    setPageNumber(1);
    setNumPages(null);
  };

  const handleClosePdf = () => {
    setPdfUrl(null);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleEnviar = async () => {
    const cambios = Object.entries(calificaciones)
      .filter(([id, calif]) => calif !== '')
      .map(([id, calif]) => ({
        id: parseInt(id),
        calificacion: parseFloat(calif),
        comentario: comentarios[id] || null
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
    <LayoutMaestro>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-indigo-800 dark:text-indigo-300">
          {new Date().toLocaleDateString('es-MX', {
            day: '2-digit', month: 'long', year: 'numeric'
          })}
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

      <button 
        onClick={() => router.push('/maestro/tareas')} 
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4 transition-colors"
      >
        <HiOutlineArrowLeft /> Volver a tareas
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 animate-fade-in">
        <h3 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
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
              <div className="w-12 h-12 bg-indigo-200 dark:bg-indigo-700 rounded-full mb-3"></div>
              <div className="h-4 w-24 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
            </div>
          </div>
        ) : tarea ? (
          <>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg mb-6">
              <h4 className="text-xl font-semibold mb-2 text-indigo-800 dark:text-indigo-300">{tarea.titulo}</h4>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                <HiOutlineCalendarDays />
                <span>Fecha de entrega: {new Date(tarea.fecha_entrega).toLocaleDateString('es-MX')}</span>
              </div>
              <div className="mb-2 text-gray-700 dark:text-gray-300">{tarea.descripcion}</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                Materia: {tarea.materias?.nombre}
              </div>
            </div>

            {entregas.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No hay entregas aún.
              </div>
            ) : (
              <>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Entregas de alumnos ({entregas.length})</h4>
                <div className="space-y-4">
                  {entregas.map(e => (
                    <div key={e.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center">
                            {e.avatar_url ? (
                              <Image src={e.avatar_url} alt={e.nombre} width={40} height={40} className="rounded-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                                {e.nombre.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{e.nombre}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Entregado: {new Date(e.fecha_entrega).toLocaleString('es-MX')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {e.calificacion !== null && e.calificacion !== '' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <HiOutlineCheckCircle className="mr-1" /> Calificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              <HiOutlineXCircle className="mr-1" /> Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Archivo entregado</label>
                          {/* Modificado para usar el visor de PDF en lugar de abrir en nueva pestaña */}
                          <button 
                            onClick={() => handleOpenPdf(e.archivo_url)} 
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded w-full text-left" 
                          >
                            <HiOutlineDocumentText />
                            {e.archivo_url ? `${e.archivo_url.split('/').pop()}` : 'Sin archivo'}
                          </button>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Calificación (0-10)</label>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={calificaciones[e.id] || ''}
                            onChange={(ev) => handleCalificacionChange(e.id, ev.target.value)}
                            className="border border-gray-300 dark:border-gray-600 p-2 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentario (opcional)</label>
                          <textarea
                            value={comentarios[e.id] || ''}
                            onChange={(ev) => handleComentarioChange(e.id, ev.target.value)}
                            className="border border-gray-300 dark:border-gray-600 p-2 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            rows={2}
                            placeholder="Retroalimentación para el alumno"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleEnviar}
                    disabled={guardando}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <HiPaperAirplane className="rotate-90" /> {guardando ? 'Guardando...' : 'Guardar calificaciones'}
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-red-500">
            Tarea no encontrada.
          </div>
        )}
      </div>
      
      {/* Modal para visualizar PDF */}
      {pdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium">Visualizador de PDF</h3>
              <button 
                onClick={handleClosePdf}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex flex-col items-center">
              {/* Reemplazar react-pdf con iframe */}
              <iframe 
                src={pdfUrl} 
                className="w-full h-[70vh] border-0"
                title="Visualizador de PDF"
              ></iframe>
              
              <a 
                href={pdfUrl} 
                download={pdfUrl ? pdfUrl.split('/').pop() : 'documento.pdf'}
                className="mt-4 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Descargar PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </LayoutMaestro>
  )
}