import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function useEstadisticasAlumno() {
  const [estadisticas, setEstadisticas] = useState({
    tareasPendientes: 0,
    totalMaterias: 0,
    horario: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener el usuario actual (alumno)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Usuario no autenticado');
          return;
        }

        // Obtener el ID del alumno
        const { data: alumno, error: errorAlumno } = await supabase
          .from('alumnos')
          .select('id, grupo_id')
          .eq('usuario_id', user.id)
          .single();

        if (errorAlumno) {
          console.error('Error al obtener alumno:', errorAlumno);
          setError('No se encontró información del alumno');
          return;
        }

        // Obtener materias del grupo del alumno a través de asignaciones
        const { data: asignacionesGrupo, error: errorAsignaciones } = await supabase
          .from('asignaciones')
          .select(`
            materia_id,
            materias:materia_id (nombre),
            horario
          `)
          .eq('grupo_id', alumno.grupo_id);

        if (errorAsignaciones) {
          console.error('Error al obtener asignaciones:', errorAsignaciones);
          setError('Error al obtener asignaciones');
          return;
        }

        // Contar materias únicas y crear horario
        const materiasUnicas = new Set();
        const horario = [];

        if (asignacionesGrupo && asignacionesGrupo.length > 0) {
          asignacionesGrupo.forEach(asignacion => {
            materiasUnicas.add(asignacion.materia_id);
            
            // Agregar al horario
            horario.push({
              materia: asignacion.materias?.nombre || 'Sin nombre',
              hora: asignacion.horario || '08:00',
              materia_id: asignacion.materia_id
            });
          });
        }

        // Ordenar horario por hora
        horario.sort((a, b) => a.hora.localeCompare(b.hora));

        // Contar tareas pendientes
        // Extraer IDs de materias de las asignaciones
        const materiaIds = [...materiasUnicas];

        // Obtener TODAS las tareas de las materias del grupo
        const { data: todasLasTareas, error: errorTareas } = await supabase
          .from('tareas')
          .select(`
            id, 
            materias:materia_id (nombre)
          `)
          .in('materia_id', materiaIds);

        if (errorTareas) {
          console.error('Error al obtener tareas:', errorTareas);
          setError('Error al obtener tareas');
          return;
        }

        // Obtener todas las entregas del alumno
        const { data: entregasAlumno, error: errorEntregas } = await supabase
          .from('entregas')
          .select('tarea_id')
          .eq('alumno_id', alumno.id);

        if (errorEntregas) {
          console.error('Error al obtener entregas:', errorEntregas);
          setError('Error al obtener entregas');
          return;
        }

        // Crear un conjunto de IDs de tareas entregadas
        const tareasEntregadasIds = new Set();
        if (entregasAlumno) {
          entregasAlumno.forEach(entrega => {
            tareasEntregadasIds.add(entrega.tarea_id);
          });
        }

        // Contar tareas pendientes (tareas sin entrega)
        let tareasPendientes = 0;
        if (todasLasTareas) {
          tareasPendientes = todasLasTareas.filter(tarea => !tareasEntregadasIds.has(tarea.id)).length;
        }

        // Actualizar estadísticas
        setEstadisticas({
          tareasPendientes,
          totalMaterias: materiasUnicas.size,
          horario
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