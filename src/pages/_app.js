import "@/styles/globals.css";
import { useEffect, useState } from 'react';
import { NotificacionesProvider } from '@/contexts/NotificacionesContext';

export default function App({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {isClient ? (
        <NotificacionesProvider>
          <Component {...pageProps} />
        </NotificacionesProvider>
      ) : (
        <Component {...pageProps} />
      )}
    </>
  );
}