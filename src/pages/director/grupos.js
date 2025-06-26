import Layout from '@/components/Layout';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModalGrupo from '@/components/ModalGrupo';
import useGrupos from '@/hooks/useGrupos';
import { supabase } from '@/lib/supabase';
import { FiPlus } from 'react-icons/fi';
import { HiUserGroup } from 'react-icons/hi';

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
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header con fecha y perfil */}
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-300">{fecha}</h2>
          {usuario && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{usuario.nombre}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Director</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-yellow-500 rounded-full opacity-70 blur-[1px]"></div>
                <Image 
                  src={usuario.img || "/perfil.jpg"} 
                  alt="perfil" 
                  width={45} 
                  height={45} 
                  className="rounded-full border-2 border-white dark:border-gray-700 relative z-10 object-cover" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Mensajes de éxito/error */}
        {mensajeExito && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 px-6 py-4 rounded-lg mb-6 shadow-sm transition-all duration-300 animate-fadeIn flex items-center">
            <div className="mr-3 text-green-500 dark:text-green-300 text-xl">✓</div>
            <p>{mensajeExito}</p>
          </div>
        )}
        {mensajeError && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg mb-6 shadow-sm transition-all duration-300 animate-fadeIn flex items-center">
            <div className="mr-3 text-red-500 dark:text-red-300 text-xl">⚠</div>
            <p>{mensajeError}</p>
          </div>
        )}

        {/* Título de sección con icono */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-lg text-amber-700 dark:text-amber-300">
            <HiUserGroup size={24} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Grupos</h3>
        </div>

        {/* Estado de carga */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
            <p>Error al cargar grupos: {error}</p>
          </div>
        ) : (
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {grupos.length === 0 ? (
                <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="mb-4 text-5xl opacity-30">👨‍👩‍👧‍👦</div>
                  <p>No hay grupos registrados</p>
                </div>
              ) : (
                grupos.map((grupo) => (
                  <div 
                    key={grupo.id} 
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] cursor-pointer group"
                    onClick={() => verDetalleGrupo(grupo.id)}
                  >
                    <div className="h-2 bg-gradient-to-r from-amber-400 to-yellow-400 dark:from-amber-500 dark:to-yellow-500"></div>
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{grupo.nombre}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Grado:</span>
                            <span className="inline-block text-sm bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 py-1 px-2 rounded-full">
                              {grupo.grado || 'No especificado'}
                            </span>
                          </div>
                        </div>
                        <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg text-amber-700 dark:text-amber-300 opacity-70 group-hover:opacity-100 transition-opacity">
                          <HiUserGroup size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Botón añadir */}
        <div className="mt-8">
          <button
            onClick={() => setShowModalGrupo(true)}
            className="flex items-center gap-2 text-lg font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors duration-200 group"
          >
            <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 p-2 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors duration-200">
              <FiPlus size={20} />
            </span>
            Añadir grupo
          </button>
        </div>

        <ModalGrupo
          visible={showModalGrupo}
          onClose={() => setShowModalGrupo(false)}
          onSave={handleSaveGrupo}
        />
      </div>
    </Layout>
  );
}