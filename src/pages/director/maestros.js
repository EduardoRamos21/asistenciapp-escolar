import Layout from '@/components/Layout';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useMaestros from '@/hooks/useMaestros';
import ModalMaestro from '@/components/ModalMaestro';
import { FiPlus } from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';

export default function VistaMaestros() {
  const { maestros, loading, error, crearMaestro, recargarMaestros } = useMaestros();
  const [showModalMaestro, setShowModalMaestro] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [fecha, setFecha] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

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

  // Añadir un efecto para recargar los maestros cuando la página obtiene el foco
  useEffect(() => {
    // Función para recargar cuando la ventana obtiene el foco
    const handleFocus = () => {
      recargarMaestros();
    };

    // Añadir event listener
    window.addEventListener('focus', handleFocus);

    // Limpiar event listener
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [recargarMaestros]);

  const handleSaveMaestro = async (nuevoMaestro) => {
    try {
      setMensajeError('');
      setMensajeExito('');
      
      // Mostrar mensaje de espera
      setMensajeExito('Creando maestro, por favor espere...');
      
      const resultado = await crearMaestro({
        nombre: nuevoMaestro.nombre,
        email: `${nuevoMaestro.nombre.toLowerCase().replace(/ /g, '.')}@escuela.com`,
        password: 'password123',
        materia: nuevoMaestro.materia
      });
  
      if (resultado.success) {
        setMensajeExito('Maestro creado correctamente');
        // Recargar la lista de maestros después de crear uno nuevo
        recargarMaestros();
        setTimeout(() => setMensajeExito(''), 3000);
      } else {
        // Si el error es de limitación de tasa, mostrar un mensaje específico
        if (resultado.error && resultado.error.includes('security purposes')) {
          setMensajeError('Por razones de seguridad, debes esperar 21 segundos antes de crear otro maestro');
        } else {
          setMensajeError(`Error al crear maestro: ${resultado.error}`);
        }
        setTimeout(() => setMensajeError(''), 5000);
      }
    } catch (error) {
      setMensajeError(`Error inesperado: ${error.message}`);
      setTimeout(() => setMensajeError(''), 5000);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header con fecha y perfil */}
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-indigo-800 dark:text-indigo-300">{fecha}</h2>
          {usuario && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{usuario.nombre}</p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Director</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-full opacity-70 blur-[1px]"></div>
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
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-lg text-indigo-700 dark:text-indigo-300">
            <FaChalkboardTeacher size={24} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Maestros</h3>
        </div>

        {/* Estado de carga */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
            <p>Error al cargar maestros: {error}</p>
          </div>
        ) : (
          <div className="mb-8">
            {/* Contenedor para la lista de maestros */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg">
              {maestros.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="mb-4 text-5xl opacity-30">👨‍🏫</div>
                  <p>No hay maestros registrados</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {maestros.map((maestro, idx) => {
                    // Generar un color basado en el nombre del maestro
                    const colors = [
                      'from-blue-500 to-indigo-500',
                      'from-purple-500 to-pink-500',
                      'from-green-500 to-teal-500',
                      'from-red-500 to-orange-500',
                      'from-yellow-500 to-amber-500',
                      'from-cyan-500 to-sky-500'
                    ];
                    // Usar el índice o alguna propiedad del maestro para seleccionar un color
                    const colorIndex = maestro.nombre.length % colors.length;
                    const gradientColor = colors[colorIndex];
                    
                    return (
                      <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                        <div className="flex items-center gap-4">
                          <div className="relative w-[50px] h-[50px]">
                            <div className={`absolute inset-0 bg-gradient-to-tr ${gradientColor} rounded-full opacity-70`}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                              <FaChalkboardTeacher size={24} />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white">{maestro.nombre}</p>
                            <p className="text-sm text-indigo-600 dark:text-indigo-400">{maestro.email}</p>
                            {maestro.materia && (
                              <span className="inline-block mt-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 py-1 px-2 rounded-full">
                                {maestro.materia}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botón añadir */}
        <div className="mt-8">
          <button
            onClick={() => setShowModalMaestro(true)}
            className="flex items-center gap-2 text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-200 group"
          >
            <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors duration-200">
              <FiPlus size={20} />
            </span>
            Añadir maestro
          </button>
        </div>

        <ModalMaestro
          visible={showModalMaestro}
          onClose={() => setShowModalMaestro(false)}
          onSave={handleSaveMaestro}
        />
      </div>
    </Layout>
  );
}