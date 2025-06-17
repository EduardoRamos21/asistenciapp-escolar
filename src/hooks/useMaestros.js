import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function useMaestros() {
  const [maestros, setMaestros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar maestros (extraída del useEffect para poder reutilizarla)
  const cargarMaestros = useCallback(async () => {
    try {
      console.log('Iniciando carga de maestros');
      setLoading(true);
      setError(null);

      // Obtener el usuario actual (director)
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuario actual:', user?.id);
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

      console.log('Información del director:', director, 'Error:', errorDirector);
      if (errorDirector) {
        setError('No se encontró información del director');
        return;
      }

      // Cargar maestros de la escuela con sus nombres
      const { data, error: errorMaestros } = await supabase
        .from('maestros')
        .select(`
          id, 
          usuarios:usuario_id (nombre, email)
        `)
        .eq('escuela_id', director.escuela_id);

      console.log('Datos de maestros obtenidos:', data, 'Error:', errorMaestros);
      if (errorMaestros) {
        setError('Error al cargar maestros: ' + errorMaestros.message);
        return;
      }

      // Formatear datos de maestros
      const maestrosFormateados = data.map(maestro => ({
        id: maestro.id,
        nombre: maestro.usuarios?.nombre || 'Sin nombre',
        email: maestro.usuarios?.email || 'Sin email'
      }));

      console.log('Maestros formateados:', maestrosFormateados);
      setMaestros(maestrosFormateados);
    } catch (error) {
      console.error('Error en cargarMaestros:', error);
      setError('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar maestros al montar el componente
  useEffect(() => {
    cargarMaestros();
  }, [cargarMaestros]);

  // Crear un nuevo maestro
  const crearMaestro = async (maestroData) => {
    try {
      // Obtener el usuario actual (director)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }
  
      // Llamar al endpoint API en lugar de interactuar directamente con Supabase
      const response = await fetch('/api/maestros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...maestroData,
          directorId: user.id
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        return { success: false, error: result.error };
      }
  
      // Actualizar lista de maestros
      setMaestros(prev => [...prev, result.data]);
  
      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return { maestros, loading, error, crearMaestro, recargarMaestros: cargarMaestros };
}