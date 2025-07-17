import { createClient } from '@supabase/supabase-js';
import { enviarNotificacionAToken, enviarNotificacionAMultiplesTokens } from '@/lib/firebase-admin';

// Inicializar cliente de Supabase con la clave de servicio
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { titulo, cuerpo, datos, rol } = req.body;

    if (!titulo || !cuerpo) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    console.log('Iniciando envío de notificación:', { titulo, cuerpo, datos, rol });

    // Guardar la notificación en la base de datos
    const { data: notificacion, error: errorNotificacion } = await supabaseAdmin
      .from('notificaciones')
      .insert([
        {
          titulo,
          mensaje: cuerpo,
          datos: datos || {},
          tipo: rol || 'todos',
          leida: false,
          fecha_creacion: new Date().toISOString(),
          enviada_push: true  // Cambiado de false a true
        }
      ])
      .select()
      .single();

    if (errorNotificacion) {
      console.error('Error al guardar notificación:', errorNotificación);
      return res.status(500).json({ error: 'Error al guardar notificación' });
    }

    // Obtener usuarios según el rol
    let usuarios = [];
    
    if (rol && rol !== 'todos') {
      // Obtener usuarios con un rol específico
      console.log(`Buscando usuarios con rol: ${rol}`);
      
      const { data: usuariosRol, error: errorUsuarios } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('rol', rol);
        
      if (errorUsuarios) {
        console.error('Error al buscar usuarios por rol:', errorUsuarios);
        return res.status(500).json({ error: 'Error al buscar usuarios' });
      }
      
      if (usuariosRol && usuariosRol.length > 0) {
        console.log(`Encontrados ${usuariosRol.length} usuarios con rol ${rol}`);
        usuarios = usuariosRol;
      } else {
        console.log(`No se encontraron usuarios con rol ${rol}`);
      }
    } else {
      // Obtener todos los usuarios
      console.log('Enviando notificación a todos los usuarios');
      const { data: todosUsuarios, error: errorTodos } = await supabaseAdmin
        .from('usuarios')
        .select('id');
      
      if (errorTodos) {
        console.error('Error al buscar todos los usuarios:', errorTodos);
        return res.status(500).json({ error: 'Error al buscar usuarios' });
      }
      
      if (todosUsuarios && todosUsuarios.length > 0) {
        console.log(`Encontrados ${todosUsuarios.length} usuarios en total`);
        usuarios = todosUsuarios;
      } else {
        console.log('No se encontraron usuarios');
      }
    }

    // Si no hay usuarios, actualizar estado de la notificación
    if (usuarios.length === 0) {
      await supabaseAdmin
        .from('notificaciones')
        .update({ enviada_push: false })
        .eq('id', notificacion.id);
      
      return res.status(200).json({ 
        success: false, 
        message: 'No hay destinatarios disponibles para esta notificación',
        notificacion_id: notificacion.id
      });
    }

    // Crear registros en notificaciones_usuarios
    const notificacionesUsuarios = usuarios.map(usuario => ({
      notificacion_id: notificacion.id,
      usuario_id: usuario.id,
      leida: false
    }));

    const { error: errorInsert } = await supabaseAdmin
      .from('notificaciones_usuarios')
      .insert(notificacionesUsuarios);

    if (errorInsert) {
      console.error('Error al crear notificaciones para usuarios:', errorInsert);
    }

    // Ahora buscar tokens para enviar notificaciones push
    // Después de obtener los tokens (alrededor de la línea 150)
    const { data: tokens, error: errorTokens } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .eq('activo', true)
      .in('usuario_id', usuarios.map(u => u.id));
    
    console.log('🔍 Tokens encontrados:', {
      usuarios_encontrados: usuarios.length,
      tokens_encontrados: tokens?.length || 0,
      tokens_detalle: tokens?.map(t => ({ token: t.token.substring(0, 20) + '...' })) || [],
      error_tokens: errorTokens
    });
    
    if (!tokens || tokens.length === 0) {
      console.log('⚠️ No se encontraron tokens push activos para los usuarios');
      return res.status(200).json({
        success: false,
        message: 'No hay tokens push registrados para enviar notificaciones',
        usuarios_notificados: usuarios.length,
        tokens_enviados: 0,
        tokens_exitosos: 0
      });
    }

    // Eliminar tokens duplicados
    const uniqueTokens = [];
    const processedUserTokens = new Set();

    if (tokens && tokens.length > 0) {
      // Usar directamente los tokens sin filtrado adicional
      tokens.forEach(t => {
        const userTokenKey = `${t.usuario_id}_${t.token}`;
        if (!processedUserTokens.has(userTokenKey)) {
          uniqueTokens.push(t.token);
          processedUserTokens.add(userTokenKey);
        }
      });
    }
    
    // Usar uniqueTokens directamente
    let tokensList = uniqueTokens;
    
    // Si no hay tokens, actualizar estado pero considerar exitoso el registro de notificaciones
    if (tokensList.length === 0) {
      await supabaseAdmin
        .from('notificaciones')
        .update({ 
          enviada_push: false,
          usuarios_notificados: usuarios.length
        })
        .eq('id', notificacion.id);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Notificación registrada pero no hay tokens para enviar push',
        notificacion_id: notificacion.id,
        usuarios_notificados: usuarios.length
      });
    }

    // Antes de enviar las notificaciones
    console.log('Tokens a enviar:', tokensList);
    const datosString = {};
    if (datos) {
      Object.keys(datos).forEach(key => {
        datosString[key] = String(datos[key]);
      });
    }
    datosString.notificacion_id = String(notificacion.id);
    
    // Enviar notificaciones push
    const resultado = await enviarNotificacionAMultiplesTokens(
      tokensList,
      titulo,
      cuerpo,
      datosString
    );

    // Actualizar estado de la notificación
    await supabaseAdmin
      .from('notificaciones')
      .update({ 
        enviada_push: true, // Cambiar esto para marcar siempre como enviada
        tokens_enviados: tokensList.length,
        tokens_exitosos: resultado.successCount || 0,
        tokens_fallidos: resultado.failureCount || 0,
        usuarios_notificados: usuarios.length
      })
      .eq('id', notificacion.id);

    return res.status(200).json({
      success: true,
      notificacion_id: notificacion.id,
      usuarios_notificados: usuarios.length,
      tokens_enviados: tokensList.length,
      tokens_exitosos: resultado.successCount || 0,
      tokens_fallidos: resultado.failureCount || 0
    });
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud: ' + error.message });
  }
}