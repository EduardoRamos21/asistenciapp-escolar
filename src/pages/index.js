import { useState } from 'react';
import Image from 'next/image';
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

        // Redirigir al panel de padre (rol predeterminado)
        router.push('/padre');
        return;
      }

      // 3. Redirigir por rol
      if (usuario.rol === 'maestro') router.push('/maestro');
      else if (usuario.rol === 'padre') router.push('/padre');
      else if (usuario.rol === 'director') router.push('/director');
      else if (usuario.rol === 'alumno') router.push('/alumno');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#282424] to-gray-900">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-5xl p-6">
        {/* Logo */}
        <div className="flex-1 flex flex-col items-center text-white mb-8 md:mb-0 transition-all duration-500">
          <Image src="/logo.png" alt="Logo" width={120} height={120} className="mb-4" />
          <h1 className="text-3xl font-bold">AsistenciAPP</h1>
        </div>

        {/* Formulario */}
        <div className="flex-1 bg-white p-8 rounded-xl shadow-xl max-w-md w-full relative overflow-hidden">
          <div className="transition-all duration-700 ease-in-out">
            {modo === 'login' ? (
              <div key="login" className="animate-fade-in">
                <h2 className="text-xl font-bold mb-6 text-black">INICIA SESIÓN</h2>
                <input
                  type="email"
                  placeholder="Correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-black w-full p-2 mb-4 rounded"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-black w-full p-2 mb-6 rounded"
                />
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="bg-[#282424] text-white w-full py-2 font-semibold rounded hover:bg-[#1f1c1c] disabled:opacity-70"
                >
                  {loading ? 'CARGANDO...' : 'INICIAR SESIÓN'}
                </button>
                {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
                <p className="text-xs text-center mt-6 text-gray-600">
                  Al iniciar sesión, aceptas los <br />
                  Términos y Políticas de la plataforma.
                </p>
                <p className="text-sm text-center mt-4">
                  ¿No tienes cuenta?{' '}
                  <button onClick={() => setModo('registro')} className="text-blue-600 font-semibold hover:underline">
                    Regístrate aquí
                  </button>
                </p>
              </div>
            ) : (
              <div key="registro" className="animate-fade-in">
                <h2 className="text-xl font-bold mb-6 text-black">REGÍSTRATE</h2>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="border border-black w-full p-2 mb-4 rounded"
                />
                <input
                  type="email"
                  placeholder="Correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-black w-full p-2 mb-4 rounded"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-black w-full p-2 mb-6 rounded"
                />
                <button
                  onClick={handleRegistro}
                  disabled={loading}
                  className="bg-[#282424] text-white w-full py-2 font-semibold rounded hover:bg-[#1f1c1c] disabled:opacity-70"
                >
                  {loading ? 'CARGANDO...' : 'REGÍSTRATE'}
                </button>
                {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
                <p className="text-xs text-center mt-6 text-gray-600">
                  Al registrarte, aceptas los <br />
                  Términos y Políticas de la plataforma.
                </p>
                <p className="text-sm text-center mt-4">
                  ¿Ya tienes cuenta?{' '}
                  <button onClick={() => setModo('login')} className="text-blue-600 font-semibold hover:underline">
                    Inicia sesión
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 