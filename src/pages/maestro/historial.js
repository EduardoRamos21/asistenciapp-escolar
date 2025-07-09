import LayoutMaestro from '@/components/LayoutMaestro';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FiCalendar, FiUser, FiBook, FiCheck, FiX } from 'react-icons/fi';
import useAsistencias from '@/hooks/useAsistencias';

export default function HistorialAsistencias() {
  const [usuario, setUsuario] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { grupos, materias, grupoSeleccionado, materiaSeleccionada, setGrupoSeleccionado, setMateriaSeleccionada } = useAsistencias();
  const [filtroFecha, setFiltroFecha] = useState('');
  
  // Obtener información del usuario
  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('nombre, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUsuario({
            id: user.id,
            nombre: data.nombre,
            avatar_url: data.avatar_url
          });
        }
      }
    };

    obtenerUsuario();
  }, []);

  // Cargar historial de asistencias cuando se selecciona grupo y materia
  useEffect(() => {
    const cargarHistorial = async () => {
      if (!grupoSeleccionado || !materiaSeleccionada) {
        setHistorial([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Construir la consulta base
        let query = supabase
          .from('asistencias')
          .select(`
            id,
            fecha,
            hora,
            presente,
            alumnos:alumno_id(id, usuarios:usuario_id(nombre))
          `)
          .eq('materia_id', materiaSeleccionada)
          .order('fecha', { ascending: false });

        // Aplicar filtro de fecha si existe
        if (filtroFecha) {
          query = query.eq('fecha', filtroFecha);
        }

        const { data, error: errorHistorial } = await query;

        if (errorHistorial) {
          setError('Error al cargar historial: ' + errorHistorial.message);
          return;
        }

        // Formatear datos para mostrar
        const historialFormateado = data.map(asistencia => ({
          id: asistencia.id,
          fecha: new Date(asistencia.fecha).toLocaleDateString('es-MX'),
          hora: asistencia.hora ? asistencia.hora.substring(0, 5) : '00:00',
          alumnoId: asistencia.alumnos?.id,
          alumnoNombre: asistencia.alumnos?.usuarios?.nombre || 'Sin nombre',
          presente: asistencia.presente
        }));

        setHistorial(historialFormateado);
      } catch (error) {
        setError('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarHistorial();
  }, [grupoSeleccionado, materiaSeleccionada, filtroFecha]);

  return (
    <LayoutMaestro>
      {/* Encabezado con gradiente */}
      <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Historial de Asistencias
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

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
          <FiX className="inline mr-2" /> {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2">Filtros</h3>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grupo</label>
            <select 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={grupoSeleccionado || ''}
              onChange={(e) => setGrupoSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
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
              disabled={!grupoSeleccionado}
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
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla de historial */}
        {grupoSeleccionado && materiaSeleccionada ? (
          loading ? (
            <div className="text-center py-10">
              <div className="inline-block p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <svg className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <FiCalendar className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No hay registros de asistencia para los filtros seleccionados</p>
            </div>
          ) : (
            <div className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alumno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                  {historial.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{registro.alumnoNombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700 dark:text-gray-300">{registro.fecha}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700 dark:text-gray-300">{registro.hora}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${registro.presente ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                          {registro.presente ? (
                            <><FiCheck className="mr-1" /> Presente</>
                          ) : (
                            <><FiX className="mr-1" /> Ausente</>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-8 rounded-lg text-center">
            <p>Selecciona un grupo y una materia para ver el historial de asistencias</p>
          </div>
        )}
      </div>
    </LayoutMaestro>
  );
}