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
        const { data: materiasData, error: errorMaterias } = await supabase
          .from('materias')
          .select('id')
          .eq('grupo_id', alumnoData.grupo_id);

        if (errorMaterias) {
          setError('Error al cargar materias');
          return;
        }

        if (!materiasData || materiasData.length === 0) {
          setTareas([]);
          return;
        }

        // Cargar tareas de las materias del alumno
        const { data: tareasData, error: errorTareas } = await supabase
          .from('tareas')
          .select(`
            id,
            titulo,
            descripcion,
            fecha_entrega,
            materias:materia_id (nombre),
            entregas!inner (calificacion)
          `)
          .in('materia_id', materiasData.map(m => m.id))
          .eq('entregas.alumno_id', alumnoId);

        if (errorTareas) {
          setError('Error al cargar tareas');
          return;
        }

        // Formatear tareas
        const tareasFormateadas = tareasData.map(t => ({
          id: t.id,
          titulo: t.titulo,
          descripcion: t.descripcion,
          fecha: new Date(t.fecha_entrega).toLocaleDateString('es-MX'),
          materia: t.materias?.nombre || 'Sin nombre',
          calificacion: t.entregas[0]?.calificacion || 'Pendiente'
        }));

        setTareas(tareasFormateadas);
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