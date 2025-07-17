import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase con la clave de servicio
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { titulo, descripcion, materia_id, fecha_entrega } = req.body;

    if (!titulo || !materia_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    console.log('Creando tarea:', { titulo, materia_id });

    // 1. Crear la tarea
    const { data: nuevaTarea, error: errorTarea } = await supabaseAdmin
      .from('tareas')
      .insert([{
        titulo,
        descripcion,
        materia_id: parseInt(materia_id),
        fecha_entrega: fecha_entrega ? new Date(fecha_entrega).toISOString() : new Date().toISOString()
      }])
      .select('*')
      .single();

    if (errorTarea) {
      console.error('Error al crear tarea:', errorTarea);
      throw errorTarea;
    }

    console.log('Tarea creada exitosamente:', nuevaTarea.id);

    // 2. Obtener información de la materia y grupo desde asignaciones
    const { data: asignacion, error: errorAsignacion } = await supabaseAdmin
      .from('asignaciones')
      .select(`
        grupo_id,
        materias!inner(
          nombre
        )
      `)
      .eq('materia_id', materia_id)
      .single();

    if (errorAsignacion) {
      console.error('Error al obtener asignación:', errorAsignacion);
      throw errorAsignacion;
    }

    console.log('Materia encontrada:', asignacion.materias.nombre, 'Grupo:', asignacion.grupo_id);

    // 3. Obtener alumnos del grupo
    const { data: alumnos, error: errorAlumnos } = await supabaseAdmin
      .from('alumnos')
      .select(`
        usuario_id,
        usuarios!inner(
          id,
          nombre,
          rol
        )
      `)
      .eq('grupo_id', asignacion.grupo_id)
      .eq('usuarios.rol', 'alumno');

    if (errorAlumnos) {
      console.error('Error al obtener alumnos:', errorAlumnos);
    } else {
      console.log(`Encontrados ${alumnos?.length || 0} alumnos en el grupo`);
      
      if (alumnos && alumnos.length > 0) {
        // 4. Enviar notificación a los alumnos
        const notificacionData = {
          titulo: '📚 Nueva tarea asignada',
          cuerpo: `${titulo} - Materia: ${asignacion.materias.nombre}`,
          datos: {
            tipo: 'nueva_tarea',
            tarea_id: nuevaTarea.id,
            materia: asignacion.materias.nombre,
            url: `/alumno/tareas/${nuevaTarea.id}`
          },
          rol: 'alumno'
        };

        console.log('Enviando notificación:', notificacionData);

        // Llamar al endpoint de notificaciones existente
        try {
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                         (req.headers.host ? `http://${req.headers.host}` : 'http://localhost:3000');
          
          const response = await fetch(`${baseUrl}/api/enviar-notificacion`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificacionData)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error al enviar notificación:', errorText);
          } else {
            const result = await response.json();
            console.log('Notificación enviada exitosamente:', result);
          }
        } catch (notifError) {
          console.error('Error al enviar notificación:', notifError);
        }
      }
    }

    res.status(200).json({ 
      success: true, 
      tarea: nuevaTarea,
      message: 'Tarea creada y notificación enviada exitosamente',
      alumnos_notificados: alumnos?.length || 0
    });

  } catch (error) {
    console.error('Error general al crear tarea:', error);
    res.status(500).json({ error: error.message });
  }
}