import Layout from '@/components/Layout';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useMaestros from '@/hooks/useMaestros';
import ModalMaestro from '@/components/ModalMaestro';

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

      {/* Mensajes de éxito/error */}
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

      <h3 className="text-2xl font-bold mb-4">Maestros</h3>

      {loading ? (
        <p>Cargando maestros...</p>
      ) : error ? (
        <p className="text-red-500">Error al cargar maestros: {error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 mb-6">
          <div className="bg-gray-100 p-4 mb-4 rounded">
           
          </div>
          
          {maestros.length === 0 ? (
            <p>No hay maestros registrados</p>
          ) : (
            maestros.map((maestro, idx) => (
              <div key={idx} className="flex justify-between items-center border-b py-3">
                <div className="flex items-center gap-4">
                  <Image 
                    src={maestro.img || "/perfil.jpg"} 
                    alt={maestro.nombre} 
                    width={50} 
                    height={50} 
                    className="rounded-full" 
                  />
                  <div>
                    <p className="font-semibold">{maestro.nombre}</p>
                    <p className="text-sm text-gray-500">{maestro.email}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Botón añadir */}
      <div className="mt-4">
        <button
          onClick={() => setShowModalMaestro(true)}
          className="flex items-center gap-2 text-lg font-semibold hover:text-purple-600"
        >
          <span className="text-2xl">➕</span> Añadir maestro
        </button>
      </div>

      <ModalMaestro
        visible={showModalMaestro}
        onClose={() => setShowModalMaestro(false)}
        onSave={handleSaveMaestro}
      />
    </Layout>
  );
}
