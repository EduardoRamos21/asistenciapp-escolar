/**
 * Servicio de WhatsApp usando enlaces wa.me
 * Este enfoque genera enlaces que abren WhatsApp con un mensaje prellenado
 * El maestro debe hacer clic en "Enviar" manualmente
 */

/**
 * Genera un enlace de WhatsApp con un mensaje prellenado
 * @param {string} phoneNumber - Número de teléfono del destinatario (con código de país, sin espacios)
 * @param {string} message - Mensaje a enviar
 * @returns {string} - URL de WhatsApp
 */
function generateWhatsAppLink(phoneNumber, message) {
  // Asegurarse de que el número esté en formato correcto (solo dígitos y el signo +)
  const formattedNumber = phoneNumber.replace(/[^0-9+]/g, '');
  
  // Codificar el mensaje para URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generar el enlace wa.me
  return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
}

/**
 * Función para mantener compatibilidad con el código existente
 * En lugar de enviar un mensaje, devuelve un objeto con el enlace
 */
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    const whatsappLink = generateWhatsAppLink(phoneNumber, message);
    return { 
      success: true, 
      whatsappLink,
      message,
      phoneNumber
    };
  } catch (error) {
    console.error("Error al generar enlace de WhatsApp:", error);
    return { success: false, error: error.message };
  }
}

// No es necesario inicializar nada, así que esta función siempre devuelve true
async function initializeWhatsApp() {
  console.log("Servicio de enlaces WhatsApp inicializado");
  return true;
}

module.exports = {
  initializeWhatsApp,
  sendWhatsAppMessage,
  generateWhatsAppLink
};