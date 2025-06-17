import Layout from '@/components/Layout';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useEstadisticas from '@/hooks/useEstadisticas';

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
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{fecha}</h2>
        {usuario && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold">{usuario.nombre}</p>
              <p className="text-sm text-gray-500">Director</p>
            </div>
            <Image 
              src={usuario.img || "/perfil.jpg"} 
              alt="perfil" 
              width={40} 
              height={40} 
              className="rounded-full" 
            />
          </div>
        )}
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card color="bg-cyan-600" title="Maestros" valor={loading ? '...' : estadisticas.totalMaestros} />
        <Card color="bg-yellow-400" title="Alumnos" valor={loading ? '...' : estadisticas.totalAlumnos} />
        <Card color="bg-green-500" title="Asistencia del día" valor={loading ? '...' : `${estadisticas.asistenciaDia}%`} />
        <Card color="bg-blue-500" title="Asistencia semanal" valor={loading ? '...' : `${estadisticas.asistenciaSemana}%`} />
      </div>

   

      {/* Botones de acción con navegación */}
      <div className="flex flex-wrap gap-4">
        <Link href="/director/maestros">
          <ActionButton text="Ver maestros" icon="👨‍🏫" />
        </Link>
        <Link href="/director/grupos">
          <ActionButton text="Ver grupos" icon="👥" />
        </Link> 
        <Link href="/director/grupos">
          <ActionButton text="Gestionar materias" icon="📘" />
        </Link>
        <Link href="/director/asignar-padre">
          <ActionButton text="Asignar padres" icon="👨‍👩‍👧‍👦" />
        </Link>
      </div>
    </Layout>
  );
}

function Card({ color, title, valor }) {
  return (
    <div className={`${color} text-white rounded-xl shadow-md p-6 text-center`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-3xl font-bold">{valor}</p>
    </div>
  );
}

function ActionButton({ text, icon }) {
  return (
    <div className="flex items-center gap-2 bg-[#282424] text-white px-5 py-3 rounded-lg shadow hover:bg-[#3b3939] transition cursor-pointer">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
