import { createClient } from '@supabase/supabase-js'

// Inicializar cliente de Supabase con la clave de servicio
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { padre_id, alumno_id, directorId } = req.body

    if (!padre_id || !alumno_id || !directorId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' })
    }

    // Verificar que el usuario que hace la solicitud es un director
    const { data: director, error: errorDirector } = await supabaseAdmin
      .from('directores')
      .select('escuela_id')
      .eq('usuario_id', directorId)
      .single()

    if (errorDirector || !director) {
      return res.status(403).json({ error: 'No autorizado o director no encontrado' })
    }

    // Verificar que el alumno pertenece a la escuela del director
    // CORRECCIÓN: Usar directamente el ID del alumno, no el usuario_id
    const { data: alumno, error: errorAlumno } = await supabaseAdmin
      .from('alumnos')
      .select('id')
      .eq('id', alumno_id)  // Corregido: usar id en lugar de usuario_id
      .eq('escuela_id', director.escuela_id)
      .single()

    if (errorAlumno || !alumno) {
      return res.status(403).json({ error: 'El alumno no pertenece a tu escuela' })
    }

    // Verificar si ya existe la asignación
    const { data: asignacionExistente, error: errorAsignacion } = await supabaseAdmin
      .from('padre_alumno')
      .select('id')
      .eq('padre_id', padre_id)
      .eq('alumno_id', alumno_id)
      .single()

    if (asignacionExistente) {
      return res.status(400).json({ error: 'Esta asignación ya existe' })
    }

    // Crear la asignación
    const { data, error } = await supabaseAdmin
      .from('padre_alumno')
      .insert({
        padre_id: padre_id,
        alumno_id: alumno_id
      })
      .select()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Devolver respuesta exitosa
    return res.status(200).json({
      success: true,
      data: data[0]
    })
  } catch (error) {
    console.error('Error al asignar padre a alumno:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}