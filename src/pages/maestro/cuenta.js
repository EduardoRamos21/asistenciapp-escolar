import Layout from '@/components/Layout';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Cuenta() {
  const [usuario, setUsuario] = useState(null);
  const [maestro, setMaestro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  
  // Estados para cambio de contraseña
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener el usuario actual
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) throw new Error('No hay usuario autenticado');

        // Obtener datos del usuario
        const { data: userData, error: userDataError } = await supabase
          .from('usuarios')
          .select('id, nombre, rol')
          .eq('id', user.id)
          .single();

        if (userDataError) throw userDataError;

        // Obtener datos del maestro
        const { data: maestroData, error: maestroError } = await supabase
          .from('maestros')
          .select('id, especialidad')
          .eq('usuario_id', user.id)
          .single();

        if (maestroError && maestroError.code !== 'PGRST116') throw maestroError;

        setUsuario({
          id: user.id,
          email: user.email,
          nombre: userData.nombre,
          rol: userData.rol
        });

        if (maestroData) {
          setMaestro(maestroData);
        }

        setNombre(userData.nombre);
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    obtenerPerfil();
  }, []);

  const handleGuardar = async () => {
    if (nombre.trim() === '') {
      setMensajeError('El nombre es obligatorio');
      return;
    }

    setGuardando(true);
    setMensajeError('');
    setMensajeExito('');

    try {
      // Actualizar nombre en la tabla usuarios
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ nombre })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      setUsuario(prev => ({ ...prev, nombre }));
      setEditando(false);
      setMensajeExito('Perfil actualizado correctamente');
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setMensajeError(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarPassword = async () => {
    // Validaciones
    if (!passwordActual) {
      setMensajeError('La contraseña actual es obligatoria');
      return;
    }
    
    if (!passwordNueva) {
      setMensajeError('La nueva contraseña es obligatoria');
      return;
    }
    
    if (passwordNueva !== passwordConfirmacion) {
      setMensajeError('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordNueva.length < 6) {
      setMensajeError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setGuardandoPassword(true);
    setMensajeError('');
    setMensajeExito('');

    try {
      // Primero verificamos la contraseña actual iniciando sesión
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password: passwordActual,
      });

      if (signInError) {
        throw new Error('La contraseña actual es incorrecta');
      }

      // Cambiar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordNueva
      });

      if (updateError) throw updateError;

      // Limpiar campos y mostrar mensaje de éxito
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmacion('');
      setCambiandoPassword(false);
      setMensajeExito('Contraseña actualizada correctamente');
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setMensajeError(error.message);
    } finally {
      setGuardandoPassword(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Mi cuenta
        </h2>
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error al cargar perfil: {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : usuario ? (
        <div className="space-y-6">
          {/* Información del perfil */}
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <div className="flex items-center gap-6 mb-6">
              <Image 
                src="/perfil.jpg" 
                alt="Foto de perfil" 
                width={100} 
                height={100} 
                className="rounded-full border-2 border-gray-300" 
              />
              <div>
                {editando ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="border p-2 rounded w-full max-w-md"
                    />
                  </div>
                ) : (
                  <h3 className="text-2xl font-bold">{usuario.nombre}</h3>
                )}
                <p className="text-gray-600">{usuario.rol}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Correo electrónico</p>
                <p>{usuario.email}</p>
              </div>
              {maestro && (
                <div>
                  <p className="text-sm text-gray-500">Especialidad</p>
                  <p>{maestro.especialidad || 'No especificada'}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              {editando ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditando(false);
                      setNombre(usuario.nombre);
                    }}
                    className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="bg-[#282424] text-white px-4 py-2 rounded hover:bg-[#1f1c1c] disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditando(true)}
                  className="bg-[#282424] text-white px-4 py-2 rounded hover:bg-[#1f1c1c]"
                >
                  Editar perfil
                </button>
              )}
            </div>
          </div>

          {/* Cambio de contraseña */}
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <h3 className="text-lg font-semibold mb-4">Cambiar contraseña</h3>
            
            {cambiandoPassword ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contraseña actual</label>
                  <input
                    type="password"
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    className="border p-2 rounded w-full max-w-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    className="border p-2 rounded w-full max-w-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordConfirmacion}
                    onChange={(e) => setPasswordConfirmacion(e.target.value)}
                    className="border p-2 rounded w-full max-w-md"
                  />
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setCambiandoPassword(false);
                      setPasswordActual('');
                      setPasswordNueva('');
                      setPasswordConfirmacion('');
                    }}
                    className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCambiarPassword}
                    disabled={guardandoPassword}
                    className="bg-[#282424] text-white px-4 py-2 rounded hover:bg-[#1f1c1c] disabled:opacity-50"
                  >
                    {guardandoPassword ? 'Guardando...' : 'Cambiar contraseña'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  Si es la primera vez que inicias sesión, te recomendamos cambiar la contraseña predeterminada por una más segura.
                </p>
                <button
                  onClick={() => setCambiandoPassword(true)}
                  className="bg-[#282424] text-white px-4 py-2 rounded hover:bg-[#1f1c1c]"
                >
                  Cambiar contraseña
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <p className="text-gray-500">No se pudo cargar la información del usuario</p>
        </div>
      )}
    </Layout>
  );
}