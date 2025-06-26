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
    const { nombre, grupoId, directorId } = req.body

    if (!nombre || !grupoId || !directorId) {
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

    // Obtener información del grupo para generar el email
    const { data: grupo, error: errorGrupo } = await supabaseAdmin
      .from('grupos')
      .select('nombre, escuelas:escuela_id (nombre)')
      .eq('id', grupoId)
      .single()

    if (errorGrupo || !grupo) {
      return res.status(400).json({ error: 'Grupo no encontrado' })
    }

    // Extraer primer nombre y primer apellido
    const nombreParts = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .split(' ');
    
    const primerNombre = nombreParts[0];
    const primerApellido = nombreParts.length > 1 ? nombreParts[1] : '';
    
    // Generar número aleatorio de 4 dígitos
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    
    // Crear email más corto
    const email = `${primerNombre}${primerApellido ? '.' + primerApellido : ''}${randomNum}@asistenciapp.edu`;

    // Generar contraseña aleatoria
    // Usar contraseña por defecto en lugar de aleatoria
    const password = 'password123';

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
          rol: 'alumno'
        }
      ])

    if (errorUsuario) {
      return res.status(400).json({ error: errorUsuario.message })
    }

    // 3. Crear alumno asociado al grupo
    const { data: alumnoData, error: alumnoError } = await supabaseAdmin
      .from('alumnos')
      .insert([
        {
          usuario_id: userData.user.id,
          grupo_id: grupoId,
          escuela_id: director.escuela_id
        }
      ])
      .select()

    if (alumnoError) {
      return res.status(400).json({ error: alumnoError.message })
    }

    // Devolver respuesta exitosa
    return res.status(200).json({
      success: true,
      data: {
        ...alumnoData[0],
        nombre,
        email
      },
      message: `Alumno creado correctamente. Email: ${email} | Contraseña temporal: ${password}`
    })
  } catch (error) {
    console.error('Error al crear alumno:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}