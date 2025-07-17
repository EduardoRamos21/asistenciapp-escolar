import { useState, useEffect } from 'react';
import { useNotificaciones } from '@/contexts/NotificacionesContext';

const NotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { usuario, permisoSolicitado, solicitarPermisoManualmente } = useNotificaciones();

  useEffect(() => {
    // Mostrar el prompt si:
    // 1. Hay un usuario autenticado
    // 2. No se ha solicitado permiso aún
    // 3. Los permisos están en "default"
    if (usuario && !permisoSolicitado && typeof window !== 'undefined') {
      const checkPermission = () => {
        if ('Notification' in window && Notification.permission === 'default') {
          setTimeout(() => {
            setShowPrompt(true);
            setTimeout(() => setIsVisible(true), 100);
          }, 2000); // Esperar 2 segundos después del login
        }
      };
      
      checkPermission();
    }
  }, [usuario, permisoSolicitado]);

  const handleAccept = async () => {
    try {
      setIsVisible(false);
      setTimeout(() => setShowPrompt(false), 300);
      
      // Intentar solicitar permiso
      const success = await solicitarPermisoManualmente();
      
      if (success) {
        console.log('✅ Notificaciones habilitadas exitosamente');
      } else {
        // Si falla, mostrar instrucciones
        showManualInstructions();
      }
    } catch (error) {
      console.error('Error al habilitar notificaciones:', error);
      showManualInstructions();
    }
  };

  const handleDecline = () => {
    setIsVisible(false);
    setTimeout(() => setShowPrompt(false), 300);
    
    // Guardar preferencia del usuario
    localStorage.setItem('notificaciones_declined', 'true');
  };

  const showManualInstructions = () => {
    const isEdge = /Edg/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edg/i.test(navigator.userAgent);
    const isFirefox = /Firefox/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent) && !/Edg/i.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isEdge) {
      instructions = `Para habilitar notificaciones en Edge:\n1. Haz clic en el icono de candado 🔒 o campana en la barra de direcciones\n2. Selecciona "Permisos para este sitio"\n3. Cambia "Notificaciones" a "Permitir"\n4. Recarga la página`;
    } else if (isChrome) {
      instructions = `Para habilitar notificaciones en Chrome:\n1. Haz clic en el icono de candado 🔒 o campana en la barra de direcciones\n2. Selecciona "Notificaciones" y elige "Permitir"\n3. Recarga la página`;
    } else if (isFirefox) {
      instructions = `Para habilitar notificaciones en Firefox:\n1. Haz clic en el icono de escudo 🛡️o campana en la barra de direcciones\n2. Desactiva "Bloqueo de notificaciones"\n3. Recarga la página`;
    } else if (isSafari) {
      instructions = `Para habilitar notificaciones en Safari:\n1. Ve a Safari > Preferencias (o Configuración)\n2. Haz clic en la pestaña "Sitios web"\n3. Selecciona "Notificaciones" en la barra lateral\n4. Encuentra este sitio y cambia a "Permitir"\n5. Recarga la página`;
    } else {
      instructions = `Para habilitar notificaciones:\n1. Busca el icono de configuración en la barra de direcciones\n2. Permite las notificaciones para este sitio\n3. Recarga la página`;
    }
    
    alert(instructions);
  };

  // No mostrar si el usuario ya declinó
  if (typeof window !== 'undefined' && localStorage.getItem('notificaciones_declined') === 'true') {
    return null;
  }

  if (!showPrompt) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
          isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleDecline}
      />
      
      {/* Modal */}
      <div className={`fixed inset-0 flex items-center justify-center z-50 p-4`}>
        <div 
          className={`bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔔</span>
              <h3 className="text-lg font-semibold">Habilitar Notificaciones</h3>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              ¿Te gustaría recibir notificaciones sobre:
            </p>
            <ul className="text-sm text-gray-600 mb-6 space-y-2">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Nuevas tareas y calificaciones
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Recordatorios de clases
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Anuncios importantes
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Alertas de asistencia
              </li>
            </ul>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
              <p className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> Puedes desactivar las notificaciones en cualquier momento desde la configuración de tu navegador.
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              🔔 Habilitar Notificaciones
            </button>
            <button
              onClick={handleDecline}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationPrompt;