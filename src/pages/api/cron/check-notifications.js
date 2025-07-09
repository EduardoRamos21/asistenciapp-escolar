import { createClient } from '@supabase/supabase-js';
import { 
  notificarNuevaCalificacion,
  notificarTareaPendiente,
  notificarClaseProxima,
  notificarAsistenciaBaja,
  enviarAnuncioEscolar,
  enviarAlertaEmergencia,
  enviarRecordatorioFestivo,
  enviarNotificacionMantenimiento
} from '@/lib/notificacionesService';

// Inicializar cliente de Supabase con la clave de servicio
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Función para verificar y enviar notificaciones de calificaciones a padres
async function checkNuevasCalificaciones() {
  // Obtener calificaciones nuevas (últimas 24 horas)
  const { data: nuevasCalificaciones, error } = await supabaseAdmin
    .from('calificaciones')
    .select('id, valor, alumno_id, materia_id, created_at, notificada')
    .eq('notificada', false)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Error al obtener nuevas calificaciones:', error);
    return;
  }

  // Procesar cada calificación
  for (const calificacion of nuevasCalificaciones) {
    // Obtener información del alumno
    const { data: alumno } = await supabaseAdmin
      .from('alumnos')
      .select('id, nombre, apellido, padre_id')
      .eq('id', calificacion.alumno_id)
      .single();

    if (!alumno || !alumno.padre_id) continue;

    // Obtener información de la materia
    const { data: materia } = await supabaseAdmin
      .from('materias')
      .select('nombre')
      .eq('id', calificacion.materia_id)
      .single();

    if (!materia) continue;

    // Enviar notificación al padre
    await notificarNuevaCalificacion(
      alumno.padre_id,
      alumno.id,
      `${alumno.nombre} ${alumno.apellido}`,
      materia.nombre,
      calificacion.valor
    );

    // Marcar como notificada
    await supabaseAdmin
      .from('calificaciones')
      .update({ notificada: true })
      .eq('id', calificacion.id);
  }
}

// Función para verificar y enviar recordatorios de tareas a alumnos
async function checkTareasPendientes() {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(23, 59, 59, 999);
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Obtener tareas que vencen mañana y no han sido notificadas
  const { data: tareasPendientes, error } = await supabaseAdmin
    .from('tareas')
    .select('id, titulo, fecha_entrega, materia_id, recordatorio_enviado')
    .eq('recordatorio_enviado', false)
    .gte('fecha_entrega', hoy.toISOString())
    .lte('fecha_entrega', manana.toISOString());

  if (error) {
    console.error('Error al obtener tareas pendientes:', error);
    return;
  }

  // Procesar cada tarea
  for (const tarea of tareasPendientes) {
    // Obtener información de la materia
    const { data: materia } = await supabaseAdmin
      .from('materias')
      .select('nombre, grupo_id')
      .eq('id', tarea.materia_id)
      .single();

    if (!materia) continue;

    // Obtener alumnos del grupo
    const { data: alumnos } = await supabaseAdmin
      .from('alumnos')
      .select('id')
      .eq('grupo_id', materia.grupo_id);

    if (!alumnos || alumnos.length === 0) continue;

    // Enviar notificación a cada alumno
    for (const alumno of alumnos) {
      await notificarTareaPendiente(
        alumno.id,
        tarea,
        materia.nombre,
        tarea.fecha_entrega
      );
    }

    // Marcar tarea como notificada
    await supabaseAdmin
      .from('tareas')
      .update({ recordatorio_enviado: true })
      .eq('id', tarea.id);
  }
}

// Función para verificar y enviar recordatorios de clases a maestros
async function checkClasesProximas() {
  const ahora = new Date();
  const horaActual = ahora.getHours();
  const minutosActuales = ahora.getMinutes();
  const diaSemana = ahora.getDay(); // 0 = domingo, 1 = lunes, ...

  // Obtener horarios de clases que comienzan en la próxima hora
  const { data: clasesProximas, error } = await supabaseAdmin
    .from('horarios')
    .select('id, dia, hora_inicio, maestro_id, materia_id, grupo_id')
    .eq('dia', diaSemana)
    .gte('hora_inicio', `${horaActual + 1}:00`)
    .lt('hora_inicio', `${horaActual + 1}:59`);

  if (error) {
    console.error('Error al obtener clases próximas:', error);
    return;
  }

  // Procesar cada clase
  for (const clase of clasesProximas) {
    // Obtener información de la materia
    const { data: materia } = await supabaseAdmin
      .from('materias')
      .select('nombre')
      .eq('id', clase.materia_id)
      .single();

    // Obtener información del grupo
    const { data: grupo } = await supabaseAdmin
      .from('grupos')
      .select('nombre')
      .eq('id', clase.grupo_id)
      .single();

    if (!materia || !grupo) continue;

    // Enviar notificación al maestro
    await notificarClaseProxima(
      clase.maestro_id,
      materia.nombre,
      grupo.nombre,
      clase.hora_inicio
    );
  }
}

