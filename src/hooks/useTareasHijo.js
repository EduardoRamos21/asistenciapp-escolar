import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function useTareasHijo(alumnoId) {
  const [tareas, setTareas] = useState([]);
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

        // Obtener materias del grupo del alumno
        const { data: asignacionesGrupo } = await supabase
          .from('asignaciones')
          .select('materia_id')
          .eq('grupo_id', alumnoData.grupo_id);

        if (!asignacionesGrupo || asignacionesGrupo.length === 0) {
          setTareas([]);
          return;
        }

        // Extraer IDs de materias de las asignaciones
        const materiaIds = asignacionesGrupo.map(a => a.materia_id);

        // Obtener tareas con entregas
        const { data: tareasEntregadas } = await supabase
          .from('tareas')
          .select(`
            id,
            titulo,
            descripcion,
            fecha_entrega,
            materia_id,
            materias:materia_id (nombre),
            entregas!inner (id, alumno_id, archivo_url, calificacion)
          `)
          .in('materia_id', materiaIds)
          .eq('entregas.alumno_id', alumnoId);

        // Obtener tareas sin entregas
        let tareasSinEntrega = [];
        
        // Solo ejecutar esta consulta si hay materias asignadas
        if (materiaIds.length > 0) {
          const tareasEntregadasIds = (tareasEntregadas || []).map(t => t.id);
          
          // Consulta para tareas sin entregas
          let query = supabase
            .from('tareas')
            .select(`
              id, 
              titulo, 
              descripcion,
              fecha_entrega,
              materia_id,
              materias:materia_id (nombre)
            `)
            .in('materia_id', materiaIds);
          
          // Solo aplicar el filtro de exclusión si hay tareas entregadas
          if (tareasEntregadasIds.length > 0) {
            query = query.not('id', 'in', tareasEntregadasIds);
          }
          
          const { data: sinEntregaData } = await query;
          tareasSinEntrega = sinEntregaData || [];
        }

        // Combinar y formatear tareas
        const todasTareas = [
          ...(tareasEntregadas || []).map(t => ({
            id: t.id,
            titulo: t.titulo,
            descripcion: t.descripcion,
            fecha: new Date(t.fecha_entrega).toLocaleDateString('es-MX'),
            fechaEntrega: new Date(t.fecha_entrega).toLocaleDateString('es-MX'),
            materia: t.materias?.nombre || 'Sin materia',
            entregada: true,
            calificacion: t.entregas[0]?.calificacion || 'Pendiente'
          })),
          ...(tareasSinEntrega || []).map(t => ({
            id: t.id,
            titulo: t.titulo,
            descripcion: t.descripcion,
            fecha: new Date(t.fecha_entrega).toLocaleDateString('es-MX'),
            fechaEntrega: new Date(t.fecha_entrega).toLocaleDateString('es-MX'),
            materia: t.materias?.nombre || 'Sin materia',
            entregada: false,
            calificacion: 'Pendiente'
          }))
        ];

        // Ordenar por fecha de entrega (más recientes primero)
        todasTareas.sort((a, b) => new Date(b.fecha_entrega) - new Date(a.fecha_entrega));

        setTareas(todasTareas);
      } catch (error) {
        setError('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [alumnoId]);

  return { tareas, alumno, loading, error };
}