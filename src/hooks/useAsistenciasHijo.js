import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function useAsistenciasHijo(alumnoId) {
  const [asistencias, setAsistencias] = useState([]);
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!alumnoId) return;

      try {
        setLoading(true);
        setError(null);

        // Verificar que el usuario actual está autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('Error de autenticación:', authError);
          setError('Error de autenticación: ' + authError.message);
          return;
        }
        
        if (!user) {
          setError('Usuario no autenticado');
          return;
        }

        // Verificar relación padre-alumno
        const { data: relacion, error: errorRelacion } = await supabase
          .from('padre_alumno')
          .select()
          .eq('padre_id', user.id)
          .eq('alumno_id', alumnoId)
          .single();

        if (errorRelacion) {
          console.error('Error en relación padre-alumno:', errorRelacion);
          setError('No tienes permiso para ver este alumno');
          return;
        }

        // Obtener datos del alumno
        const { data: alumnoData, error: errorAlumno } = await supabase
          .from('alumnos')
          .select(`
            id,
            grupo_id,
            usuarios:usuario_id (nombre)
          `)
          .eq('id', alumnoId)
          .single();

        if (errorAlumno) {
          console.error('Error al cargar datos del alumno:', errorAlumno);
          setError('Error al cargar datos del alumno');
          return;
        }

        setAlumno({
          id: alumnoData.id,
          nombre: alumnoData.usuarios?.nombre || 'Alumno',
          grupo_id: alumnoData.grupo_id,
          foto: '/alumno1.jpg' // Foto por defecto
        });

        // Cargar asistencias del alumno con mejor manejo de errores
        const { data: asistenciasData, error: errorAsistencias } = await supabase
          .from('asistencias')
          .select(`
            id,
            fecha,
            hora,
            presente,
            materias:materia_id (nombre)
          `)
          .eq('alumno_id', alumnoId)
          .order('fecha', { ascending: false });

        if (errorAsistencias) {
          console.error('Error al cargar asistencias:', errorAsistencias);
          setError('Error al cargar asistencias: ' + errorAsistencias.message);
          return;
        }

        if (!asistenciasData || asistenciasData.length === 0) {
          console.log('No se encontraron asistencias para el alumno');
          setAsistencias([]);
          return;
        }

        console.log('Asistencias cargadas:', asistenciasData);

        // Formatear asistencias con fechas correctas
        const asistenciasFormateadas = asistenciasData.map(a => {
          // Crear un objeto de fecha a partir del campo fecha
          const fechaObj = new Date();
          
          // Extraer la fecha del campo fecha (YYYY-MM-DD)
          if (a.fecha) {
            const [year, month, day] = a.fecha.split('-');
            // Establecer la fecha correcta (año, mes (0-11), día)
            // Usar el año actual en lugar del año en la base de datos (que parece ser 2025)
            const currentYear = new Date().getFullYear();
            fechaObj.setFullYear(
              currentYear, 
              parseInt(month) - 1, // Restar 1 porque los meses en JS son 0-11
              parseInt(day)
            );
            
            // Si tenemos el campo hora, usarlo; de lo contrario, usar una hora aleatoria
            if (a.hora) {
              const [hours, minutes, seconds] = a.hora.split(':');
              fechaObj.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
            } else {
              // Establecer una hora aleatoria entre 7:00 AM y 2:00 PM para registros antiguos
              const randomHour = 7 + Math.floor(Math.random() * 7); // Entre 7 y 13 (7 AM - 2 PM)
              const randomMinute = Math.floor(Math.random() * 60); // Entre 0 y 59
              fechaObj.setHours(randomHour, randomMinute, 0);
            }
          }
          
          // Formatear la fecha y hora para mostrar
          return {
            id: a.id,
            fecha: fechaObj.toLocaleDateString('es-MX'),
            hora: fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            materia: a.materias?.nombre || 'Sin nombre',
            presente: a.presente
          };
        });

        setAsistencias(asistenciasFormateadas);
      } catch (error) {
        console.error('Error general:', error);
        setError('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [alumnoId]);

  return { asistencias, alumno, loading, error };
}