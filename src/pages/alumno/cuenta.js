import LayoutAlumno from '@/components/LayoutAlumno';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FiUser, FiCamera, FiEdit, FiSave, FiX, FiCheck, FiLock } from 'react-icons/fi';

export default function Cuenta() {
  const [usuario, setUsuario] = useState(null);
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

  // Estados para manejo de foto de perfil
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

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
          .select('id, nombre, rol, avatar_url')
          .eq('id', user.id)
          .single();

        if (userDataError) throw userDataError;

        // Verificar que el usuario es alumno
        if (userData.rol !== 'alumno') {
          throw new Error('No tienes permiso para acceder a esta página');
        }

        setUsuario({
          id: user.id,
          email: user.email,
          nombre: userData.nombre,
          rol: userData.rol,
          avatar_url: userData.avatar_url
        });

        if (userData.avatar_url) {
          setAvatarUrl(userData.avatar_url);
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
      // Verificar si hay un archivo seleccionado o una vista previa
      if (!fileInputRef.current?.files?.length && !preview) {
        setMensajeError('Por favor selecciona una imagen');
        return;
      }
      
      let file;
      
      // Si hay un archivo seleccionado directamente, usarlo
      if (fileInputRef.current?.files?.length) {
        file = fileInputRef.current.files[0];
      } 
      // Si no hay archivo pero hay vista previa, crear un archivo desde la vista previa
      else if (preview) {
        try {
          const response = await fetch(preview);
          const blob = await response.blob();
          file = new File([blob], "profile-image.jpg", { type: "image/jpeg" });
        } catch (error) {
          console.error("Error al crear archivo desde vista previa:", error);
          setMensajeError('Error al procesar la imagen. Por favor, selecciona otra.');
          return;
        }
      }
      
      if (!file) {
        setMensajeError('No se pudo procesar la imagen seleccionada');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${usuario.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
  
      setUploading(true);
      setMensajeError('');
      setMensajeExito('');
  
      // Subir archivo a Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
  
      if (uploadError) {
        throw uploadError;
      }
  
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
  
      // Actualizar avatar_url en la tabla usuarios
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: publicUrl })
        .eq('id', usuario.id);
  
      if (updateError) {
        throw updateError;
      }
  
      setAvatarUrl(publicUrl);
      setUsuario(prev => ({ ...prev, avatar_url: publicUrl }));
      setPreview(null);
      setMensajeExito('Foto de perfil actualizada correctamente');
      
      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      console.error('Error al subir imagen:', error);
      setMensajeError(error.message);
    } finally {
      setUploading(false);
    }
  };

  // Función para cancelar la subida de foto
  const cancelUpload = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <LayoutAlumno>
      {/* Encabezado con gradiente */}
      <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <FiUser className="text-blue-600 dark:text-blue-400" />
          Mi cuenta
        </h2>
      </div>

      {/* Mensajes de notificación */}
      {mensajeExito && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 animate-fade-in">
          <FiCheck className="text-green-600 dark:text-green-400" />
          {mensajeExito}
        </div>
      )}

      {mensajeError && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 animate-fade-in">
          <FiX className="text-red-600 dark:text-red-400" />
          {mensajeError}
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 animate-fade-in">
          <FiX className="text-red-600 dark:text-red-400" />
          Error al cargar perfil: {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : usuario ? (
        <div className="space-y-6 animate-fade-in">
          {/* Información del perfil */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <div className="relative group">
                {preview ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200 dark:border-blue-900">
                    <Image 
                      src={preview} 
                      alt="Vista previa" 
                      fill={true}
                      className="rounded-full object-cover" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        <button 
                          onClick={uploadAvatar} 
                          disabled={uploading}
                          className="p-2 bg-green-500 rounded-full text-white hover:bg-green-600 transition-colors"
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
                  </div>
                ) : (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200 dark:border-blue-900">
                    {avatarUrl ? (
                      <Image 
                        src={avatarUrl} 
                        alt="Foto de perfil" 
                        fill={true}
                        className="rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-500 dark:text-blue-300">
                        <FiUser size={48} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <label htmlFor="avatar-upload" className="p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors cursor-pointer">
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
                      className="border border-gray-300 dark:border-gray-600 p-2 rounded-lg w-full max-w-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                ) : (
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{usuario.nombre}</h3>
                )}
                <p className="text-gray-600 dark:text-gray-400 capitalize">{usuario.rol}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Correo electrónico</p>
                <p className="text-gray-800 dark:text-gray-200">{usuario.email}</p>
              </div>
            </div>

            <div className="flex justify-end">
              {editando ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditando(false);
                      setNombre(usuario.nombre);
                    }}
                    className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                  >
                    <FiX /> Cancelar
                  </button>
                  <button
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                  >
                    <FiSave /> {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditando(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <FiEdit /> Editar perfil
                </button>
              )}
            </div>
          </div>

          {/* Cambio de contraseña */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FiLock className="text-blue-600 dark:text-blue-400" />
              Cambiar contraseña
            </h3>
            
            {cambiandoPassword ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Contraseña actual</label>
                  <input
                    type="password"
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded-lg w-full max-w-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded-lg w-full max-w-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordConfirmacion}
                    onChange={(e) => setPasswordConfirmacion(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 p-2 rounded-lg w-full max-w-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                    className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                  >
                    <FiX /> Cancelar
                  </button>
                  <button
                    onClick={handleCambiarPassword}
                    disabled={guardandoPassword}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                  >
                    <FiLock /> {guardandoPassword ? 'Guardando...' : 'Cambiar contraseña'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  Si es la primera vez que inicias sesión, te recomendamos cambiar la contraseña predeterminada por una más segura.
                </p>
                <button
                  onClick={() => setCambiandoPassword(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <FiLock /> Cambiar contraseña
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <p className="text-gray-500 dark:text-gray-400">No se pudo cargar la información del usuario</p>
        </div>
      )}
    </LayoutAlumno>
  );
}