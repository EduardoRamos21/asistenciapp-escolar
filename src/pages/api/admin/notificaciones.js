import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase con la clave de servicio
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener parámetros de consulta (opcional)
    const { limit = 50, offset = 0, tipo } = req.query;
    
    // Construir consulta base
    let query = supabaseAdmin
      .from('notificaciones')
      .select('*')
      .order('fecha_creacion', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    // Filtrar por tipo si se proporciona
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    // Ejecutar consulta
    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      data, 
      count: data.length,
      message: 'Notificaciones obtenidas correctamente' 
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({ error: 'Error al obtener las notificaciones' });
  }
}