import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function useAsignaciones(grupoId) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar asignaciones
  const cargarAsignaciones = useCallback(async () => {
    if (!grupoId) return;
    
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

      // Cargar asignaciones del grupo con nombres de materias y maestros
      const { data, error: errorAsignaciones } = await supabase
        .from('asignaciones')
        .select(`
          id,
          materia_id,
          maestro_id,
          horario,
          materias(id, nombre),
          maestros(id, usuarios(nombre))
        `)
        .eq('grupo_id', grupoId)
        .eq('escuela_id', director.escuela_id);

      if (errorAsignaciones) {
        setError('Error al cargar asignaciones: ' + errorAsignaciones.message);
        return;
      }

      // Formatear datos de asignaciones
      const asignacionesFormateadas = data.map(asignacion => ({
        id: asignacion.id,
        materiaId: asignacion.materia_id,
        materiaNombre: asignacion.materias?.nombre || 'Sin nombre',
        maestroId: asignacion.maestro_id,
        maestroNombre: asignacion.maestros?.usuarios?.nombre || 'Sin nombre',
        horario: asignacion.horario || '00:00'
      }));

      setAsignaciones(asignacionesFormateadas);
    } catch (error) {
      console.error('Error en cargarAsignaciones:', error);
      setError('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [grupoId]);

  // Cargar asignaciones al montar el componente o cuando cambie el grupoId
  useEffect(() => {
    cargarAsignaciones();
  }, [cargarAsignaciones]);

  // Crear una nueva asignación
  const crearAsignacion = async (asignacionData) => {
    try {
      // Obtener el usuario actual (director)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Obtener la escuela del director
      const { data: director, error: errorDirector } = await supabase
        .from('directores')
        .select('escuela_id')
        .eq('usuario_id', user.id)
        .single();

      if (errorDirector) {
        return { success: false, error: 'No se encontró información del director' };
      }

      // Crear la asignación
      const { data, error: errorCrear } = await supabase
        .from('asignaciones')
        .insert([
          {
            grupo_id: grupoId,
            materia_id: asignacionData.materiaId,
            maestro_id: asignacionData.maestroId,
            horario: asignacionData.horario,
            escuela_id: director.escuela_id
          }
        ])
        .select();

      if (errorCrear) {
        return { success: false, error: errorCrear.message };
      }

      // Recargar asignaciones
      cargarAsignaciones();

      return { success: true, data };
    } catch (error) {
      console.error('Error al crear asignación:', error);
      return { success: false, error: error.message };
    }
  };

  // Editar una asignación existente
  const editarAsignacion = async (asignacionId, datosActualizados) => {
    try {
      // Obtener el usuario actual (director)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Actualizar la asignación
      const { data, error: errorActualizar } = await supabase
        .from('asignaciones')
        .update(datosActualizados)
        .eq('id', asignacionId)
        .select();

      if (errorActualizar) {
        return { success: false, error: errorActualizar.message };
      }

      // Recargar asignaciones
      cargarAsignaciones();

      return { success: true, data };
    } catch (error) {
      console.error('Error al actualizar asignación:', error);
      return { success: false, error: error.message };
    }
  };

  return { asignaciones, loading, error, crearAsignacion, editarAsignacion };
}