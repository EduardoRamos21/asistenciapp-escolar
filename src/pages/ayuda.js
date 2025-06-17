import Layout from '@/components/Layout';

export default function Ayuda() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Ayuda y soporte</h1>
        
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-md border">
            <h2 className="text-xl font-semibold mb-4">Gestión de tareas</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">¿Cómo crear una nueva tarea?</h3>
                <p className="text-gray-600">Para crear una nueva tarea, ve a la sección Tareas y haz clic en el botón Añadir tarea. Completa el formulario con el título, descripción, materia y fecha de entrega, y luego haz clic en Guardar tarea.</p>
              </div>
              <div>
                <h3 className="font-medium">¿Cómo calificar las entregas?</h3>
                <p className="text-gray-600">Para calificar las entregas, ve a la sección Tareas, busca la tarea que deseas revisar y haz clic en el icono de lupa. En la página de detalle, podrás ver todas las entregas de los alumnos y asignar calificaciones.</p>
              </div>
            </div>
          </section>
          
          <section className="bg-white p-6 rounded-xl shadow-md border">
            <h2 className="text-xl font-semibold mb-4">Registro de asistencia</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">¿Cómo registrar la asistencia?</h3>
                <p className="text-gray-600">Para registrar la asistencia, ve a la sección Asistencias, selecciona el grupo y la materia, marca las casillas de los alumnos presentes y haz clic en Enviar asistencia.</p>
              </div>
              <div>
                <h3 className="font-medium">¿Puedo modificar la asistencia después de enviarla?</h3>
                <p className="text-gray-600">Sí, puedes modificar la asistencia del día actual volviendo a seleccionar el grupo y la materia, y enviando nuevamente la asistencia actualizada.</p>
              </div>
            </div>
          </section>
          
          <section className="bg-white p-6 rounded-xl shadow-md border">
            <h2 className="text-xl font-semibold mb-4">Soporte técnico</h2>
            <p className="text-gray-600 mb-4">Si tienes problemas técnicos o dudas sobre el uso de la plataforma, puedes contactar al equipo de soporte:</p>
            <ul className="list-disc pl-5 text-gray-600">
              <li>Correo electrónico: <a href="mailto:soporte@asistenciapp.com" className="text-blue-600 hover:underline">soporte@asistenciapp.com</a></li>
              <li>Teléfono: (123) 456-7890</li>
              <li>Horario de atención: Lunes a viernes de 9:00 a 18:00</li>
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
}