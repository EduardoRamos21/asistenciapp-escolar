import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase con la clave de servicio
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { titulo, mensaje, tipo, rol, url, fecha_programada, enviada } = req.body;

    if (!titulo || !mensaje || !fecha_programada) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Insertar notificación programada en la base de datos
    const { data, error } = await supabaseAdmin
      .from('notificaciones_programadas')
      .insert([
        {
          titulo,
          mensaje,
          tipo,
          rol: rol || null,
          url: url || '/',
          fecha_programada,
          enviada: enviada !== undefined ? enviada : false
        }
      ])
      .select(); // Añadir esta línea para devolver los datos insertados

    if (error) throw error;

    // Verificar si data existe antes de intentar acceder a sus propiedades
    return res.status(200).json({ 
      success: true, 
      id: data && data[0] ? data[0].id : null, 
      message: 'Notificación programada creada correctamente' 
    });
  } catch (error) {
    console.error('Error al crear notificación programada:', error);
    return res.status(500).json({ error: 'Error al crear la notificación programada' });
  }
}