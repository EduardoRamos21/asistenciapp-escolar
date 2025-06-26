import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL del PDF no proporcionada' });
  }
  
  try {
    // Obtener el nombre del archivo de la URL
    const fileName = url.split('/').pop();
    
    // Configurar los encabezados para PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    
    // Obtener el archivo de Supabase y enviarlo como respuesta
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error al obtener el PDF:', error);
    res.status(500).json({ error: 'Error al obtener el PDF' });
  }
}