import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuth from '@/hooks/useAuth';
import Layout from '@/components/Layout';

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
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirigiendo...</p>
      </div>
    </Layout>
  );
}