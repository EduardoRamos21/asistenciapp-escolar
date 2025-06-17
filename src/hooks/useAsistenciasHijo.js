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

        // Verificar que el usuario actual es padre del alumno
        const { data: { user } } = await supabase.auth.getUser();
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
          setError('Error al cargar datos del alumno');
          return;
        }

        setAlumno({
          id: alumnoData.id,
          nombre: alumnoData.usuarios?.nombre || 'Alumno',
          grupo_id: alumnoData.grupo_id,
          foto: '/alumno1.jpg' // Foto por defecto
        });

        // Cargar asistencias del alumno
        const { data: asistenciasData, error: errorAsistencias } = await supabase
          .from('asistencias')
          .select(`
            id,
            fecha,
            presente,
            materias:materia_id (nombre)
          `)
          .eq('alumno_id', alumnoId)
          .order('fecha', { ascending: false });

        if (errorAsistencias) {
          setError('Error al cargar asistencias');
          return;
        }

        // Formatear asistencias
        const asistenciasFormateadas = asistenciasData.map(a => ({
          id: a.id,
          fecha: new Date(a.fecha).toLocaleDateString('es-MX'),
          materia: a.materias?.nombre || 'Sin nombre',
          presente: a.presente
        }));

        setAsistencias(asistenciasFormateadas);
      } catch (error) {
        setError('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [alumnoId]);

  return { asistencias, alumno, loading, error };
}