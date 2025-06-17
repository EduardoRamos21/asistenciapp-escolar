import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function CuentaDirector() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      setCargando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUsuario(data);
        setNombre(data.nombre);
        setEmail(data.email);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      setMensajeError('Error al cargar datos del usuario');
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async () => {
    try {
      if (!usuario) return;
      
      // Actualizar en la tabla usuarios
      const { error } = await supabase
        .from('usuarios')
        .update({ nombre })
        .eq('id', usuario.id);
      
      if (error) throw error;
      
      // Actualizar en Auth si cambió el email
      if (email !== usuario.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email
        });
        
        if (authError) throw authError;
      }
      
      setMensajeExito('Datos actualizados correctamente');
      setTimeout(() => setMensajeExito(''), 3000);
      setEditando(false);
      cargarUsuario();
    } catch (error) {
      console.error('Error al actualizar:', error);
      setMensajeError(`Error al actualizar: ${error.message}`);
      setTimeout(() => setMensajeError(''), 3000);
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Mi Cuenta</h2>
      
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
      
      {cargando ? (
        <p>Cargando información...</p>
      ) : usuario ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-6 mb-6">
            <Image 
              src={usuario.img || "/perfil.jpg"} 
              alt="Perfil" 
              width={100} 
              height={100} 
              className="rounded-full" 
            />
            <div>
              <h3 className="text-xl font-semibold">{usuario.nombre}</h3>
              <p className="text-gray-500">Director</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              {editando ? (
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  className="w-full p-2 border rounded" 
                />
              ) : (
                <p>{usuario.nombre}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {editando ? (
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full p-2 border rounded" 
                />
              ) : (
                <p>{usuario.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <p>Director</p>
            </div>
          </div>
          
          <div className="mt-6">
            {editando ? (
              <div className="flex gap-3">
                <button 
                  onClick={handleGuardar}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Guardar cambios
                </button>
                <button 
                  onClick={() => {
                    setEditando(false);
                    setNombre(usuario.nombre);
                    setEmail(usuario.email);
                  }}
                  className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setEditando(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Editar información
              </button>
            )}
          </div>
        </div>
      ) : (
        <p>No se pudo cargar la información del usuario</p>
      )}
    </Layout>
  );
}