import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function useMaterias() {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar materias
  const cargarMaterias = useCallback(async () => {
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

      // Cargar materias de la escuela
      const { data, error: errorMaterias } = await supabase
        .from('materias')
        .select('id, nombre')
        .eq('escuela_id', director.escuela_id);

      if (errorMaterias) {
        setError('Error al cargar materias: ' + errorMaterias.message);
        return;
      }

      setMaterias(data);
    } catch (error) {
      console.error('Error en cargarMaterias:', error);
      setError('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar materias al montar el componente
  useEffect(() => {
    cargarMaterias();
  }, [cargarMaterias]);

  // Crear una nueva materia
  const crearMateria = async (materiaData) => {
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

      // Crear la materia
      const { data, error: errorCrear } = await supabase
        .from('materias')
        .insert([
          {
            nombre: materiaData.nombre,
            escuela_id: director.escuela_id
          }
        ])
        .select();

      if (errorCrear) {
        return { success: false, error: errorCrear.message };
      }

      // Recargar materias
      cargarMaterias();

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error al crear materia:', error);
      return { success: false, error: error.message };
    }
  };

  // Editar una materia existente
  const editarMateria = async (id, materiaData) => {
    try {
      // Actualizar la materia
      const { data, error: errorEditar } = await supabase
        .from('materias')
        .update({ nombre: materiaData.nombre })
        .eq('id', id)
        .select();

      if (errorEditar) {
        return { success: false, error: errorEditar.message };
      }

      // Recargar materias
      cargarMaterias();

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error al editar materia:', error);
      return { success: false, error: error.message };
    }
  };

  // Eliminar una materia
  const eliminarMateria = async (id) => {
    try {
      // Eliminar la materia
      const { error: errorEliminar } = await supabase
        .from('materias')
        .delete()
        .eq('id', id);

      if (errorEliminar) {
        return { success: false, error: errorEliminar.message };
      }

      // Recargar materias
      cargarMaterias();

      return { success: true };
    } catch (error) {
      console.error('Error al eliminar materia:', error);
      return { success: false, error: error.message };
    }
  };

  return { materias, loading, error, crearMateria, editarMateria, eliminarMateria };
}