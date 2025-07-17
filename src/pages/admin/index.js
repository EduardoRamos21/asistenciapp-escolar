import LayoutAdmin from '@/components/LayoutAdmin';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FaAd } from 'react-icons/fa';
import { FiSend, FiUser } from 'react-icons/fi';

export default function AdminDashboard() {
  const [usuario, setUsuario] = useState(null);
  const [fecha, setFecha] = useState('');
  const [totalAnuncios, setTotalAnuncios] = useState(0);
  const [anunciosActivos, setAnunciosActivos] = useState(0);
  const [loading, setLoading] = useState(true);

  // Obtener información del usuario, fecha actual y estadísticas
  useEffect(() => {
    const obtenerDatos = async () => {
      setLoading(true);
      
      // Obtener usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Cambiar esta línea:
        const { data } = await supabase
          .from('usuarios')
          .select('nombre')  // ← Remover 'img' temporalmente
          .eq('id', user.id)
          .single();
        setUsuario(data);
      }

      // Obtener fecha
      const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
      setFecha(new Date().toLocaleDateString('es-ES', opciones));

      // Obtener estadísticas de anuncios
      const now = new Date().toISOString();
      
      // Total de anuncios
      const { data: totalData } = await supabase
        .from('anuncios')
        .select('id', { count: 'exact' });
      
      setTotalAnuncios(totalData?.length || 0);

      // Anuncios activos
      const { data: activosData } = await supabase
        .from('anuncios')
        .select('id')
        .eq('activo', true)
        .lte('fecha_inicio', now)
        .gte('fecha_fin', now);
      
      setAnunciosActivos(activosData?.length || 0);
      
      setLoading(false);
    };

    obtenerDatos();
  }, []);

  return (
    <LayoutAdmin>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{fecha}</h2>
        {usuario && (
          <Link href="/admin/cuenta">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{usuario.nombre}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Administrador del Sistema</p>
              </div>
              <div className="relative w-12 h-12 flex items-center justify-center rounded-full ring-2 ring-purple-500 dark:ring-purple-400 bg-purple-100 dark:bg-purple-900">
                <FiUser className="text-purple-600 dark:text-purple-400 text-xl" />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card 
          color="from-purple-500 to-purple-600" 
          title="Total de Anuncios" 
          valor={loading ? '...' : totalAnuncios} 
          icon={<FaAd className="text-3xl" />}
        />
        <Card 
          color="from-green-500 to-green-600" 
          title="Anuncios Activos" 
          valor={loading ? '...' : anunciosActivos} 
          icon={<FaAd className="text-3xl" />}
        />
      </div>

      {/* Botones de acción con navegación */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Acciones rápidas</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/anuncios" className="w-full">
          <ActionButton text="Gestionar Anuncios" icon={<FaAd />} />
        </Link>
        <Link href="/admin/notificaciones" className="w-full">
          <ActionButton text="Gestionar Notificaciones" icon={<FiSend />} />
        </Link>
      </div>
    </LayoutAdmin>
  );
}

function Card({ color, title, valor, icon }) {
  return (
    <div className={`bg-gradient-to-r ${color} text-white rounded-xl shadow-lg p-6 transition-transform hover:scale-105 overflow-hidden relative`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-3xl font-bold">{valor}</p>
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10"></div>
    </div>
  );
}

function ActionButton({ text, icon }) {
  return (
    <div className="flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-5 py-4 rounded-xl shadow-md hover:shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-200 cursor-pointer w-full h-full hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 group">
      <div className="text-purple-500 dark:text-purple-400 text-xl group-hover:scale-110 transition-transform">{icon}</div>
      <span className="font-medium">{text}</span>
    </div>
  );
}