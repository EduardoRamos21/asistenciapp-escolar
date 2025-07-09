import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function useEstadisticas() {
  const [estadisticas, setEstadisticas] = useState({
    totalMaestros: 0,
    totalAlumnos: 0,
    asistenciaDia: 0,
    asistenciaSemana: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener el usuario actual (director)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Usuario no autenticado');
          return;
        }

        // Obtener la escuela del director
        const { data: director, error: errorDirector } = await supabase
          .from('directores')
          .select('escuela_id')
          .eq('usuario_id', user.id)
          .single();

        if (errorDirector) {
          setError('No se encontró información del director');
          return;
        }

        const escuelaId = director.escuela_id;

        // Obtener total de maestros
        const { count: totalMaestros, error: errorMaestros } = await supabase
          .from('maestros')
          .select('id', { count: 'exact', head: true })
          .eq('escuela_id', escuelaId);

        if (errorMaestros) {
          console.error('Error al obtener maestros:', errorMaestros);
          setError('Error al obtener maestros: ' + errorMaestros.message);
          return;
        }

        // Obtener total de alumnos
        const { count: totalAlumnos, error: errorAlumnos } = await supabase
          .from('alumnos')
          .select('id', { count: 'exact', head: true })
          .eq('escuela_id', escuelaId);

        if (errorAlumnos) {
          console.error('Error al obtener alumnos:', errorAlumnos);
          setError('Error al obtener alumnos: ' + errorAlumnos.message);
          return;
        }

        // Obtener IDs de todos los alumnos de la escuela
        const { data: alumnosIds, error: errorAlumnosIds } = await supabase
          .from('alumnos')
          .select('id')
          .eq('escuela_id', escuelaId);

        if (errorAlumnosIds) {
          console.error('Error al obtener IDs de alumnos:', errorAlumnosIds);
          setError('Error al obtener IDs de alumnos: ' + errorAlumnosIds.message);
          return;
        }

        // Extraer solo los IDs en un array
        const idsAlumnos = alumnosIds.map(alumno => alumno.id);

        // Calcular asistencia del día
        const fechaHoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        // Obtener asistencias del día
        const { data: asistenciasHoy, error: errorAsistenciasHoy } = await supabase
          .from('asistencias')
          .select('presente')
          .eq('fecha', fechaHoy)
          .in('alumno_id', idsAlumnos);

        if (errorAsistenciasHoy) {
          console.error('Error al obtener asistencias del día:', errorAsistenciasHoy);
          setError('Error al obtener asistencias del día: ' + errorAsistenciasHoy.message);
          // Continuamos con el resto de las estadísticas
        }

        // Calcular porcentaje de asistencia del día
        const asistenciaDia = asistenciasHoy && asistenciasHoy.length > 0
          ? (asistenciasHoy.filter(a => a.presente).length / asistenciasHoy.length) * 100
          : 0;

        // Calcular asistencia de la semana
        // Obtener fecha de hace 7 días
        const fechaHace7Dias = new Date();
        fechaHace7Dias.setDate(fechaHace7Dias.getDate() - 7);
        const fechaSemana = fechaHace7Dias.toISOString().split('T')[0];

        // Obtener asistencias de la semana
        const { data: asistenciasSemana, error: errorAsistenciasSemana } = await supabase
          .from('asistencias')
          .select('presente')
          .gte('fecha', fechaSemana)
          .in('alumno_id', idsAlumnos);

        if (errorAsistenciasSemana) {
          console.error('Error al obtener asistencias de la semana:', errorAsistenciasSemana);
          setError('Error al obtener asistencias de la semana: ' + errorAsistenciasSemana.message);
          // Continuamos con el resto de las estadísticas
        }

        // Calcular porcentaje de asistencia de la semana
        const asistenciaSemana = asistenciasSemana && asistenciasSemana.length > 0
          ? (asistenciasSemana.filter(a => a.presente).length / asistenciasSemana.length) * 100
          : 0;

        // Actualizar estadísticas
        setEstadisticas({
          totalMaestros: totalMaestros || 0,
          totalAlumnos: totalAlumnos || 0,
          asistenciaDia: asistenciaDia || 0,
          asistenciaSemana: asistenciaSemana || 0
        });
      } catch (error) {
        console.error('Error general:', error);
        setError('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);

  return { estadisticas, loading, error };
}