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
    const { email, password, nombre, directorId } = req.body

    if (!email || !password || !nombre || !directorId) {
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

    // 1. Crear usuario en Auth
    const { data: userData, error: errorAuth } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirmar el email
    })

    if (errorAuth) {
      return res.status(400).json({ error: errorAuth.message })
    }

    // 2. Crear registro en tabla usuarios
    const { error: errorUsuario } = await supabaseAdmin
      .from('usuarios')
      .insert([
        {
          id: userData.user.id,
          nombre,
          email,
          rol: 'maestro',
          escuela_id: director.escuela_id
        }
      ])

    if (errorUsuario) {
      return res.status(400).json({ error: errorUsuario.message })
    }

    // 3. Crear registro en tabla maestros
    const { data: maestroInsertado, error: errorMaestro } = await supabaseAdmin
      .from('maestros')
      .insert([
        {
          usuario_id: userData.user.id,
          escuela_id: director.escuela_id
        }
      ])
      .select()

    if (errorMaestro) {
      return res.status(400).json({ error: errorMaestro.message })
    }

    // Devolver respuesta exitosa
    return res.status(200).json({
      success: true,
      data: {
        id: maestroInsertado[0].id,
        nombre,
        email
      }
    })
  } catch (error) {
    console.error('Error al crear maestro:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}