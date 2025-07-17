import LayoutAlumno from '@/components/LayoutAlumno';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useEstadisticasAlumno from '@/hooks/useEstadisticasAlumno';
import { HiOutlineClipboardList, HiOutlineBookOpen, HiOutlineClock } from 'react-icons/hi';
import useAuth from '@/hooks/useAuth';
import { FiUser } from 'react-icons/fi'; // Importamos el icono de usuario

export default function AlumnoDashboard() {
  const { user } = useAuth(true);
  const { estadisticas, loading, error } = useEstadisticasAlumno();
  const [usuario, setUsuario] = useState(null);
  const [fecha, setFecha] = useState('');

  // Obtener información del usuario y fecha actual
  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('nombre')
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
    <LayoutAlumno>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{fecha}</h2>
        {usuario && (
          <Link href="/alumno/cuenta">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{usuario.nombre}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Alumno</p>
              </div>
              <div className="relative w-12 h-12 overflow-hidden rounded-full ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <FiUser className="text-blue-500 dark:text-blue-300" size={24} />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Link href="/alumno/tareas" className="block">
          <Card 
            color="from-amber-400 to-amber-500" 
            title="Tareas Pendientes" 
            valor={loading ? '...' : estadisticas.tareasPendientes} 
            icon={<HiOutlineClipboardList className="text-3xl" />}
          />
        </Link>
        <Card 
          color="from-blue-500 to-blue-600" 
          title="Materias" 
          valor={loading ? '...' : estadisticas.totalMaterias} 
          icon={<HiOutlineBookOpen className="text-3xl" />}
        />
        <Card 
          color="from-emerald-500 to-emerald-600" 
          title="Próxima Clase" 
          valor={loading || !estadisticas.horario.length ? '...' : 
            `${estadisticas.horario[0]?.materia || 'Sin clases'}`} 
          icon={<HiOutlineClock className="text-3xl" />}
        />
      </div>

      {/* Horario */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Mi Horario</h3>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : estadisticas.horario.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">No hay clases programadas</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {estadisticas.horario.map((clase, index) => (
              <div key={index} className="py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <HiOutlineBookOpen className="text-xl" />
                  </div>
                  <span className="font-medium">{clase.materia}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">{clase.hora}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones de acción con navegación */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Acciones rápidas</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Link href="/alumno/tareas" className="w-full">
          <ActionButton text="Ver tareas" icon={<HiOutlineClipboardList />} />
        </Link>
      </div>
    </LayoutAlumno>
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
    <div className="flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-5 py-4 rounded-xl shadow-md hover:shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-200 cursor-pointer w-full h-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 group">
      <div className="text-blue-500 dark:text-blue-400 text-xl group-hover:scale-110 transition-transform">{icon}</div>
      <span className="font-medium">{text}</span>
    </div>
  );
}