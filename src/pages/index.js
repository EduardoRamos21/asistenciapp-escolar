import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const [modo, setModo] = useState('login'); // login | registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Iniciar sesión con Supabase Auth
      const { data, error: errorLogin } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (errorLogin) {
        throw new Error(errorLogin.message);
      }

      // 2. Obtener rol del usuario
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', data.user.id)
        .single();

      // Si no existe el usuario en la tabla 'usuarios', crearlo con rol predeterminado
      if (errorUsuario) {
        // Crear el usuario en la tabla usuarios con rol predeterminado
        const { error: errorInsert } = await supabase.from('usuarios').insert([
          {
            id: data.user.id,
            nombre: data.user.email.split('@')[0], // Nombre temporal basado en email
            email: data.user.email,
            rol: 'padre', // Rol predeterminado
            escuela_id: null,
          },
        ]);

        if (errorInsert) {
          throw new Error('Error al crear perfil de usuario: ' + errorInsert.message);
        }

        // AGREGAR ESTA LÍNEA
        setLoading(false);
        // Redirigir al panel de padre (rol predeterminado)
        router.push('/padre');
        return;
      }

      // AGREGAR ESTA LÍNEA ANTES DE LAS REDIRECCIONES
      setLoading(false);
      
      // 3. Redirigir por rol
      if (usuario.rol === 'maestro') router.push('/maestro');
      else if (usuario.rol === 'padre') router.push('/padre');
      else if (usuario.rol === 'director') router.push('/director');
      else if (usuario.rol === 'alumno') router.push('/alumno');
      else if (usuario.rol === 'admin_sistema') router.push('/admin');
      else throw new Error('Rol no reconocido.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async () => {
    if (!nombre || !email || !password) {
      setError('Por favor, completa todos los campos')
      return
    }
  
    setError('')
    setLoading(true)
  
    try {
      // 1. Crear usuario en Supabase Auth
      const { data, error: errorAuth } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre },
          emailRedirectTo: window.location.origin,
        },
      })
  
      if (errorAuth) {
        throw new Error(errorAuth.message)
      }
  
      const userId = data?.user?.id || data?.session?.user?.id
  
      if (!userId) throw new Error('No se pudo obtener el ID del usuario')
  
      // 2. Verificar si ya existe en la tabla usuarios
      const { data: existente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single()
  
      if (!existente) {
        // 3. Insertar en la tabla usuarios si no existe
        const { error: errorInsert } = await supabase.from('usuarios').insert([
          {
            id: userId,
            nombre,
            email,
            rol: 'padre', // rol predeterminado
            escuela_id: null,
          },
        ])
  
        if (errorInsert) {
          throw new Error('Error al crear perfil: ' + errorInsert.message)
        }
      }
  
      // 4. Iniciar sesión explícitamente
      const { error: errorSignIn } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
  
      if (errorSignIn) {
        throw new Error('Error al iniciar sesión: ' + errorSignIn.message)
      }
  
      // 5. Redirigir
      setTimeout(() => {
        router.push('/padre')
      }, 1000)
    } catch (error) {
      setError(error.message)
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl p-6 gap-8">
        {/* Nuevo elemento visual en lugar del logo */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left mb-8 md:mb-0 transition-all duration-500 max-w-md">
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full opacity-40"></div>
            <div className="absolute inset-4 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-full opacity-60"></div>
            <div className="absolute inset-6 bg-gradient-to-br from-blue-800 to-indigo-900 rounded-full opacity-80 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">AsistenciAPP</h1>
          <div className="hidden md:block">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-slate-700 dark:text-slate-200">Control de asistencias en tiempo real</span>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-slate-700 dark:text-slate-200">Comunicación entre padres y maestros</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-slate-700 dark:text-slate-200">Reportes y estadísticas detalladas</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="flex-1 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full relative overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="transition-all duration-700 ease-in-out">
            {modo === 'login' ? (
              <div key="login" className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Iniciar Sesión
                </h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cargando...
                    </>
                  ) : 'Iniciar Sesión'}
                </button>
                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-4">
                    Al iniciar sesión, aceptas los Términos y Políticas de la plataforma.
                  </p>
                  <p className="text-sm text-center">
                    ¿No tienes cuenta?{' '}
                    <button onClick={() => setModo('registro')} className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                      Regístrate aquí
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <div key="registro" className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Crear Cuenta
                </h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre completo</label>
                  <input
                    type="text"
                    placeholder="Nombre y apellidos"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                  />
                </div>
                <button
                  onClick={handleRegistro}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cargando...
                    </>
                  ) : 'Crear Cuenta'}
                </button>
                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-4">
                    Al registrarte, aceptas los Términos y Políticas de la plataforma.
                  </p>
                  <p className="text-sm text-center">
                    ¿Ya tienes cuenta?{' '}
                    <button onClick={() => setModo('login')} className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                      Inicia sesión
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
