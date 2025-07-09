import { createClient } from '@supabase/supabase-js';
import { checkNotificacionesProgramadas } from '../cron/check-notifications';

// Inicializar cliente de Supabase con la clave de servicio
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  try {
    // Ejecutar solo la función de notificaciones programadas
    await checkNotificacionesProgramadas();
    return res.status(200).json({ success: true, message: 'Notificaciones programadas procesadas correctamente' });
  } catch (error) {
    console.error('Error al procesar notificaciones programadas:', error);
    return res.status(500).json({ error: 'Error al procesar notificaciones programadas' });
  }
}