import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function useGrupos() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar grupos
  useEffect(() => {
    const cargarGrupos = async () => {
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

        // Cargar grupos de la escuela
        const { data, error: errorGrupos } = await supabase
          .from('grupos')
          .select('id, nombre, grado')
          .eq('escuela_id', director.escuela_id);

        if (errorGrupos) {
          setError('Error al cargar grupos: ' + errorGrupos.message);
          return;
        }

        setGrupos(data || []);
      } catch (error) {
        setError('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarGrupos();
  }, []);

  // Crear un nuevo grupo
  const crearGrupo = async (grupoData) => {
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

      // Insertar nuevo grupo
      const { data, error } = await supabase
        .from('grupos')
        .insert([
          {
            nombre: grupoData.nombre,
            grado: grupoData.grado || null,
            escuela_id: director.escuela_id
          }
        ])
        .select();

      if (error) {
        return { success: false, error: error.message };
      }

      // Actualizar lista de grupos
      setGrupos(prev => [...prev, data[0]]);

      return { success: true, data: data[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return { grupos, loading, error, crearGrupo };
}