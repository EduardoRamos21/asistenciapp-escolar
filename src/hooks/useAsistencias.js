import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function useAsistencias() {
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [asistencias, setAsistencias] = useState({});
  const [asignaciones, setAsignaciones] = useState([]);

  // Cargar asignaciones del maestro
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Usuario no autenticado');
          return;
        }
        console.log('Usuario autenticado:', user.id);

        // Obtener el ID del maestro
        const { data: maestro, error: errorMaestro } = await supabase
          .from('maestros')
          .select('id')
          .eq('usuario_id', user.id)
          .single();

        if (errorMaestro) {
          console.error('Error al obtener maestro:', errorMaestro.message);
          setError('No se encontró información del maestro');
          return;
        }
        console.log('ID del maestro:', maestro.id);

        // Modificar la consulta para obtener directamente las materias
        // Primero, verificar si hay asignaciones sin filtrar por maestro
        const { data: todasAsignaciones } = await supabase
          .from('asignaciones')
          .select('id, maestro_id')
          .limit(10);
        
        console.log('Muestra de asignaciones en la BD:', todasAsignaciones);
        
        // Luego intentar la consulta original pero con el ID como string para ver si hay diferencia
        const { data: asignacionesData, error: errorAsignaciones } = await supabase
          .from('asignaciones')
          .select(`
            id,
            grupo_id,
            materia_id,
            horario,
            grupos:grupo_id(id, nombre),
            materias:materia_id(id, nombre)
          `)
          .eq('maestro_id', maestro.id);

        if (errorAsignaciones) {
          console.error('Error al cargar asignaciones:', errorAsignaciones.message);
          setError('Error al cargar asignaciones');
          return;
        }

        console.log('Asignaciones cargadas:', asignacionesData);
        setAsignaciones(asignacionesData || []);

        // Extraer grupos únicos de las asignaciones
        const gruposUnicos = [];
        const gruposIds = new Set();
        
        asignacionesData.forEach(asignacion => {
          if (asignacion.grupos && !gruposIds.has(asignacion.grupos.id)) {
            gruposIds.add(asignacion.grupos.id);
            gruposUnicos.push({
              id: asignacion.grupos.id,
              nombre: asignacion.grupos.nombre
            });
          }
        });
        
        console.log('Grupos extraídos:', gruposUnicos);
        setGrupos(gruposUnicos);

        // Después de obtener asignacionesData y antes de extraer materias
        console.log('Datos completos de asignaciones:', JSON.stringify(asignacionesData));

        // Extraer los IDs de materias de las asignaciones
        const materiaIds = asignacionesData
          .map(asignacion => asignacion.materia_id)
          .filter(id => id !== null);

        console.log('IDs de materias encontrados:', materiaIds);

        if (materiaIds.length > 0) {
          // Obtener las materias directamente
          const { data: materiasDirectas, error: errorMaterias } = await supabase
            .from('materias')
            .select('id, nombre')
            .in('id', materiaIds);
          
          console.log('Materias obtenidas directamente:', materiasDirectas);
          
          if (!errorMaterias && materiasDirectas) {
            // Asociar cada materia con su grupo correspondiente
            const materiasConGrupo = materiasDirectas.map(materia => {
              const asignacion = asignacionesData.find(a => a.materia_id === materia.id);
              return {
                id: materia.id,
                nombre: materia.nombre,
                grupo_id: asignacion ? asignacion.grupo_id : null
              };
            });
            
            console.log('Materias formateadas con grupo:', materiasConGrupo);
            setMaterias(materiasConGrupo);
          } else {
            console.error('Error al obtener materias directamente:', errorMaterias);
          }
        } else {
          console.warn('No se encontraron IDs de materias en las asignaciones');
        }

        // Extraer materias y verificar que existan datos
        const materiasData = [];
        asignacionesData.forEach(asignacion => {
          if (asignacion.materias && asignacion.materias.id) {
            materiasData.push({
              id: asignacion.materias.id,
              nombre: asignacion.materias.nombre,
              grupo_id: asignacion.grupo_id
            });
          } else {
            console.warn('Asignación sin materia válida:', asignacion);
          }
        });
        
        console.log('Materias extraídas:', materiasData);
        setMaterias(materiasData);
      } catch (error) {
        console.error('Error general:', error.message);
        setError('Error al cargar datos: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Cargar alumnos cuando se selecciona un grupo
  useEffect(() => {
    const cargarAlumnos = async () => {
      if (!grupoSeleccionado) {
        setAlumnos([]);
        return;
      }

      try {
        setLoading(true);

        // Obtener alumnos del grupo seleccionado con sus nombres
        const { data, error } = await supabase
          .from('alumnos')
          .select(`
            id, 
            usuarios:usuario_id (nombre)
          `)
          .eq('grupo_id', grupoSeleccionado);

        if (error) {
          setError('Error al cargar alumnos: ' + error.message);
          return;
        }

        // Formatear datos de alumnos
        const alumnosFormateados = data.map(alumno => ({
          id: alumno.id,
          nombre: alumno.usuarios?.nombre || 'Sin nombre',
        }));

        setAlumnos(alumnosFormateados);

        // Inicializar asistencias
        const asistenciasIniciales = {};
        alumnosFormateados.forEach(alumno => {
          asistenciasIniciales[alumno.id] = true; // Por defecto todos presentes
        });

        setAsistencias(asistenciasIniciales);
      } catch (error) {
        setError('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarAlumnos();
  }, [grupoSeleccionado]);

  // Cambiar estado de asistencia de un alumno
  const cambiarAsistencia = (alumnoId) => {
    setAsistencias(prev => ({
      ...prev,
      [alumnoId]: !prev[alumnoId]
    }));
  };

  // Guardar asistencias en la base de datos
  const guardarAsistencias = async () => {
    if (!materiaSeleccionada || !grupoSeleccionado) {
      return { success: false, error: 'Selecciona grupo y materia' };
    }
  
    try {
      const fecha = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      const horaActual = new Date().toTimeString().split(' ')[0]; // Formato HH:MM:SS
      
      // Preparar datos para insertar
      const asistenciasData = Object.entries(asistencias).map(([alumnoId, presente]) => ({
        alumno_id: parseInt(alumnoId),
        materia_id: parseInt(materiaSeleccionada),
        fecha,
        hora: horaActual,
        presente
      }));
  
      // Insertar asistencias
      const { error } = await supabase
        .from('asistencias')
        .upsert(asistenciasData, {
          onConflict: 'alumno_id,materia_id,fecha',
          ignoreDuplicates: false
        });
  
      if (error) {
        return { success: false, error: error.message };
      }
  
      // Obtener información de la materia para las notificaciones
      const { data: materiaInfo } = await supabase
        .from('materias')
        .select('nombre')
        .eq('id', materiaSeleccionada)
        .single();
  
      // Enviar notificaciones para alumnos ausentes
      const alumnosAusentes = Object.entries(asistencias)
        .filter(([_, presente]) => !presente)
        .map(([alumnoId]) => parseInt(alumnoId));
  
      if (alumnosAusentes.length > 0) {
        // Obtener información de los alumnos ausentes
        const { data: infoAlumnos } = await supabase
          .from('alumnos')
          .select(`
            id,
            usuarios:usuario_id (nombre)
          `)
          .in('id', alumnosAusentes);
  
        // Para cada alumno ausente, buscar sus padres y enviar notificación
        for (const alumno of infoAlumnos) {
          // Obtener los padres del alumno
          const { data: padresData, error: padresError } = await supabase
            .from('padre_alumno')
            .select(`
              padre_id
            `)
            .eq('alumno_id', alumno.id);

          if (padresError) {
            console.error('Error al obtener padres:', padresError);
            continue;
          }

          // Obtener información de contacto de los padres
          const padresIds = padresData.map(p => p.padre_id);
          
          const { data: infoPadres, error: infoPadresError } = await supabase
            .from('info_padres')
            .select('id, telefono, notificaciones_whatsapp')
            .in('id', padresIds);

          if (infoPadresError) {
            console.error('Error al obtener info de padres:', infoPadresError);
            continue;
          }

          // Filtrar padres que tienen notificaciones activadas y teléfono
          const padresNotificar = infoPadres
            .filter(p => p.notificaciones_whatsapp && p.telefono)
            .map(p => ({
              telefono: p.telefono,
              nombreAlumno: alumno.usuarios?.nombre || 'su hijo/a',
              nombreMateria: materiaInfo?.nombre || 'una materia'
            }));
          
          // Aquí enviaríamos las notificaciones WhatsApp
          if (padresNotificar.length > 0) {
            console.log('Generando enlaces WhatsApp para:', padresNotificar);
            
            // Enviar notificaciones a cada padre
            for (const padre of padresNotificar) {
              try {
                const response = await fetch('/api/enviar-whatsapp', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    telefono: padre.telefono,
                    mensaje: `Su hijo/a ${padre.nombreAlumno} ha sido marcado como ausente en ${padre.nombreMateria} el día ${fecha} a las ${horaActual.substring(0, 5)}`,
                  }),
                });
                
                const result = await response.json();
                console.log('Resultado de generación de enlace:', result);
                
                // Si se generó el enlace correctamente, abrirlo en una nueva ventana
                if (result.success && result.whatsappLink) {
                  window.open(result.whatsappLink, '_blank');
                }
              } catch (error) {
                console.error('Error al generar enlace WhatsApp:', error);
              }
            }
          }
        }
      }
  
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    grupos,
    materias,
    alumnos,
    loading,
    error,
    grupoSeleccionado,
    materiaSeleccionada,
    asistencias,
    asignaciones,
    setGrupoSeleccionado,
    setMateriaSeleccionada,
    cambiarAsistencia,
    guardarAsistencias
  };
}
