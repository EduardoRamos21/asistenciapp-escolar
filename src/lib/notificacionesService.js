import { supabase } from '@/lib/supabase';
// Función para enviar una notificación a través de la API
const enviarNotificacion = async (titulo, cuerpo, datos = {}, opciones = {}) => {
  try {
    // Determinar si estamos en el cliente o en el servidor
    const isServer = typeof window === 'undefined';
    
    // Construir la URL base según el entorno
    const baseUrl = isServer 
      ? process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` // URL de producción en Vercel
        : 'http://localhost:3000' // URL para desarrollo local
      : ''; // URL relativa para el cliente
    
    const response = await fetch(`${baseUrl}/api/enviar-notificacion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        titulo,
        cuerpo,
        datos,
        ...opciones
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return { success: false, error: error.message };
  }
};

// Notificación para padres cuando hay una nueva calificación
export const notificarNuevaCalificacion = async (padreId, alumnoId, nombreAlumno, materia, calificacion) => {
  return await enviarNotificacion(
    '📝 Nueva calificación',
    `${nombreAlumno} ha recibido una calificación de ${calificacion} en ${materia}.`,
    {
      tipo: 'calificacion',
      alumno_id: alumnoId,
      materia,
      calificacion,
      url: `/padre/hijo/${alumnoId}/tareas`
    },
    { userId: padreId }
  );
};

// Notificación para alumnos sobre tareas pendientes
export const notificarTareaPendiente = async (alumnoId, tarea, materia, fechaEntrega) => {
  const fechaFormateada = new Date(fechaEntrega).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return await enviarNotificacion(
    '📚 Recordatorio de tarea',
    `Tienes pendiente la tarea "${tarea}" de ${materia} para el ${fechaFormateada}.`,
    {
      tipo: 'tarea_pendiente',
      tarea_id: tarea.id,
      materia,
      fecha_entrega: fechaEntrega,
      url: `/alumno/tareas`
    },
    { userId: alumnoId }
  );
};

// Notificación para maestros antes de una clase
export const notificarClaseProxima = async (maestroId, materia, grupo, horario) => {
  return await enviarNotificacion(
    '🕒 Clase próxima',
    `Tienes clase de ${materia} con el grupo ${grupo} en ${horario}.`,
    {
      tipo: 'clase_proxima',
      materia,
      grupo,
      horario,
      url: `/maestro`
    },
    { userId: maestroId }
  );
};

// Notificación para directores sobre baja asistencia
export const notificarAsistenciaBaja = async (directorId, grupo, porcentaje) => {
  return await enviarNotificacion(
    '⚠️ Alerta de asistencia',
    `El grupo ${grupo} tiene una asistencia del ${porcentaje}%, por debajo del umbral establecido.`,
    {
      tipo: 'asistencia_baja',
      grupo,
      porcentaje,
      url: `/director/grupos`
    },
    { userId: directorId }
  );
};

// Notificación general para anuncios escolares
export const enviarAnuncioEscolar = async (titulo, mensaje, url = '/', rol = '') => {
  return await enviarNotificacion(
    `📢 ${titulo}`,
    mensaje,
    {
      tipo: 'anuncio',
      url
    },
    { rol } // Pasar el rol como parte de las opciones
  );
};

// Notificación de emergencia para todos los usuarios
export const enviarAlertaEmergencia = async (titulo, mensaje, rol = '') => {
  return await enviarNotificacion(
    `🚨 EMERGENCIA: ${titulo}`,
    mensaje,
    {
      tipo: 'emergencia',
      url: '/'
    },
    { rol } // Pasar el rol como parte de las opciones
  );
};

// Notificación de recordatorio de vacaciones/días festivos
export const enviarRecordatorioFestivo = async (titulo, mensaje, fecha, rol = '') => {
  return await enviarNotificacion(
    `🎉 ${titulo}`,
    mensaje,
    {
      tipo: 'festivo',
      fecha,
      url: '/'
    },
    { rol } // Pasar el rol como parte de las opciones
  );
};

// Notificación de mantenimiento programado
export const enviarNotificacionMantenimiento = async (titulo, mensaje, fechaInicio, fechaFin, rol = '') => {
  return await enviarNotificacion(
    `🔧 ${titulo}`,
    mensaje,
    {
      tipo: 'mantenimiento',
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      url: '/'
    },
    { rol } // Pasar el rol como parte de las opciones
  );
};


// Notificación para alumnos sobre nuevas tareas asignadas
export const notificarNuevaTarea = async (alumnoId, tarea, materia, fechaEntrega) => {
  const fechaFormateada = new Date(fechaEntrega).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Obtener el usuario_id correspondiente al alumno_id
  const { data: alumno } = await supabase
    .from('alumnos')
    .select('usuario_id')
    .eq('id', alumnoId)
    .single();

  if (!alumno || !alumno.usuario_id) {
    console.error(`No se pudo encontrar el usuario_id para el alumno ${alumnoId}`);
    return { error: 'No se pudo encontrar el usuario para enviar la notificación' };
  }

  return await enviarNotificacion(
    '📚 Nueva tarea asignada',
    `Se te ha asignado una nueva tarea: "${tarea.titulo}" de ${materia} para entregar el ${fechaFormateada}.`,
    {
      tipo: 'nueva_tarea',
      tarea_id: tarea.id,
      materia,
      fecha_entrega: fechaEntrega,
      url: `/alumno/tareas`
    },
    { userId: alumno.usuario_id }
  );
};