// Función para verificar y enviar alertas de asistencia baja a directores
async function checkAsistenciaBaja() {
  const hoy = new Date().toISOString().split('T')[0];
  const umbralAsistencia = 70; // Porcentaje mínimo de asistencia

  // Obtener asistencia por grupo para hoy
  const { data: asistenciasPorGrupo, error } = await supabaseAdmin
    .from('asistencias')
    .select('grupo_id, presente')
    .eq('fecha', hoy);

  if (error) {
    console.error('Error al obtener asistencias:', error);
    return;
  }

  // Calcular porcentaje de asistencia por grupo
  const gruposAsistencia = {};
  asistenciasPorGrupo.forEach(asistencia => {
    if (!gruposAsistencia[asistencia.grupo_id]) {
      gruposAsistencia[asistencia.grupo_id] = {
        total: 0,
        presentes: 0
      };
    }
    gruposAsistencia[asistencia.grupo_id].total++;
    if (asistencia.presente) {
      gruposAsistencia[asistencia.grupo_id].presentes++;
    }
  });

  // Obtener directores
  const { data: directores } = await supabaseAdmin
    .from('usuarios')
    .select('id')
    .eq('rol', 'director');

  if (!directores || directores.length === 0) return;

  // Verificar grupos con baja asistencia y notificar a directores
  for (const grupoId in gruposAsistencia) {
    const { total, presentes } = gruposAsistencia[grupoId];
    const porcentaje = (presentes / total) * 100;

    if (porcentaje < umbralAsistencia) {
      // Obtener información del grupo
      const { data: grupo } = await supabaseAdmin
        .from('grupos')
        .select('nombre')
        .eq('id', grupoId)
        .single();

      if (!grupo) continue;

      // Notificar a cada director
      for (const director of directores) {
        await notificarAsistenciaBaja(
          director.id,
          grupo.nombre,
          porcentaje.toFixed(1)
        );
      }
    }
  }
}

// Función para verificar y enviar recordatorios de días festivos
async function checkDiasFestivos() {
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  
  const fechaManana = manana.toISOString().split('T')[0];

  // Obtener días festivos para mañana
  const { data: festivos, error } = await supabaseAdmin
    .from('dias_festivos')
    .select('id, titulo, descripcion, fecha, notificado')
    .eq('fecha', fechaManana)
    .eq('notificado', false);

  if (error) {
    console.error('Error al obtener días festivos:', error);
    return;
  }

  // Enviar notificación para cada día festivo
  for (const festivo of festivos) {
    await enviarRecordatorioFestivo(
      festivo.titulo,
      festivo.descripcion,
      festivo.fecha
    );

    // Marcar como notificado
    await supabaseAdmin
      .from('dias_festivos')
      .update({ notificado: true })
      .eq('id', festivo.id);
  }
}

// Función para verificar y enviar notificaciones programadas
async function checkNotificacionesProgramadas() {
  const ahora = new Date();
  
  // Obtener notificaciones programadas que deben enviarse
  // (fecha_programada <= ahora y enviada = false)
  const { data: notificacionesProgramadas, error } = await supabaseAdmin
    .from('notificaciones_programadas')
    .select('*')
    .lte('fecha_programada', ahora.toISOString())
    .eq('enviada', false);

  if (error) {
    console.error('Error al obtener notificaciones programadas:', error);
    return;
  }

  console.log(`Procesando ${notificacionesProgramadas?.length || 0} notificaciones programadas`);

  // Procesar cada notificación programada
  for (const notificacion of notificacionesProgramadas || []) {
    try {
      // Determinar la función de envío según el tipo
      let resultado;
      
      // Enviar según el tipo y destinatario
      if (notificacion.tipo === 'anuncio') {
        resultado = await enviarNotificacion(
          `📢 ${notificacion.titulo}`,
          notificacion.mensaje,
          {
            tipo: 'anuncio',
            url: notificacion.url || '/'
          },
          { rol: notificacion.rol } // Pasar el rol en las opciones
        );
      } else if (notificacion.tipo === 'emergencia') {
        resultado = await enviarNotificacion(
          `🚨 EMERGENCIA: ${notificacion.titulo}`,
          notificacion.mensaje,
          {
            tipo: 'emergencia',
            url: notificacion.url || '/'
          },
          { rol: notificacion.rol }
        );
      } else if (notificacion.tipo === 'festivo') {
        resultado = await enviarNotificacion(
          `🎉 ${notificacion.titulo}`,
          notificacion.mensaje,
          {
            tipo: 'festivo',
            fecha: new Date(),
            url: notificacion.url || '/'
          },
          { rol: notificacion.rol }
        );
      } else if (notificacion.tipo === 'mantenimiento') {
        resultado = await enviarNotificacion(
          `🔧 ${notificacion.titulo}`,
          notificacion.mensaje,
          {
            tipo: 'mantenimiento',
            url: notificacion.url || '/'
          },
          { rol: notificacion.rol }
        );
      }
      
      // Marcar como enviada
      await supabaseAdmin
        .from('notificaciones_programadas')
        .update({ enviada: true })
        .eq('id', notificacion.id);
        
      console.log(`Notificación programada ${notificacion.id} enviada correctamente`);
    } catch (error) {
      console.error(`Error al enviar notificación programada ${notificacion.id}:`, error);
    }
  }
}

export default async function handler(req, res) {
  // Verificar clave secreta para proteger el endpoint
  const { authorization } = req.headers;
  // En la función handler, modifica la verificación de autorización
  const secretKey = process.env.CRON_SECRET_KEY || 'test-secret';

  if (authorization !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    // Ejecutar todas las verificaciones
    await checkNuevasCalificaciones();
    await checkTareasPendientes();
    await checkClasesProximas();
    await checkAsistenciaBaja();
    await checkDiasFestivos();
    await checkNotificacionesProgramadas(); // Agregar esta línea

    return res.status(200).json({ success: true, message: 'Notificaciones procesadas correctamente' });
  } catch (error) {
    console.error('Error al procesar notificaciones:', error);
    return res.status(500).json({ error: 'Error al procesar notificaciones' });
  }
}// Al final del archivo, añade esta línea
export { checkNotificacionesProgramadas, checkAsistenciaBaja, checkTareasPendientes };
