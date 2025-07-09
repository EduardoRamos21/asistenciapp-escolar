import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function useEstadisticasMaestro() {
  const [estadisticas, setEstadisticas] = useState({
    totalAlumnos: 0,
    totalMaterias: 0,
    asistenciaDia: 0,
    tareasActivas: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener el usuario actual (maestro)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Usuario no autenticado');
          return;
        }

        // Obtener el ID del maestro
        const { data: maestro, error: errorMaestro } = await supabase
          .from('maestros')
          .select('id')
          .eq('usuario_id', user.id)
          .single();

        if (errorMaestro) {
          console.error('Error al obtener maestro:', errorMaestro);
          setError('No se encontró información del maestro');
          return;
        }

        // Obtener asignaciones del maestro
        const { data: asignaciones, error: errorAsignaciones } = await supabase
          .from('asignaciones')
          .select('grupo_id, materia_id')
          .eq('maestro_id', maestro.id);

        if (errorAsignaciones) {
          console.error('Error al obtener asignaciones:', errorAsignaciones);
          setError('Error al obtener asignaciones');
          return;
        }

        // Extraer grupos y materias únicos
        const gruposIds = [...new Set(asignaciones.map(a => a.grupo_id))];
        const materiasIds = [...new Set(asignaciones.map(a => a.materia_id))];

        // Contar materias únicas
        const totalMaterias = materiasIds.length;

        // Obtener total de alumnos en los grupos asignados
        let totalAlumnos = 0;
        if (gruposIds.length > 0) {
          const { count, error: errorAlumnos } = await supabase
            .from('alumnos')
            .select('id', { count: 'exact', head: true })
            .in('grupo_id', gruposIds);

          if (!errorAlumnos) {
            totalAlumnos = count || 0;
          } else {
            console.error('Error al obtener alumnos:', errorAlumnos);
          }
        }

        // Calcular asistencia del día para las materias del maestro
        const fechaHoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        let asistenciaDia = 0;
        if (materiasIds.length > 0) {
          const { data: asistenciasHoy, error: errorAsistenciasHoy } = await supabase
            .from('asistencias')
            .select('presente')
            .eq('fecha', fechaHoy)
            .in('materia_id', materiasIds);

          if (!errorAsistenciasHoy && asistenciasHoy && asistenciasHoy.length > 0) {
            asistenciaDia = Math.round((asistenciasHoy.filter(a => a.presente).length / asistenciasHoy.length) * 100);
          }
        }

        // Contar tareas activas (con fecha de entrega posterior a hoy)
        let tareasActivas = 0;
        if (materiasIds.length > 0) {
          const { count: countTareas, error: errorTareas } = await supabase
            .from('tareas')
            .select('id', { count: 'exact', head: true })
            .in('materia_id', materiasIds)
            .gte('fecha_entrega', fechaHoy);

          if (!errorTareas) {
            tareasActivas = countTareas || 0;
          } else {
            console.error('Error al obtener tareas:', errorTareas);
          }
        }

        // Actualizar estadísticas
        setEstadisticas({
          totalAlumnos,
          totalMaterias,
          asistenciaDia,
          tareasActivas
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