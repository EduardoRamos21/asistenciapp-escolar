import Layout from '@/components/Layout';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModalGrupo from '@/components/ModalGrupo';
import useGrupos from '@/hooks/useGrupos';
import { supabase } from '@/lib/supabase';

export default function VistaGrupos() {
  const router = useRouter();
  const { grupos, loading, error, crearGrupo } = useGrupos();
  const [showModalGrupo, setShowModalGrupo] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [fecha, setFecha] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

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

  const handleSaveGrupo = async (nuevoGrupo) => {
    try {
      setMensajeError('');
      setMensajeExito('');

      const { data: { user } } = await supabase.auth.getUser();

      const { data: director, error: errorDirector } = await supabase
        .from('directores')
        .select('escuela_id')
        .eq('usuario_id', user.id)
        .single();

      if (errorDirector || !director) {
        throw new Error('No se pudo obtener la escuela del director.');
      }

      const resultado = await crearGrupo({
        nombre: nuevoGrupo.nombre,
        grado: nuevoGrupo.grado || '',
        escuela_id: director.escuela_id
      });

      if (resultado.success) {
        setMensajeExito('Grupo creado correctamente');
        setTimeout(() => setMensajeExito(''), 3000);
      } else {
        throw new Error(resultado.error);
      }
    } catch (error) {
      setMensajeError(`Error al crear grupo: ${error.message}`);
      setTimeout(() => setMensajeError(''), 3000);
    }
  };

  const verDetalleGrupo = (id) => {
    router.push(`/director/grupo/${id}`);
  };

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

      {mensajeExito && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {mensajeExito}
        </div>
      )}
      {mensajeError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {mensajeError}
        </div>
      )}

      <h3 className="text-2xl font-bold mb-4">Grupos</h3>

      {loading ? (
        <p>Cargando grupos...</p>
      ) : error ? (
        <p className="text-red-500">Error al cargar grupos: {error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {grupos.length === 0 ? (
            <p>No hay grupos registrados</p>
          ) : (
            grupos.map((grupo) => (
              <div 
                key={grupo.id} 
                className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition"
                onClick={() => verDetalleGrupo(grupo.id)}
              >
                <h4 className="text-xl font-bold mb-2">{grupo.nombre}</h4>
                <p><strong>Grado:</strong> {grupo.grado || 'No especificado'}</p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => setShowModalGrupo(true)}
          className="flex items-center gap-2 text-lg font-semibold hover:text-purple-600"
        >
          <span className="text-2xl">➕</span> Añadir grupo
        </button>
      </div>

      <ModalGrupo
        visible={showModalGrupo}
        onClose={() => setShowModalGrupo(false)}
        onSave={handleSaveGrupo}
      />
    </Layout>
  );
}
