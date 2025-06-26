import LayoutMaestro from '@/components/LayoutMaestro';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import useAsistencias from '@/hooks/useAsistencias';
import { supabase } from '@/lib/supabase';
import { FiCheck, FiX, FiUser, FiCalendar } from 'react-icons/fi';

export default function Asistencia() {
  const {
    grupos,
    materias,
    alumnos,
    loading,
    error,
    grupoSeleccionado,
    materiaSeleccionada,
    asistencias,
    setGrupoSeleccionado,
    setMateriaSeleccionada,
    cambiarAsistencia,
    guardarAsistencias
  } = useAsistencias();

  // Agregar log para verificar los datos
  useEffect(() => {
    console.log('Grupos disponibles:', grupos);
    console.log('Materias disponibles:', materias);
  }, [grupos, materias]);

  const [usuario, setUsuario] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Obtener información del usuario
  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUsuario({
            id: user.id,
            nombre: data.nombre,
            email: user.email
          });
        }
      }
    };

    obtenerUsuario();
  }, []);

  const handleEnviarAsistencia = async () => {
    if (!grupoSeleccionado || !materiaSeleccionada) {
      setMensajeError('Debes seleccionar un grupo y una materia');
      return;
    }

    setGuardando(true);
    setMensajeError('');
    setMensajeExito('');

    try {
      const resultado = await guardarAsistencias();
      
      if (resultado.success) {
        setMensajeExito('Asistencia guardada correctamente');
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => setMensajeExito(''), 3000);
      } else {
        setMensajeError(resultado.error || 'Error al guardar asistencia');
      }
    } catch (error) {
      setMensajeError('Error al guardar asistencia: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <LayoutMaestro>
      {/* Encabezado con gradiente */}
      <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
          </h2>
        </div>
        {usuario && (
          <div className="flex items-center gap-3 bg-indigo-600/10 dark:bg-indigo-400/10 px-3 py-2 rounded-lg">
            <div className="text-right">
              <p className="font-semibold text-gray-800 dark:text-gray-200">{usuario.nombre}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Profesor</p>
            </div>
            <div className="bg-indigo-100 dark:bg-indigo-800 p-1 rounded-full">
              <FiUser className="text-indigo-600 dark:text-indigo-300 text-xl" />
            </div>
          </div>
        )}
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
          Error: {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700 animate-fade-in">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2">Registro de Asistencia</h3>
        
        {/* Selección de grupo y materia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grupo</label>
            <select 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={grupoSeleccionado || ''}
              onChange={(e) => setGrupoSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
              disabled={loading || grupos.length === 0}
            >
              <option value="">Selecciona un grupo</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Materia</label>
            <select 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={materiaSeleccionada || ''}
              onChange={(e) => setMateriaSeleccionada(e.target.value ? parseInt(e.target.value) : null)}
              disabled={loading || materias.length === 0}
            >
              <option value="">Selecciona una materia</option>
              {materias
                .filter(materia => !grupoSeleccionado || materia.grupo_id === parseInt(grupoSeleccionado))
                .map((materia) => (
                  <option key={materia.id} value={materia.id}>
                    {materia.nombre}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Lista de alumnos */}
        {grupoSeleccionado && materiaSeleccionada ? (
          <div className="animate-fade-in">
            <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FiUser className="text-blue-600 dark:text-blue-400" />
              Lista de Alumnos
            </h4>
            
            {alumnos.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">No hay alumnos en este grupo</p>
            ) : (
              <div className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alumno</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asistencia</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {alumnos.map((alumno) => (
                      <tr key={alumno.id} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{alumno.nombre}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => cambiarAsistencia(alumno.id)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${asistencias[alumno.id] 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50'}`}
                          >
                            {asistencias[alumno.id] 
                              ? <><FiCheck className="text-green-600 dark:text-green-400" /> Presente</> 
                              : <><FiX className="text-red-600 dark:text-red-400" /> Ausente</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Botón guardar */}
            <div className="mt-6 text-right">
              <button
                onClick={handleEnviarAsistencia}
                disabled={guardando || alumnos.length === 0}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200 flex items-center gap-2 ml-auto"
              >
                <FiCheck className="text-white" />
                {guardando ? 'Guardando...' : 'Guardar Asistencia'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-8 rounded-lg text-center">
            <p>Selecciona un grupo y una materia para ver la lista de alumnos</p>
          </div>
        )}
      </div>
    </LayoutMaestro>
  );
}