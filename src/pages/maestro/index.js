import LayoutMaestro from '@/components/LayoutMaestro';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useEstadisticasMaestro from '@/hooks/useEstadisticasMaestro';
import { HiOutlineAcademicCap, HiOutlineBookOpen } from 'react-icons/hi';
import { HiOutlineClipboardCheck, HiOutlineClipboardList,HiUserGroup } from 'react-icons/hi';
import useAuth from '@/hooks/useAuth';
import { FiUser } from 'react-icons/fi';

export default function MaestroDashboard() {
  const { user } = useAuth(true);
  const { estadisticas, loading, error } = useEstadisticasMaestro();
  const [usuario, setUsuario] = useState(null);
  const [fecha, setFecha] = useState('');

  // Obtener información del usuario y fecha actual
  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('nombre, avatar_url')
          .eq('id', user.id)
          .single();
        setUsuario(data);
      }
    };

    const obtenerFecha = () => {
      const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
      setFecha(new Date().toLocaleDateString('es-ES', opciones));
    };

    obtenerUsuario();
    obtenerFecha();
  }, []);

  return (
    <LayoutMaestro>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{fecha}</h2>
        {usuario && (
          <Link href="/maestro/cuenta">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{usuario.nombre}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Profesor</p>
              </div>
              <div className="relative w-12 h-12 overflow-hidden rounded-full ring-2 ring-blue-500 dark:ring-blue-400 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <FiUser className="text-white text-xl" />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Tarjetas resumen con enlaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Link href="/maestro/grupos" className="block">
          <Card 
            color="from-blue-500 to-blue-600" 
            title="Alumnos" 
            valor={loading ? '...' : estadisticas.totalAlumnos} 
            icon={<HiOutlineAcademicCap className="text-4xl" />}
          />
        </Link>
        <Link href="/maestro/horario" className="block">
          <Card 
            color="from-amber-400 to-amber-500" 
            title="Materias" 
            valor={loading ? '...' : estadisticas.totalMaterias} 
            icon={<HiOutlineBookOpen className="text-4xl" />}
          />
        </Link>
        <Link href="/maestro/asistencia" className="block">
          <Card 
            color="from-emerald-500 to-emerald-600" 
            title="Asistencia del día" 
            valor={loading ? '...' : `${estadisticas.asistenciaDia}%`} 
            icon={<HiOutlineClipboardCheck className="text-4xl" />}
          />
        </Link>
        <Link href="/maestro/historial" className="block">
          <Card 
            color="from-indigo-500 to-indigo-600" 
            title="Tareas activas" 
            valor={loading ? '...' : estadisticas.tareasActivas} 
            icon={<HiOutlineClipboardList className="text-4xl" />}
          />
        </Link>
      </div>

      {/* Botones de acción con navegación */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Acciones rápidas</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/maestro/asistencia" className="w-full">
          <ActionButton text="Registrar asistencia" icon={<HiOutlineClipboardCheck />} />
        </Link>
        <Link href="/maestro/tareas" className="w-full">
          <ActionButton text="Gestionar tareas" icon={<HiOutlineClipboardList />} />
        </Link>
        <Link href="/maestro/grupos" className="w-full">
          <ActionButton text="Gestionar grupos" icon={<HiUserGroup />} />
        </Link>
        <Link href="/maestro/historial" className="w-full">
          <ActionButton text="Ver historial" icon={<HiOutlineBookOpen />} />
        </Link>
      </div>
    </LayoutMaestro>
  );
}

function Card({ color, title, valor, icon }) {
  return (
    <div className={`bg-gradient-to-r ${color} text-white rounded-xl shadow-lg p-6 transition-transform hover:scale-105 overflow-hidden relative`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-4xl font-bold">{valor}</p>
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10"></div>
    </div>
  );
}

function ActionButton({ text, icon }) {
  return (
    <div className="flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-5 py-4 rounded-xl shadow-md hover:shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-200 cursor-pointer w-full h-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 group">
      <div className="text-blue-500 dark:text-blue-400 text-2xl group-hover:scale-110 transition-transform">{icon}</div>
      <span className="font-medium text-lg">{text}</span>
    </div>
  );
}