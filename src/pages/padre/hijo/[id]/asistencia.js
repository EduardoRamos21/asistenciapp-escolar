import LayoutPadre from '@/components/LayoutPadre';
import { useRouter } from 'next/router';
import { useRef, useEffect, useState } from 'react';
// Eliminar la importación estática de html2pdf
// import html2pdf from 'html2pdf.js';
import useAsistenciasHijo from '@/hooks/useAsistenciasHijo';
import { supabase } from '@/lib/supabase';
import { FaUser, FaChild, FaFileDownload, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function AsistenciaHijo() {
  const router = useRouter();
  const { id } = router.query;
  const { asistencias, alumno, loading, error } = useAsistenciasHijo(id);
  const [usuario, setUsuario] = useState(null);
  const contentRef = useRef();
  // Estado para controlar si estamos en el cliente
  const [isClient, setIsClient] = useState(false);

  // Detectar si estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Función para exportar el contenido a PDF
  const exportarPDF = async () => {
    // Solo ejecutar en el cliente
    if (!isClient) return;

    try {
      // Mostrar un indicador de carga opcional
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      loadingIndicator.innerHTML = '<div class="bg-white p-4 rounded-lg"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-2"></div><p class="text-center">Generando PDF...</p></div>';
      document.body.appendChild(loadingIndicator);
      
      // Importar html2pdf dinámicamente solo en el cliente
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Configuración mejorada
      const options = {
        margin: 0.5,
        filename: `asistencia_${alumno?.nombre || 'alumno'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      // Usar Promise para manejar el proceso
      html2pdf()
        .from(contentRef.current)
        .set(options)
        .save()
        .then(() => {
          // Eliminar el indicador de carga cuando termine
          document.body.removeChild(loadingIndicator);
        })
        .catch(error => {
          console.error('Error al generar PDF:', error);
          document.body.removeChild(loadingIndicator);
          // Mostrar mensaje de error al usuario
          alert('Hubo un problema al generar el PDF. Por favor intente nuevamente.');
        });
    } catch (error) {
      console.error('Error al cargar html2pdf:', error);
      alert('No se pudo cargar el generador de PDF. Por favor intente nuevamente.');
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
              <p>Error al cargar asistencias: {error}</p>
            </div>
          </div>
        )}

        {/* Botón de exportar 
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
                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent font-medium">Historial de asistencia</span>
              </div>
            </div>

            {asistencias.length > 0 ? (
              <>
                <div className="grid grid-cols-4 font-semibold mb-2 bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
                  <span>Materia</span>
                  <span>Asistencia</span>
                  <span>Fecha</span>
                  <span>Hora</span>
                </div>

                <div className="overflow-x-auto">
                  {asistencias.map((asistencia) => (
                    <div 
                      key={asistencia.id} 
                      className="grid grid-cols-4 items-center py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150"
                    >
                      <span className="font-medium">{asistencia.materia}</span>
                      <span>
                        {asistencia.presente ? (
                          <FaCheckCircle className="text-green-500 text-xl" />
                        ) : (
                          <FaTimesCircle className="text-red-500 text-xl" />
                        )}
                      </span>
                      <span>{asistencia.fecha}</span>
                      <span>{asistencia.hora}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No hay registros de asistencia</p>
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