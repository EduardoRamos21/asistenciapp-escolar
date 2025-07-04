import Layout from '@/components/Layout';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { FiUser, FiCamera, FiEdit, FiSave, FiX, FiCheck, FiLock } from 'react-icons/fi';

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
      
      // Actualizar la URL del avatar en la tabla usuarios
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: avatarUrl })
        .eq('id', usuario.id);
      
      if (updateError) throw updateError;
      
      setAvatarUrl(avatarUrl);
      setPreview(null);
      setMensajeExito('Foto de perfil actualizada correctamente');
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      console.error('Error al subir avatar:', error);
      setMensajeError(`Error al subir imagen: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setPreview(null);
  };

  return (
    <Layout>
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FiUser className="text-blue-600 dark:text-blue-400" />
          Mi Cuenta
        </h2>
      </div>
      
      {mensajeExito && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <FiCheck className="text-green-600" />
          {mensajeExito}
        </div>
      )}
      
      {mensajeError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <FiX className="text-red-600" />
          {mensajeError}
        </div>
      )}
      
      {cargando ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : usuario ? (
        <div className="space-y-6">
          {/* Información del perfil */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <div className="relative group">
                {preview ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-200">
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
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-200">
                    {avatarUrl ? (
                      <Image 
                        src={avatarUrl} 
                        alt="Foto de perfil" 
                        fill={true}
                        className="rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-500">
                        <FiUser size={48} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <label htmlFor="avatar-upload" className="p-2 bg-purple-500 rounded-full text-white hover:bg-purple-600 transition-colors cursor-pointer">
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
                    <label className="block text-sm font-medium mb-1 text-gray-700">Nombre</label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="border border-gray-300 p-2 rounded-lg w-full max-w-md"
                    />
                  </div>
                ) : (
                  <h3 className="text-2xl font-bold text-gray-800">{usuario.nombre}</h3>
                )}
                <p className="text-gray-600 capitalize">Director</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Correo electrónico</p>
                {editando ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-gray-300 p-2 rounded-lg w-full mt-1"
                  />
                ) : (
                  <p className="text-gray-800">{usuario.email}</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Rol</p>
                <p className="text-gray-800">Director</p>
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
                    className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-2"
                  >
                    <FiX /> Cancelar
                  </button>
                  <button
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                  >
                    <FiSave /> {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditando(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <FiEdit /> Editar información
                </button>
              )}
            </div>
          </div>

          {/* Cambio de contraseña */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <FiLock className="text-purple-600" />
              Cambiar contraseña
            </h3>
            
            {cambiandoPassword ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Contraseña actual</label>
                  <input
                    type="password"
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    className="border border-gray-300 p-2 rounded-lg w-full max-w-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    className="border border-gray-300 p-2 rounded-lg w-full max-w-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordConfirmacion}
                    onChange={(e) => setPasswordConfirmacion(e.target.value)}
                    className="border border-gray-300 p-2 rounded-lg w-full max-w-md"
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
                    className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-2"
                  >
                    <FiX /> Cancelar
                  </button>
                  <button
                    onClick={handleCambiarPassword}
                    disabled={guardandoPassword}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                  >
                    <FiLock /> {guardandoPassword ? 'Guardando...' : 'Cambiar contraseña'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4 bg-purple-50 p-4 rounded-lg">
                  Si es la primera vez que inicias sesión, te recomendamos cambiar la contraseña predeterminada por una más segura.
                </p>
                <button
                  onClick={() => setCambiandoPassword(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <FiLock /> Cambiar contraseña
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg bg-gray-50">
          <p className="text-gray-500">No se pudo cargar la información del usuario</p>
        </div>
      )}
    </Layout>
  );
}