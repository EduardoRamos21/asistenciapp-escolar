import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function useAlumnos(grupoId) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar alumnos
  const cargarAlumnos = useCallback(async () => {
    if (!grupoId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Obtener alumnos del grupo
      const { data, error: errorAlumnos } = await supabase
        .from('alumnos')
        .select(`
          id, 
          usuarios:usuario_id (id, nombre, email)
        `)
        .eq('grupo_id', grupoId);

      if (errorAlumnos) {
        setError('Error al cargar alumnos: ' + errorAlumnos.message);
        return;
      }

      // Formatear datos para mostrar
      const alumnosFormateados = data.map(alumno => ({
        id: alumno.id,
        nombre: alumno.usuarios?.nombre || 'Sin nombre',
        email: alumno.usuarios?.email || 'Sin email',
        usuarioId: alumno.usuarios?.id
      }));

      setAlumnos(alumnosFormateados);
    } catch (error) {
      console.error('Error en cargarAlumnos:', error);
      setError('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [grupoId]);

  // Cargar alumnos al montar el componente o cambiar el grupoId
  useEffect(() => {
    cargarAlumnos();
  }, [cargarAlumnos, grupoId]);

  // Crear un nuevo alumno
  const crearAlumno = async ({ nombre, email, grupoId }) => {
    try {
      // Obtener el usuario actual (director)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }
  
      // Llamar al endpoint API en lugar de interactuar directamente con Supabase
      const response = await fetch('/api/alumnos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          email,
          grupoId,
          directorId: user.id
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        return { success: false, error: result.error };
      }
  
      // Recargar alumnos
      cargarAlumnos();
  
      return { 
        success: true, 
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('Error al crear alumno:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    alumnos,
    loading,
    error,
    crearAlumno,
    cargarAlumnos
  };
}