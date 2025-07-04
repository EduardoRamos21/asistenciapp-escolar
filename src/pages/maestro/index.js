import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuth from '@/hooks/useAuth';
import LayoutMaestro from '@/components/LayoutMaestro';

export default function MaestroHome() {
  const { user, loading } = useAuth(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirigir a la página de asistencia
      router.push('/maestro/asistencia');
    }
  }, [loading, user, router]);

  return (
    <LayoutMaestro>
      <div className="flex-1 w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <svg className="w-12 h-12 text-blue-500 dark:text-blue-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-xl font-medium text-gray-700 dark:text-gray-300">Redirigiendo...</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Por favor espere mientras le redirigimos a la página de asistencias.</p>
        </div>
      </div>
    </LayoutMaestro>
  );
}