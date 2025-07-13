import LayoutMaestro from '@/components/LayoutMaestro';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { HiUserGroup, HiOutlineAcademicCap, HiOutlinePlus } from 'react-icons/hi';
import { FaUserGraduate } from 'react-icons/fa';
import ModalAlumno from '@/components/ModalAlumno';
import useAlumnos from '@/hooks/useAlumnos';

export default function GruposMaestro() {
  const [usuario, setUsuario] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [showModalAlumno, setShowModalAlumno] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Obtener información del usuario y sus grupos asignados
  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Usuario no autenticado');
          return;
        }

        // Obtener datos del usuario
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('nombre, avatar_url')
          .eq('id', user.id)
          .single();

        if (usuarioData) {
          setUsuario({
            id: user.id,
            nombre: usuarioData.nombre,
            avatar_url: usuarioData.avatar_url
          });
        }

        // Obtener el ID del maestro
        const { data: maestro, error: errorMaestro } = await supabase
          .from('maestros')
          .select('id')
          .eq('usuario_id', user.id)
          .single();

        if (errorMaestro) {
          setError('No se encontró información del maestro');
          return;
        }

        // Obtener grupos asignados al maestro
        const { data: asignaciones, error: errorAsignaciones } = await supabase
          .from('asignaciones')
          .select(`
            id,
            grupo_id,
            grupos:grupo_id(id, nombre)
          `)
          .eq('maestro_id', maestro.id);

        if (errorAsignaciones) {
          setError('Error al cargar grupos asignados');
          return;
        }

        // Extraer grupos únicos
        const gruposUnicos = [];
        const gruposIds = new Set();
        
        asignaciones.forEach(asignacion => {
          if (asignacion.grupos && !gruposIds.has(asignacion.grupos.id)) {
            gruposIds.add(asignacion.grupos.id);
            gruposUnicos.push({
              id: asignacion.grupos.id,
              nombre: asignacion.grupos.nombre
            });
          }
        });
        
        setGrupos(gruposUnicos);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar datos: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    obtenerDatos();
  }, []);

  // Cargar alumnos cuando se selecciona un grupo
  useEffect(() => {
    const cargarAlumnos = async () => {
      if (!grupoSeleccionado) {
        setAlumnos([]);
        return;
      }

      try {
        // Obtener alumnos del grupo seleccionado
        const { data, error } = await supabase
          .from('alumnos')
          .select(`
            id, 
            usuarios:usuario_id (id, nombre, email)
          `)
          .eq('grupo_id', grupoSeleccionado);

        if (error) {
          console.error('Error al cargar alumnos:', error);
          return;
        }

        // Formatear datos de alumnos
        const alumnosFormateados = data.map(alumno => ({
          id: alumno.id,
          nombre: alumno.usuarios?.nombre || 'Sin nombre',
          email: alumno.usuarios?.email || 'Sin email',
          usuarioId: alumno.usuarios?.id
        }));

        setAlumnos(alumnosFormateados);
      } catch (error) {
        console.error('Error al cargar alumnos:', error);
      }
    };

    cargarAlumnos();
  }, [grupoSeleccionado]);

  // Función para agregar un nuevo alumno
  const handleSaveAlumno = async (nuevoAlumno) => {
    try {
      // Obtener el usuario actual (maestro)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
      }
  
      // Llamar al endpoint API
      const response = await fetch('/api/alumnos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nuevoAlumno.nombre,
          grupoId: grupoSeleccionado,
          maestroId: user.id
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        setMensajeError(result.error || 'Error al crear alumno');
        setTimeout(() => setMensajeError(''), 3000);
        return { success: false, error: result.error };
      }
  
      // Mostrar mensaje de éxito
      setMensajeExito(result.message || 'Alumno agregado correctamente');
      setTimeout(() => setMensajeExito(''), 3000);
      
      // Recargar la lista de alumnos
      const { data, error } = await supabase
        .from('alumnos')
        .select(`
          id, 
          usuarios:usuario_id (id, nombre, email)
        `)
        .eq('grupo_id', grupoSeleccionado);

      if (!error && data) {
        const alumnosFormateados = data.map(alumno => ({
          id: alumno.id,
          nombre: alumno.usuarios?.nombre || 'Sin nombre',
          email: alumno.usuarios?.email || 'Sin email',
          usuarioId: alumno.usuarios?.id
        }));

        setAlumnos(alumnosFormateados);
      }
      
      // Cerrar el modal
      setShowModalAlumno(false);
  
      return { success: true };
    } catch (error) {
      console.error('Error al crear alumno:', error);
      setMensajeError('Error: ' + error.message);
      setTimeout(() => setMensajeError(''), 3000);
      return { success: false, error: error.message };
    }
  };

  return (
    <LayoutMaestro>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Mis Grupos</h1>
        <p className="text-gray-600 dark:text-gray-400">Gestiona los alumnos de tus grupos asignados</p>
      </div>

      {/* Mensajes de éxito o error */}
      {mensajeExito && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg animate-fadeIn">
          {mensajeExito}
        </div>
      )}
      {mensajeError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg animate-fadeIn">
          {mensajeError}
        </div>
      )}

      {/* Selector de grupos */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecciona un grupo:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : grupos.length > 0 ? (
            grupos.map(grupo => (
              <div 
                key={grupo.id}
                onClick={() => setGrupoSeleccionado(grupo.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${grupoSeleccionado === grupo.id ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-700 dark:text-indigo-300">
                    <HiUserGroup size={20} />
                  </div>
                  <span className="font-medium">{grupo.nombre}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No tienes grupos asignados</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de alumnos */}
      {grupoSeleccionado && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <HiOutlineAcademicCap className="text-indigo-600 dark:text-indigo-400" />
              Alumnos del grupo
            </h2>
            <button
              onClick={() => setShowModalAlumno(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <HiOutlinePlus />
              Agregar Alumno
            </button>
          </div>

          {alumnos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {alumnos.map(alumno => (
                    <tr key={alumno.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full text-purple-700 dark:text-purple-300">
                            <FaUserGraduate size={16} />
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{alumno.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">{alumno.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <FaUserGraduate size={32} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No hay alumnos en este grupo</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Haz clic en Agregar Alumno para comenzar</p>
            </div>
          )}
        </div>
      )}

      {/* Modal para agregar alumno */}
      <ModalAlumno 
        visible={showModalAlumno} 
        onClose={() => setShowModalAlumno(false)} 
        onSave={handleSaveAlumno} 
        grupoId={grupoSeleccionado} 
      />
    </LayoutMaestro>
  );
}