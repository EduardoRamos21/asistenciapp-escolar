import Layout from '@/components/Layout';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import useAsistencias from '@/hooks/useAsistencias';
import { supabase } from '@/lib/supabase';

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
    <Layout>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
        </h2>
        {usuario && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold">{usuario.nombre}</p>
              <p className="text-sm text-gray-500">Profesor</p>
            </div>
            <Image src="/perfil.jpg" alt="perfil" width={40} height={40} className="rounded-full" />
          </div>
        )}
      </div>

      {mensajeExito && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {mensajeExito}
        </div>
      )}

      {mensajeError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {mensajeError}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Registro de Asistencia</h3>
        
        {/* Selección de grupo y materia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
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
          <div>
            <h4 className="font-medium mb-2">Lista de Alumnos</h4>
            
            {alumnos.length === 0 ? (
              <p className="text-gray-500">No hay alumnos en este grupo</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asistencia</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {alumnos.map((alumno) => (
                      <tr key={alumno.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{alumno.nombre}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => cambiarAsistencia(alumno.id)}
                            className={`px-4 py-2 rounded-md ${asistencias[alumno.id] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {asistencias[alumno.id] ? 'Presente' : 'Ausente'}
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
                className="bg-[#282424] text-white px-4 py-2 rounded-md hover:bg-[#3b3939] disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar Asistencia'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Selecciona un grupo y una materia para ver la lista de alumnos</p>
        )}
      </div>
    </Layout>
  );
}
