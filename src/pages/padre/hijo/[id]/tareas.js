import LayoutPadre from '@/components/LayoutPadre';
import { useRouter } from 'next/router';
import { useRef, useEffect, useState } from 'react';
// Elimina esta importación estática
// import html2pdf from 'html2pdf.js';
import useTareasHijo from '@/hooks/useTareasHijo';
import { supabase } from '@/lib/supabase';
import { FaUser, FaChild, FaFileDownload, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaBook } from 'react-icons/fa';

export default function TareasHijo() {
  const router = useRouter();
  const { id } = router.query;
  const { tareas, alumno, loading, error } = useTareasHijo(id);
  const [usuario, setUsuario] = useState(null);
  const contentRef = useRef();

  // Obtener información del usuario
  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUsuario({
            id: user.id,
            nombre: data.nombre,
            email: user.email
          });
        }
      }
    };

    obtenerUsuario();
  }, []);

  // Función para exportar a PDF
  const exportarPDF = async () => {
    // Importación dinámica de html2pdf solo en el cliente
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Mostrar indicador de carga
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loadingIndicator.innerHTML = '<div class="bg-white p-4 rounded-lg"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-2"></div><p class="text-center">Generando PDF...</p></div>';
    document.body.appendChild(loadingIndicator);
    
    try {
      // Crear un iframe temporal
      const iframe = document.createElement('iframe');
      iframe.style.visibility = 'hidden';
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      document.body.appendChild(iframe);
      
      // Obtener el contenido original
      const originalContent = contentRef.current.innerHTML;
      
      // Escribir en el iframe con estilos básicos (sin Tailwind)
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      iframeDocument.open();
      iframeDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Exportación PDF</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 20px;
            }
            .header {
              display: flex;
              align-items: center;
              margin-bottom: 20px;
              border-bottom: 1px solid #eee;
              padding-bottom: 15px;
            }
            .avatar {
              width: 60px;
              height: 60px;
              background: #6366f1;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              color: white;
              font-size: 24px;
            }
            .info {
              flex: 1;
            }
            .title {
              font-weight: bold;
              font-size: 18px;
              margin: 0;
            }
            .subtitle {
              color: #6366f1;
              margin: 5px 0 0 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              background: #f3f4f6;
              padding: 10px;
              text-align: left;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #eee;
            }
            .check {
              color: #22c55e;
              font-size: 18px;
            }
            .cross {
              color: #ef4444;
              font-size: 18px;
            }
            .empty-message {
              text-align: center;
              padding: 30px;
              background: #f9fafb;
              border-radius: 8px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          ${originalContent}
        </body>
        </html>
      `);
      iframeDocument.close();
      
      // Reemplazar iconos con texto o símbolos básicos
      // Reemplazar iconos SVG con elementos span
      const checkIcons = iframeDocument.querySelectorAll('.text-green-500');
      checkIcons.forEach(icon => {
        const span = iframeDocument.createElement('span');
        span.innerHTML = '✓';
        span.className = 'check';
        icon.parentNode.replaceChild(span, icon);
      });
      
      const crossIcons = iframeDocument.querySelectorAll('.text-red-500');
      crossIcons.forEach(icon => {
        const span = iframeDocument.createElement('span');
        span.innerHTML = '✗';
        span.className = 'cross';
        icon.parentNode.replaceChild(span, icon);
      });
      
      // Configuración para html2pdf
      const options = {
        margin: 0.5,
        filename: `tareas_${alumno?.nombre || 'alumno'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      // Generar PDF desde el iframe
      html2pdf()
        .from(iframeDocument.body)
        .set(options)
        .save()
        .then(() => {
          // Limpiar
          document.body.removeChild(iframe);
          document.body.removeChild(loadingIndicator);
        })
        .catch(error => {
          console.error('Error al generar PDF:', error);
          document.body.removeChild(iframe);
          document.body.removeChild(loadingIndicator);
          alert('Hubo un problema al generar el PDF. Por favor intente nuevamente.');
        });
    } catch (error) {
      console.error('Error en la preparación del PDF:', error);
      document.body.removeChild(loadingIndicator);
      alert('Hubo un problema al preparar el PDF. Por favor intente nuevamente.');
    }
  };

  return (
    <LayoutPadre>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header con fecha y perfil */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <FaCalendarAlt className="text-indigo-500" />
            <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </h2>
          </div>
          {usuario && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold">{usuario.nombre}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Padre</p>
              </div>
              <div className="relative h-10 w-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                <FaUser className="text-white text-lg" />
              </div>
            </div>
          )}
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6 shadow-sm">
            <div className="flex items-center">
              <FaTimesCircle className="mr-2" />
              <p>Error al cargar tareas: {error}</p>
            </div>
          </div>
        )}

        {/* Botón PDF 
        <div className="mb-6 text-right">
          <button
            onClick={exportarPDF}
            disabled={loading || !alumno}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center space-x-2 ml-auto"
          >
            <FaFileDownload />
            <span>Exportar PDF</span>
          </button>
        </div>
        */}

        {/* Estado de carga */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Cargando información...</p>
          </div>
        ) : alumno ? (
          /* Contenido exportable */
          <div ref={contentRef} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 bg-white dark:bg-gray-800 shadow-sm overflow-x-auto">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="h-16 w-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                <FaChild className="text-white text-2xl" />
              </div>
              <div>
                <p className="font-bold text-lg">{alumno.nombre}</p>
                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent font-medium">Tareas asignadas</span>
              </div>
            </div>

            {tareas.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 font-semibold mb-2 bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
                  <span>Materia</span>
                  <span>Tarea</span>
                  <span className="hidden md:block">Fecha de entrega</span>
                  <span>Estado</span>
                </div>

                <div className="overflow-x-auto">
                  {tareas.map((tarea) => (
                    <div 
                      key={tarea.id} 
                      className="grid grid-cols-1 md:grid-cols-4 items-center py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150"
                    >
                      <span className="font-medium flex items-center">
                        <FaBook className="text-indigo-400 mr-2 inline-block" />
                        {tarea.materia}
                      </span>
                      <span>{tarea.titulo}</span>
                      <span className="hidden md:block">{tarea.fechaEntrega}</span>
                      <span className="flex items-center">
                        {tarea.entregada ? (
                          <>
                            <FaCheckCircle className="text-green-500 text-xl" />
                            <span className="ml-2">Entregada {tarea.calificacion !== 'Pendiente' ? `(${tarea.calificacion})` : ''}</span>
                          </>
                        ) : (
                          <>
                            <FaTimesCircle className="text-red-500 text-xl" />
                            <span className="ml-2">Pendiente</span>
                          </>
                        )}
                        <span className="md:hidden ml-2">{tarea.fechaEntrega}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No hay tareas asignadas</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/30">
            <FaChild className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No se pudo cargar la información del alumno</p>
          </div>
        )}
      </div>
    </LayoutPadre>
  );
}
