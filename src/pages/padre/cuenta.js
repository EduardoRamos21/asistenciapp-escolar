import LayoutPadre from '@/components/LayoutPadre';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FaUser, FaEnvelope, FaEdit, FaSave, FaTimes, FaCalendarAlt, FaUserTie, FaWhatsapp, FaPhone } from 'react-icons/fa';

export default function CuentaPadre() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notificacionesWhatsapp, setNotificacionesWhatsapp] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [hijos, setHijos] = useState([]);

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
          .select('id, nombre, rol, escuela_id')
          .eq('id', user.id)
          .single();

        if (userDataError) throw userDataError;

        // Obtener información de contacto del padre
        const { data: infoPadre, error: infoPadreError } = await supabase
          .from('info_padres')
          .select('telefono, notificaciones_whatsapp')
          .eq('id', user.id)
          .single();

        // No lanzamos error si no existe, simplemente usamos valores predeterminados
        
        setUsuario({
          id: user.id,
          email: user.email,
          nombre: userData.nombre,
          rol: userData.rol,
          escuela_id: userData.escuela_id,
          telefono: infoPadre?.telefono || '',
          notificaciones_whatsapp: infoPadre?.notificaciones_whatsapp || false
        });

        setTelefono(infoPadre?.telefono || '');
        setNotificacionesWhatsapp(infoPadre?.notificaciones_whatsapp || false);

        // Obtener los hijos del padre
        const { data: hijosData, error: hijosError } = await supabase
          .from('padre_alumno')
          .select(`
            alumno_id,
            alumnos(id, usuario_id, grupo_id, 
              usuarios(nombre),
              grupos(nombre, grado)
            )
          `)
          .eq('padre_id', user.id);

        if (hijosError && hijosError.code !== 'PGRST116') {
          console.error('Error al cargar hijos:', hijosError);
        } else if (hijosData && hijosData.length > 0) {
          // Formatear datos de los hijos
          const hijosFormateados = hijosData.map(item => ({
            id: item.alumnos.id,
            nombre: item.alumnos.usuarios.nombre,
            grupo: item.alumnos.grupos ? `${item.alumnos.grupos.grado} - ${item.alumnos.grupos.nombre}` : 'Sin grupo'
          }));
          setHijos(hijosFormateados);
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

      // Actualizar o insertar información de contacto
      const { error: contactoError } = await supabase
        .from('info_padres')
        .upsert({
          id: usuario.id,
          telefono,
          notificaciones_whatsapp: notificacionesWhatsapp,
          updated_at: new Date()
        }, {
          onConflict: 'id'
        });

      if (contactoError) throw contactoError;

      setUsuario(prev => ({
        ...prev,
        nombre,
        telefono,
        notificaciones_whatsapp: notificacionesWhatsapp
      }));
      
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

  return (
    <LayoutPadre>
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
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6 shadow-sm">
            <p className="flex items-center">
              <span className="mr-2">✕</span> {mensajeError}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6 shadow-sm">
            <p className="flex items-center">
              <span className="mr-2">✕</span> Error al cargar perfil: {error}
            </p>
          </div>
        )}

        {/* Contenido principal */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Cargando información...</p>
          </div>
        ) : usuario ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-6 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="h-24 w-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                <FaUser className="text-white text-4xl" />
              </div>
              <div>
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
                    {usuario.rol}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                  <FaEnvelope className="mr-2 text-indigo-400" /> Correo electrónico
                </p>
                <p className="font-medium">{usuario.email}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Escuela</p>
                <p className="font-medium">{usuario.escuela_id ? `ID: ${usuario.escuela_id}` : 'No asignada'}</p>
              </div>
            </div>

            {/* Nueva sección para WhatsApp */}
            <div className="mb-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <FaWhatsapp className="mr-2 text-green-500" /> Notificaciones WhatsApp
              </h4>
              
              {editando ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Número de teléfono (WhatsApp)</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 dark:bg-gray-600 dark:text-gray-300 border border-r-0 border-gray-300 dark:border-gray-500 rounded-l-md">
                        <FaPhone />
                      </span>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ej: +52 1234567890"
                        className="border border-gray-300 dark:border-gray-600 p-2 rounded-r-lg w-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Incluye el código de país (Ej: +52 para México)</p>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notificaciones"
                      checked={notificacionesWhatsapp}
                      onChange={(e) => setNotificacionesWhatsapp(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="notificaciones" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Recibir notificaciones cuando mi hijo esté ausente
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  {usuario.telefono ? (
                    <div>
                      <p className="font-medium flex items-center">
                        <FaPhone className="mr-2 text-gray-500" /> {usuario.telefono}
                      </p>
                      <p className="text-sm mt-2">
                        {usuario.notificaciones_whatsapp 
                          ? <span className="text-green-600 dark:text-green-400 flex items-center"><FaWhatsapp className="mr-1" /> Notificaciones de ausencia activadas</span>
                          : <span className="text-gray-500 dark:text-gray-400">Notificaciones de ausencia desactivadas</span>
                        }
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      No has configurado un número de teléfono para recibir notificaciones.
                      Edita tu perfil para agregar uno.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sección de hijos */}
            {hijos.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Mis hijos</h4>
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {hijos.map(hijo => (
                      <li key={hijo.id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{hijo.nombre}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{hijo.grupo}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              {editando ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditando(false);
                      setNombre(usuario.nombre);
                    }}
                    className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
                  >
                    <FaTimes className="mr-2" /> Cancelar
                  </button>
                  <button
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center"
                  >
                    <FaSave className="mr-2" /> {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditando(true)}
                  className="bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center"
                >
                  <FaEdit className="mr-2" /> Editar perfil
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/30">
            <FaUser className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No se pudo cargar la información del usuario</p>
          </div>
        )}
      </div>
    </LayoutPadre>
  );
}