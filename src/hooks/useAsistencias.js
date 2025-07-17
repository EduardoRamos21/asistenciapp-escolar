import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useAsistencias() {
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [asistencias, setAsistencias] = useState({});
  const [asignaciones, setAsignaciones] = useState([]);
  
  // Usar useRef para evitar múltiples cargas
  const cargandoDatosRef = useRef(false);
  const datosInicializadosRef = useRef(false);
  const usuarioIdRef = useRef(null);

  const cargarDatos = useCallback(async () => {
    if (cargandoDatosRef.current || datosInicializadosRef.current) return;
    cargandoDatosRef.current = true;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || usuarioIdRef.current === user.id) return;
      
      usuarioIdRef.current = user.id;
      console.log('Cargando datos para usuario:', user.id);
      
      // Primero obtener el maestro_id desde la tabla maestros
      const { data: maestroData, error: maestroError } = await supabase
        .from('maestros')
        .select('id')
        .eq('usuario_id', user.id)
        .single();

      if (maestroError) {
        console.error('Error obteniendo datos del maestro:', maestroError);
        throw new Error('No se encontraron datos del maestro');
      }

      console.log('Maestro encontrado:', maestroData);

      // Ahora usar el ID numérico del maestro para obtener asignaciones
      const { data: asignacionesData, error } = await supabase
        .from('asignaciones')
        .select(`
          id,
          grupo_id,
          materia_id,
          grupos!inner(id, nombre, grado),
          materias!inner(id, nombre)
        `)
        .eq('maestro_id', maestroData.id);

      if (error) throw error;
      
      console.log('Asignaciones obtenidas:', asignacionesData);
      
      // Procesar datos una sola vez
      const gruposUnicos = new Map();
      const materiasData = [];
      
      asignacionesData?.forEach(asignacion => {
        const grupo = asignacion.grupos;
        const materia = asignacion.materias;
        
        if (!gruposUnicos.has(grupo.id)) {
          gruposUnicos.set(grupo.id, {
            ...grupo,
            materias: []
          });
        }
        
        gruposUnicos.get(grupo.id).materias.push(materia);
        materiasData.push({
          ...materia,
          grupo_id: asignacion.grupo_id
        });
      });
      
      const gruposArray = Array.from(gruposUnicos.values());
      
      console.log('Grupos procesados:', gruposArray);
      console.log('Materias procesadas:', materiasData);
      
      setGrupos(gruposArray);
      setMaterias(materiasData);
      setAsignaciones(asignacionesData);
      datosInicializadosRef.current = true;
      
      console.log('Datos cargados exitosamente');
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error.message);
    } finally {
      cargandoDatosRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cargar alumnos cuando se selecciona un grupo (optimizado)
  const cargarAlumnos = useCallback(async (grupoId) => {
    if (!grupoId) {
      setAlumnos([]);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('alumnos')
        .select(`
          id, 
          usuarios:usuario_id (nombre)
        `)
        .eq('grupo_id', grupoId);

      if (error) {
        setError('Error al cargar alumnos: ' + error.message);
        return;
      }

      // Procesar datos de alumnos
      const alumnosFormateados = data?.map(alumno => ({
        id: alumno.id,
        nombre: alumno.usuarios?.nombre || 'Sin nombre'
      })) || [];

      setAlumnos(alumnosFormateados);
      
      // Inicializar asistencias como ausente para todos los alumnos
      const asistenciasIniciales = {};
      alumnosFormateados.forEach(alumno => {
        asistenciasIniciales[alumno.id] = false; // false = ausente
      });
      setAsistencias(asistenciasIniciales);
      
    } catch (error) {
      console.error('Error cargando alumnos:', error);
      setError('Error al cargar alumnos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto para cargar alumnos cuando cambia el grupo seleccionado
  useEffect(() => {
    if (grupoSeleccionado) {
      cargarAlumnos(grupoSeleccionado);
    } else {
      setAlumnos([]);
      setAsistencias({});
    }
  }, [grupoSeleccionado, cargarAlumnos]);

  // Función para cambiar asistencia de un alumno
  const cambiarAsistencia = useCallback((alumnoId) => {
    setAsistencias(prev => ({
      ...prev,
      [alumnoId]: !prev[alumnoId]
    }));
  }, []);

  // Función para enviar notificaciones de ausencias por WhatsApp
  const enviarNotificacionesAusencias = useCallback(async () => {
    try {
      // Obtener alumnos ausentes
      const alumnosAusentes = Object.entries(asistencias)
        .filter(([alumnoId, presente]) => !presente)
        .map(([alumnoId]) => parseInt(alumnoId));

      if (alumnosAusentes.length === 0) return;

      // Obtener información de los alumnos ausentes y sus padres
      const { data: alumnosConPadres, error } = await supabase
        .from('alumnos')
        .select(`
          id,
          usuario_id,
          usuarios!inner(nombre),
          padre_alumno!inner(
            padre_id,
            usuarios!padre_alumno_padre_id_fkey!inner(
              nombre,
              telefono,
              notificaciones_whatsapp
            )
          )
        `)
        .in('id', alumnosAusentes);

      if (error) {
        console.error('Error obteniendo datos de padres:', error);
        return;
      }

      // Obtener información de la materia
      const { data: materia } = await supabase
        .from('materias')
        .select('nombre')
        .eq('id', materiaSeleccionada)
        .single();

      const nombreMateria = materia?.nombre || 'la materia';
      const fechaHoy = new Date().toLocaleDateString('es-ES');

      // Enviar notificaciones WhatsApp
      for (const alumno of alumnosConPadres) {
        const padre = alumno.padre_alumno[0]?.usuarios;
        
        if (padre && padre.telefono && padre.notificaciones_whatsapp) {
          const mensaje = `🚨 AUSENCIA ESCOLAR\n\n` +
            `Su hijo/a ${alumno.usuarios.nombre} no asistió a la clase de ${nombreMateria} el día ${fechaHoy}.\n\n` +
            `Si tiene alguna consulta, por favor contacte a la escuela.\n\n` +
            `AsistenciApp Escolar`;

          // Enviar notificación WhatsApp
          try {
            const response = await fetch('/api/enviar-whatsapp', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                telefono: padre.telefono,
                mensaje: mensaje
              })
            });

            const result = await response.json();
            if (result.success && result.whatsappLink) {
              // Abrir WhatsApp Web con el mensaje
              window.open(result.whatsappLink, '_blank');
              console.log(`Notificación WhatsApp enviada al padre de ${alumno.usuarios.nombre}`);
            }
          } catch (error) {
            console.error(`Error enviando WhatsApp al padre de ${alumno.usuarios.nombre}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error enviando notificaciones de ausencias:', error);
    }
  }, [asistencias, materiaSeleccionada]);

  // Función para guardar asistencias
  // Guardar asistencias en la base de datos
  const guardarAsistencias = async () => {
    if (!materiaSeleccionada) {
      return { success: false, error: 'Selecciona una materia' };
    }

    try {
      const ahora = new Date();
      const fecha = ahora.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Formatear hora local manualmente para evitar problemas de zona horaria
      const horas = ahora.getHours().toString().padStart(2, '0');
      const minutos = ahora.getMinutes().toString().padStart(2, '0');
      const segundos = ahora.getSeconds().toString().padStart(2, '0');
      const horaActual = `${horas}:${minutos}:${segundos}`;
      
      // Preparar datos para insertar
      const asistenciasParaGuardar = Object.entries(asistencias).map(([alumnoId, presente]) => ({
        alumno_id: parseInt(alumnoId),
        materia_id: parseInt(materiaSeleccionada),
        fecha,
        hora: horaActual,
        presente
      }));

      // Insertar asistencias
      const { error } = await supabase
        .from('asistencias')
        .upsert(asistenciasParaGuardar, {
          onConflict: 'alumno_id,fecha,materia_id',
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

          // Obtener información de contacto de los padres desde la tabla info_padres
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
          
          // Enviar notificaciones WhatsApp
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
                    mensaje: `🚨 AUSENCIA ESCOLAR\n\nSu hijo/a ${padre.nombreAlumno} ha sido marcado como ausente en ${padre.nombreMateria} el día ${new Date().toLocaleDateString('es-ES')} a las ${horaActual.substring(0, 5)}.\n\nSi tiene alguna consulta, por favor contacte a la escuela.\n\nAsistenciApp Escolar`,
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
    setGrupoSeleccionado,
    setMateriaSeleccionada,
    cambiarAsistencia,
    guardarAsistencias
  };
}