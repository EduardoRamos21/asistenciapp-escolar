import LayoutDirector from '@/components/LayoutDirector'; // Cambiar esta línea
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useEstadisticas from '@/hooks/useEstadisticas';
import { HiOutlineAcademicCap, HiOutlineBookOpen, HiOutlineUserGroup } from 'react-icons/hi';
import { HiOutlineClipboardCheck } from 'react-icons/hi';
import { RiParentLine } from 'react-icons/ri';

export default function DirectorDashboard() {
  const { estadisticas, loading, error } = useEstadisticas();
  const [usuario, setUsuario] = useState(null);
  const [fecha, setFecha] = useState('');

  // Obtener información del usuario y fecha actual
  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('nombre, img')
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
    <LayoutDirector> {/* Cambiar Layout por LayoutDirector */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{fecha}</h2>
        {usuario && (
          <Link href="/director/cuenta">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{usuario.nombre}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Director</p>
              </div>
              <div className="relative w-12 h-12 overflow-hidden rounded-full ring-2 ring-blue-500 dark:ring-blue-400">
                <Image 
                  src={usuario.img || "/perfil.jpg"} 
                  alt="perfil" 
                  width={48} 
                  height={48} 
                  className="object-cover" 
                />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Link href="/director/maestros" className="w-full">
          <Card 
            color="from-blue-500 to-blue-600" 
            title="Maestros" 
            valor={loading ? '...' : estadisticas.totalMaestros} 
            icon={<HiOutlineAcademicCap className="text-4xl" />}
          />
        </Link>
        <Link href="/director/grupos" className="w-full">
          <Card 
            color="from-amber-400 to-amber-500" 
            title="Alumnos" 
            valor={loading ? '...' : estadisticas.totalAlumnos} 
            icon={<HiOutlineAcademicCap className="text-4xl" />}
          />
        </Link>
        <Card 
          color="from-emerald-500 to-emerald-600" 
          title="Asistencia del día" 
          valor={loading ? '...' : `${estadisticas.asistenciaDia.toFixed(6)}%`} 
          icon={<HiOutlineClipboardCheck className="text-4xl" />}
        />
        <Card 
          color="from-indigo-500 to-indigo-600" 
          title="Asistencia semanal" 
          valor={loading ? '...' : `${estadisticas.asistenciaSemana.toFixed(6)}%`} 
          icon={<HiOutlineClipboardCheck className="text-4xl" />}
        />
      </div>

      {/* Botones de acción con navegación */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Acciones rápidas</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/director/maestros" className="w-full">
          <ActionButton text="Ver maestros" icon={<HiOutlineAcademicCap className="text-2xl" />} />
        </Link>
        <Link href="/director/grupos" className="w-full">
          <ActionButton text="Ver grupos" icon={<HiOutlineUserGroup className="text-2xl" />} />
        </Link> 
        <Link href="/director/grupos" className="w-full">
          <ActionButton text="Gestionar materias" icon={<HiOutlineBookOpen className="text-2xl" />} />
        </Link>
        <Link href="/director/asignar-padre" className="w-full">
          <ActionButton text="Asignar padres" icon={<RiParentLine className="text-2xl" />} />
        </Link>
      </div>
    </LayoutDirector>
  );
}

function Card({ color, title, valor, icon }) {
  return (
    <div className={`bg-gradient-to-r ${color} text-white rounded-xl shadow-lg p-6 transition-transform hover:scale-105 overflow-hidden relative cursor-pointer`}>
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