import LayoutAdmin from '@/components/LayoutAdmin';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FiLock, FiX } from 'react-icons/fi'; // Importamos los iconos necesarios

export default function CuentaAdmin() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    email: ''
    // Se eliminó img del estado
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Estados para cambio de contraseña
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  useEffect(() => {
    const fetchUsuario = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setUsuario(data);
          setFormData({
            nombre: data.nombre || '',
            email: user.email || ''
            // Se eliminó img del estado
          });
        }
      }
      setLoading(false);
    };

    fetchUsuario();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Se eliminó la función handleImageUpload

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    if (!formData.nombre) {
      setMessage({ text: 'Por favor ingresa tu nombre', type: 'error' });
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre: formData.nombre
          // Se eliminó la actualización de img
        })
        .eq('id', usuario.id);

      if (error) throw error;

      setMessage({ text: 'Perfil actualizado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error:', error);
      setMessage({ text: 'Error al actualizar el perfil', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Función para cambiar la contraseña
  const handleCambiarPassword = async () => {
    // Validaciones
    if (!passwordActual) {
      setMessage({ text: 'La contraseña actual es obligatoria', type: 'error' });
      return;
    }
    
    if (!passwordNueva) {
      setMessage({ text: 'La nueva contraseña es obligatoria', type: 'error' });
      return;
    }
    
    if (passwordNueva !== passwordConfirmacion) {
      setMessage({ text: 'Las contraseñas no coinciden', type: 'error' });
      return;
    }
    
    if (passwordNueva.length < 6) {
      setMessage({ text: 'La contraseña debe tener al menos 6 caracteres', type: 'error' });
      return;
    }

    setGuardandoPassword(true);
    setMessage({ text: '', type: '' });

    try {
      // Primero verificamos la contraseña actual iniciando sesión
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: passwordActual,
      });

      if (signInError) {
        // En lugar de lanzar un error, establecemos el mensaje de error y salimos
        setMessage({ text: 'La contraseña actual es incorrecta', type: 'error' });
        setGuardandoPassword(false);
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
      setMessage({ text: 'Contraseña actualizada correctamente', type: 'success' });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setMessage({ text: `Error al cambiar contraseña: ${error.message}`, type: 'error' });
    } finally {
      setGuardandoPassword(false);
    }
  };

  if (loading) {
    return (
      <LayoutAdmin>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </LayoutAdmin>
    );
  }

  return (
    <LayoutAdmin>
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Mi Cuenta</h2>
          
          {message.text && message.type === 'error' && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-4 py-3 rounded-lg shadow-lg max-w-md w-full pointer-events-auto flex items-center gap-2">
              <div className="flex-grow">{message.text}</div>
              <button 
                onClick={() => setMessage({text: '', type: ''})} 
                className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          )}
          
          {message.text && message.type === 'success' && (
            <div className="p-4 mb-6 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-purple-200 dark:border-purple-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {/* Icono de usuario SVG */}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-16 h-16 text-gray-500 dark:text-gray-400"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              </div>
              {/* Se eliminó el botón para cambiar imagen */}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <input 
                type="text" 
                name="nombre" 
                value={formData.nombre} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700" 
                required 
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 cursor-not-allowed overflow-hidden break-words" 
                disabled 
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">El email no se puede cambiar</p>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>

          {/* Sección de cambio de contraseña */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <FiLock className="text-purple-600" />
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordConfirmacion}
                    onChange={(e) => setPasswordConfirmacion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3 mt-4">
                  <button
                    onClick={() => {
                      setCambiandoPassword(false);
                      setPasswordActual('');
                      setPasswordNueva('');
                      setPasswordConfirmacion('');
                    }}
                    className="whitespace-nowrap border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                  >
                    <FiX /> Cancelar
                  </button>
                  <button
                    onClick={handleCambiarPassword}
                    disabled={guardandoPassword}
                    className="whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                  >
                    <FiLock /> {guardandoPassword ? 'Guardando...' : 'Cambiar contraseña'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
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
      </div>
    </LayoutAdmin>
  );
}