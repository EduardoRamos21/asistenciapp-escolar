import Layout from '@/components/Layout';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { FiUser, FiCamera, FiEdit, FiSave, FiX, FiCheck, FiLock } from 'react-icons/fi';
import { FaCalendarAlt, FaUserTie } from 'react-icons/fa';

export default function CuentaDirector() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [guardando, setGuardando] = useState(false);
  
  // Estados para cambio de contraseña
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  // Estados para manejo de foto de perfil
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

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
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
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
      
      setGuardando(true);
      setMensajeError('');
      setMensajeExito('');
      
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
        // En lugar de lanzar un error, establecemos el mensaje de error y salimos
        setMensajeError('La contraseña actual es incorrecta');
        // Hacer que el mensaje desaparezca después de 5 segundos
        setTimeout(() => setMensajeError(''), 5000);
        setGuardandoPassword(false);
        // NO cambiamos el estado de cambiandoPassword, lo mantenemos como true
        return;
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

  // Función para manejar la selección de archivo
  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    const fileReader = new FileReader();
    
    fileReader.onloadend = () => {
      setPreview(fileReader.result);
    };
    
    fileReader.readAsDataURL(file);
  };

  // Función para subir la foto de perfil
  const uploadAvatar = async () => {
    try {
      if (!preview) return;
      
      setUploading(true);
      
      // Generar un nombre único para el archivo
      const fileExt = preview.split(';')[0].split('/')[1];
      const fileName = `${usuario.id}-${Date.now()}.${fileExt}`;
      
      // Convertir la imagen base64 a un blob
      const res = await fetch(preview);
      const blob = await res.blob();
      
      // Subir el archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Obtener la URL pública del archivo
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const avatarUrl = data.publicUrl;
      
      // Actualizar el perfil del usuario con la nueva URL
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: avatarUrl })
        .eq('id', usuario.id);
      
      if (updateError) throw updateError;
      
      // Actualizar el estado
      setAvatarUrl(avatarUrl);
      setPreview(null);
      setMensajeExito('Foto de perfil actualizada');
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      console.error('Error al subir avatar:', error);
      setMensajeError(`Error al subir imagen: ${error.message}`);
      setTimeout(() => setMensajeError(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent flex items-center">
            <FaUserTie className="mr-2 text-indigo-500" /> Mi cuenta
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <FaCalendarAlt className="mr-1 text-indigo-400" />
            {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Mensajes */}
        {mensajeExito && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-l-4 border-green-500 text-green-700 dark:text-green-400 p-4 rounded-lg mb-6 shadow-sm animate-fadeIn">
            <p className="flex items-center">
              <span className="mr-2">✓</span> {mensajeExito}
            </p>
          </div>
        )}

        {mensajeError && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg shadow-lg max-w-md w-full pointer-events-auto">
            <div className="flex items-center">
              <span className="mr-2">✕</span>
              <div className="flex-grow">{mensajeError}</div>
              <button 
                onClick={() => setMensajeError('')} 
                className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
              >
                <span>✕</span>
              </button>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {cargando ? (
          <div className="flex flex-col justify-center items-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Cargando información...</p>
          </div>
        ) : usuario ? (
          <div className="space-y-6">
            {/* Información del perfil */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
                <div className="relative group">
                  {preview ? (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-200 dark:border-indigo-800">
                      <Image 
                        src={preview} 
                        alt="Vista previa" 
                        fill={true}
                        className="rounded-full object-cover" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center space-x-2">
                        <button 
                          onClick={uploadAvatar}
                          disabled={uploading}
                          className="p-2 bg-indigo-500 rounded-full text-white hover:bg-indigo-600 transition-colors"
                        >
                          <FiCheck />
                        </button>
                        <button 
                          onClick={cancelUpload}
                          className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-200 dark:border-indigo-800">
                      {avatarUrl ? (
                        <Image 
                          src={avatarUrl} 
                          alt="Foto de perfil" 
                          fill={true}
                          className="rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                          <FiUser size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label htmlFor="avatar-upload" className="p-2 bg-indigo-500 rounded-full text-white hover:bg-indigo-600 transition-colors cursor-pointer">
                          <FiCamera />
                        </label>
                        <input 
                          id="avatar-upload" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          ref={fileInputRef}
                          className="hidden" 
                        />
                      </div>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div className="text-center md:text-left">
                  {editando ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre</label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded-lg w-full max-w-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
                      />
                    </div>
                  ) : (
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">{usuario.nombre}</h3>
                  )}
                  <p className="text-gray-600 dark:text-gray-400 flex items-center">
                    <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 rounded-full text-xs font-medium">
                      Director
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Correo electrónico</p>
                  {editando ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded-lg w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
                    />
                  ) : (
                    <p className="font-medium">{usuario.email}</p>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rol</p>
                  <p className="font-medium">Director</p>
                </div>
              </div>

              <div className="flex justify-end">
                {editando ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditando(false);
                        setNombre(usuario.nombre);
                        setEmail(usuario.email);
                      }}
                      className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
                    >
                      <FiX className="mr-2" /> Cancelar
                    </button>
                    <button
                      onClick={handleGuardar}
                      disabled={guardando}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center"
                    >
                      <FiSave className="mr-2" /> {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditando(true)}
                    className="bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center"
                  >
                    <FiEdit className="mr-2" /> Editar información
                  </button>
                )}
              </div>
            </div>

            {/* Cambio de contraseña */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiLock className="mr-2 text-indigo-500" />
                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Cambiar contraseña</span>
              </h3>
              
              {cambiandoPassword ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Contraseña actual</label>
                    <input
                      type="password"
                      value={passwordActual}
                      onChange={(e) => setPasswordActual(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded-lg w-full max-w-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nueva contraseña</label>
                    <input
                      type="password"
                      value={passwordNueva}
                      onChange={(e) => setPasswordNueva(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded-lg w-full max-w-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      value={passwordConfirmacion}
                      onChange={(e) => setPasswordConfirmacion(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded-lg w-full max-w-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                    <button
                      onClick={() => {
                        setCambiandoPassword(false);
                        setPasswordActual('');
                        setPasswordNueva('');
                        setPasswordConfirmacion('');
                      }}
                      className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center mb-2 sm:mb-0"
                    >
                      <FiX className="mr-2" /> Cancelar
                    </button>
                    <button
                      onClick={handleCambiarPassword}
                      disabled={guardandoPassword}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                    >
                      {guardandoPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Cambiando...
                        </>
                      ) : (
                        <>
                          <FiLock className="mr-2" /> Cambiar contraseña
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <p className="text-gray-600 dark:text-gray-400">
                    Si es la primera vez que inicias sesión, te recomendamos cambiar la contraseña predeterminada por una más segura.
                  </p>
                  <button
                    onClick={() => setCambiandoPassword(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center whitespace-nowrap"
                  >
                    <FiLock className="mr-2" /> Cambiar contraseña
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/30">
            <FiUser className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No se pudo cargar la información del usuario</p>
          </div>
        )}
      </div>
    </Layout>
  );
}