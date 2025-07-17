import "@/styles/globals.css";
import { useEffect, useState, useRef } from 'react';
import { NotificacionesProvider } from '@/contexts/NotificacionesContext'; // REHABILITADO
import { supabase } from '@/lib/supabase';
import NotificationPrompt from '@/components/NotificationPrompt'; // REHABILITADO

export default function App({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const inicializadoRef = useRef(false);

  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (inicializadoRef.current) return;
    inicializadoRef.current = true;
    
    setIsClient(true);
    
    const checkSupabase = async () => {
      try {
        await supabase.auth.getSession();
        setSupabaseReady(true);
      } catch (error) {
        console.error('Error al verificar Supabase:', error);
        setTimeout(() => setSupabaseReady(true), 1000);
      }
    };
    
    checkSupabase();
  }, []); // Solo ejecutar una vez

  if (!isClient || !supabaseReady) {
    return <Component {...pageProps} />;
  }

  return (
    <NotificacionesProvider>
      <Component {...pageProps} />
      <NotificationPrompt />
    </NotificacionesProvider>
  );
}