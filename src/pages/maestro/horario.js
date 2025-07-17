import LayoutMaestro from '@/components/LayoutMaestro';
import { useState, useEffect, useRef } from 'react'; // Agregar useRef
import { supabase } from '@/lib/supabase';
import { FiClock, FiCalendar, FiUser, FiBook, FiUsers } from 'react-icons/fi';
import { useMemo } from 'react';

export default function HorarioMaestro() {
  const [usuario, setUsuario] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeError, setMensajeError] = useState('');
  
  // Agregar useRef para evitar múltiples cargas
  const cargandoDatosRef = useRef(false);

  // Nombres de los días de la semana
  // Línea 17 - Usar useMemo para el array diasSemana
  const diasSemana = useMemo(() => [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ], []);

  // Obtener información del usuario y sus horarios
  useEffect(() => {
    const obtenerDatos = async () => {
      if (cargandoDatosRef.current) return;
      cargandoDatosRef.current = true;
      
      try {
        setLoading(true);
        setError(null);

        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Usuario no autenticado');
          return;
        }

        // Obtener información del usuario
        const { data: userData } = await supabase
          .from('usuarios')
          .select('nombre, avatar_url')
          .eq('id', user.id)
          .single();

        setUsuario({
          id: user.id,
          nombre: userData?.nombre || 'Usuario',
          avatar_url: userData?.avatar_url
        });

        // Obtener el ID del maestro
        const { data: maestroData } = await supabase
          .from('maestros')
          .select('id')
          .eq('usuario_id', user.id)
          .single();

        if (!maestroData) {
          setError('No se encontró información del maestro');
          return;
        }

        // Obtener asignaciones del maestro
        const { data: asignacionesData, error: asignacionesError } = await supabase
          .from('asignaciones')
          .select(`
            id, 
            horario,
            materias(id, nombre),
            grupos(id, nombre)
          `)
          .eq('maestro_id', maestroData.id);

        if (asignacionesError) {
          setError('Error al cargar horarios: ' + asignacionesError.message);
          return;
        }

        // Formatear datos de horarios
        const horariosFormateados = [];

        asignacionesData.forEach(asignacion => {
          // Asumiendo que el horario tiene formato "día:hora"
          // Por ejemplo: "1:09:00" para Lunes a las 9:00
          if (asignacion.horario) {
            // Extraer día y hora del formato del horario
            // Esto es un ejemplo, ajusta según el formato real de tu campo horario
            const partes = asignacion.horario.split(':');
            let dia, hora;
            
            if (partes.length >= 2) {
              // Si el formato es "día:hora" o "día:hora:minutos"
              dia = parseInt(partes[0]);
              hora = partes[1].padStart(2, '0') + ':' + (partes[2] || '00');
            } else {
              // Si el formato es solo la hora (asumiendo que es para todos los días)
              dia = new Date().getDay(); // Día actual como fallback
              hora = partes[0];
            }
            
            horariosFormateados.push({
              id: asignacion.id,
              dia: dia,
              diaNombre: diasSemana[dia],
              horaInicio: hora,
              horaFin: (parseInt(hora.split(':')[0]) + 1) + ':' + hora.split(':')[1], // Asumiendo clases de 1 hora
              materia: asignacion.materias?.nombre || 'Sin asignar',
              materiaId: asignacion.materias?.id,
              grupo: asignacion.grupos?.nombre || 'Sin asignar',
              grupoId: asignacion.grupos?.id,
              salon: 'Por asignar' // Puedes agregar este campo a asignaciones si lo necesitas
            });
          }
        });

        setHorarios(horariosFormateados);
      } catch (error) {
        setError('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    obtenerDatos();
  }, [diasSemana]); // Agregar 'diasSemana' a las dependencias

  // Agrupar horarios por día
  const horariosPorDia = {};
  diasSemana.forEach((dia, index) => {
    horariosPorDia[index] = horarios.filter(horario => horario.dia === index);
  });

  return (
    <LayoutMaestro>
      {/* Encabezado con gradiente */}
      <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Mi Horario de Clases
          </h2>
        </div>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md dark:bg-red-900/30 dark:text-red-400">
          <p>{error}</p>
        </div>
      )}

      {/* Indicador de carga */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Horario por día */}
      {!loading && !error && (
        <div className="space-y-8">
          {/* Mostrar solo días con clases */}
          {Object.entries(horariosPorDia)
            .filter(([_, clases]) => clases.length > 0)
            .map(([diaIndex, clases]) => (
              <div key={diaIndex} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-3">
                  <h3 className="text-lg font-semibold">{diasSemana[diaIndex]}</h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {clases.length > 0 ? (
                    clases.map(clase => (
                      <div key={clase.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-lg">
                            <FiClock className="text-xl" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{clase.materia}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  <FiUsers className="text-gray-400" />
                                  <span>Grupo: {clase.grupo}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-800 dark:text-gray-200">
                                  {clase.horaInicio} - {clase.horaFin}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No hay clases programadas para este día
                    </div>
                  )}
                </div>
              </div>
            ))}

          {/* Mensaje si no hay clases en ningún día */}
          {Object.values(horariosPorDia).every(clases => clases.length === 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
              <FiBook className="text-5xl text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No hay horarios asignados</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Actualmente no tienes clases programadas en tu horario.
              </p>
            </div>
          )}
        </div>
      )}
    </LayoutMaestro>
  );
}