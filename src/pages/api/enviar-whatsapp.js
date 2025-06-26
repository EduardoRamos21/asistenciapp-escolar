import { createClient } from '@supabase/supabase-js';
const { sendWhatsAppMessage } = require('../../lib/whatsappService');

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
    const { telefono, mensaje } = req.body;

    if (!telefono || !mensaje) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Generar enlace de WhatsApp
    const result = await sendWhatsAppMessage(telefono, mensaje);
    
    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        message: 'Enlace de WhatsApp generado correctamente',
        whatsappLink: result.whatsappLink,
        to: telefono,
        content: mensaje
      });
    } else {
      return res.status(500).json({ 
        error: 'Error al generar enlace de WhatsApp: ' + result.error 
      });
    }

  } catch (error) {
    console.error('Error al generar enlace WhatsApp:', error);
    return res.status(500).json({ error: 'Error al generar enlace: ' + error.message });
  }
}