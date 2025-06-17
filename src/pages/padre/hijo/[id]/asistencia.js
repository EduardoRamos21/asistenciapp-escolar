import LayoutPadre from '@/components/LayoutPadre';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useRef, useEffect, useState } from 'react';
import html2pdf from 'html2pdf.js';
import useAsistenciasHijo from '@/hooks/useAsistenciasHijo';
import { supabase } from '@/lib/supabase';

export default function AsistenciaHijo() {
  const router = useRouter();
  const { id } = router.query;
  const { asistencias, alumno, loading, error } = useAsistenciasHijo(id);
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

  const exportarPDF = () => {
    const options = {
      margin: 0.5,
      filename: `asistencia_${alumno?.nombre || 'alumno'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(options).from(contentRef.current).save();
  };

  return (
    <LayoutPadre>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
        </h2>
        {usuario && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold">{usuario.nombre}</p>
              <p className="text-sm text-gray-500">Padre</p>
            </div>
            <Image src="/perfil.jpg" alt="perfil" width={40} height={40} className="rounded-full" />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error al cargar asistencias: {error}
        </div>
      )}

      {/* Botón de exportar */}
      <div className="mb-4 text-right">
        <button
          onClick={exportarPDF}
          disabled={loading || !alumno}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          📄 Exportar PDF
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : alumno ? (
        /* Contenido exportable */
        <div ref={contentRef} className="border border-black rounded-xl p-4">
          <div className="flex items-center gap-4 mb-4">
            <Image 
              src={alumno.foto} 
              alt={alumno.nombre} 
              width={60} 
              height={60} 
              className="rounded-full" 
            />
            <div>
              <p className="font-semibold">{alumno.nombre}</p>
              <span className="text-purple-600 text-sm">Historial de asistencia</span>
            </div>
          </div>

          {asistencias.length > 0 ? (
            <>
              <div className="grid grid-cols-3 font-semibold mb-2">
                <span>Materia</span>
                <span>Asistencia</span>
                <span>Fecha</span>
              </div>

              {asistencias.map((asistencia) => (
                <div key={asistencia.id} className="grid grid-cols-3 items-center py-2 border-t">
                  <span>{asistencia.materia}</span>
                  <span>{asistencia.presente ? '✅' : '❌'}</span>
                  <span>{asistencia.fecha}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No hay registros de asistencia</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-gray-500">No se pudo cargar la información del alumno</p>
        </div>
      )}
    </LayoutPadre>
  );
}
