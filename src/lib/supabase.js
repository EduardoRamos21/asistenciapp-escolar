// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfpacewgyctqtqnlbvhj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGFjZXdneWN0cXRxbmxidmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTQxNjUsImV4cCI6MjA2NDczMDE2NX0.voerUotXFpQLoTwr-1Ky9RiO6dmDmQ3Aq_IZxXdPD2Q' 

// Configuración mejorada para mantener la sesión
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey
    }
  }
})

// Función mejorada para descargar imágenes
export const downloadImage = async (bucket, path) => {
  try {
    console.log('Descargando imagen:', path);
    
    // Obtener la URL pública de la imagen en lugar de descargarla como blob
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
      
    if (!publicUrl) {
      throw new Error('No se pudo obtener la URL pública');
    }
    
    console.log('URL pública obtenida:', publicUrl);
    return publicUrl;
  } catch (err) {
    console.error("Error al obtener URL de imagen:", err);
    return null;
  }
};

export { supabaseUrl };