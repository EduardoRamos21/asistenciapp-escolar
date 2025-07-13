import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import LayoutPadre from '@/components/LayoutPadre';
import LayoutMaestro from '@/components/LayoutMaestro';
import LayoutAlumno from '@/components/LayoutAlumno';
import { FiHelpCircle, FiClipboard, FiCalendar, FiHeadphones, FiBook, FiCheckCircle } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';

export default function Ayuda() {
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRol = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setRol(data.rol);
      }
      
      setLoading(false);
    };

    fetchRol();
  }, []);

    // Contenido para directores
    const ContenidoAyudaDirector = () => (
      <div className="flex-1 w-full h-full flex flex-col">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <FiHelpCircle className="text-3xl text-blue-500 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ayuda para directores</h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Guía para la gestión y administración escolar.</p>
        </div>
        
        <div className="flex-1 space-y-6 overflow-auto pb-6">
          <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <FiBook className="text-xl text-blue-500 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gestión de maestros</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo agregar un nuevo maestro?</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Para agregar un nuevo maestro, ve a la sección Maestros y haz clic en el botón Añadir maestro. Completa el formulario con los datos del maestro y haz clic en Guardar.</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo asignar materias a un maestro?</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">En la sección Maestros, selecciona el maestro al que deseas asignar materias y haz clic en Asignar materias. Selecciona las materias y grupos correspondientes y guarda los cambios.</p>
              </div>
            </div>
          </section>
          
          <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <FiBook className="text-xl text-blue-500 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gestión de grupos</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo crear un nuevo grupo?</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Para crear un nuevo grupo, ve a la sección Grupos y haz clic en Crear grupo. Define el nombre, grado y otros detalles del grupo, y luego guarda los cambios.</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo ver las estadísticas de un grupo?</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-1">En la sección Grupos, selecciona el grupo del que deseas ver estadísticas. En la página de detalles del grupo encontrarás información sobre asistencia, rendimiento académico y más.</p>
              </div>
            </div>
          </section>
          
          <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <FiHeadphones className="text-xl text-blue-500 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Soporte técnico</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Si tienes problemas técnicos o dudas sobre el uso de la plataforma, puedes contactar al equipo de soporte:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li className="text-gray-600 dark:text-gray-300">Correo electrónico: <a href="mailto:soporte@asistenciapp.com" className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">soporte@asistenciapp.com</a></li>
              <li className="text-gray-600 dark:text-gray-300">Teléfono: <span className="font-medium">(123) 456-7890</span></li>
              <li className="text-gray-600 dark:text-gray-300">Horario de atención: <span className="font-medium">Lunes a viernes de 9:00 a 18:00</span></li>
            </ul>
          </section>
        </div>
      </div>
    );

  // Contenido específico para alumnos
  const ContenidoAyudaAlumno = () => (
    <div className="flex-1 w-full h-full flex flex-col">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl mb-6">
        <div className="flex items-center gap-3">
          <FiHelpCircle className="text-3xl text-blue-500 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ayuda para estudiantes</h1>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Guía de uso de AsistenciApp para estudiantes.</p>
      </div>
      
      <div className="flex-1 space-y-6 overflow-auto pb-6">
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiClipboard className="text-xl text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gestión de tareas</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo ver mis tareas pendientes?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Para ver tus tareas pendientes, accede a la sección Tareas desde el menú lateral. Allí encontrarás todas las tareas asignadas a tu grupo, organizadas por fecha de entrega.</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo entregar una tarea?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Para entregar una tarea, haz clic en la tarea correspondiente y luego en el botón Entregar. Podrás adjuntar archivos o escribir tu respuesta según lo requiera la tarea.</p>
            </div>
          </div>
        </section>
        
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiBook className="text-xl text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Materias y calificaciones</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo consultar mis calificaciones?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Puedes consultar tus calificaciones en la sección Tareas. Cada tarea calificada mostrará la puntuación asignada por tu profesor.</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo saber si tengo tareas atrasadas?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Las tareas cuya fecha de entrega ya ha pasado aparecerán marcadas en rojo en tu lista de tareas, indicando que están atrasadas.</p>
            </div>
          </div>
        </section>
        
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiCheckCircle className="text-xl text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Mi cuenta</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo cambiar mi contraseña?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Para cambiar tu contraseña, ve a la sección Mi cuenta desde el menú lateral. Allí encontrarás la opción para cambiar tu contraseña actual por una nueva.</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo actualizar mi foto de perfil?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">En la sección Mi cuenta, haz clic sobre tu imagen de perfil y selecciona una nueva foto desde tu dispositivo.</p>
            </div>
          </div>
        </section>
        
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiHeadphones className="text-xl text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Soporte técnico</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Si tienes problemas técnicos o dudas sobre el uso de la plataforma, puedes contactar al equipo de soporte:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li className="text-gray-600 dark:text-gray-300">Correo electrónico: <a href="mailto:soporte@asistenciapp.com" className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">soporte@asistenciapp.com</a></li>
            <li className="text-gray-600 dark:text-gray-300">Teléfono: <span className="font-medium">(123) 456-7890</span></li>
            <li className="text-gray-600 dark:text-gray-300">Horario de atención: <span className="font-medium">Lunes a viernes de 9:00 a 18:00</span></li>
          </ul>
        </section>
      </div>
    </div>
  );

  // Contenido para maestros (el original)
  const ContenidoAyudaMaestro = () => (
    <div className="flex-1 w-full h-full flex flex-col">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl mb-6">
        <div className="flex items-center gap-3">
          <FiHelpCircle className="text-3xl text-blue-500 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ayuda para docentes</h1>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Encuentra respuestas a preguntas frecuentes y contacta con nuestro equipo de soporte.</p>
      </div>
      
      <div className="space-y-6 pb-24"> {/* Aumentado el padding-bottom a 24 (6rem) */}
        {/* Resto del contenido sin cambios */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiClipboard className="text-xl text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gestión de tareas</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo crear una nueva tarea?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Para crear una nueva tarea, ve a la sección Tareas y haz clic en el botón Añadir tarea. Completa el formulario con el título, descripción, materia y fecha de entrega, y luego haz clic en Guardar tarea.</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo calificar las entregas?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Para calificar las entregas, ve a la sección Tareas, busca la tarea que deseas revisar y haz clic en el icono de lupa. En la página de detalle, podrás ver todas las entregas de los alumnos y asignar calificaciones.</p>
            </div>
          </div>
        </section>
        
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiCalendar className="text-xl text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Registro de asistencia</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo registrar la asistencia?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Para registrar la asistencia, ve a la sección Asistencias, selecciona el grupo y la materia, marca las casillas de los alumnos presentes y haz clic en Enviar asistencia.</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Puedo modificar la asistencia después de enviarla?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Sí, puedes modificar la asistencia del día actual volviendo a seleccionar el grupo y la materia, y enviando nuevamente la asistencia actualizada.</p>
            </div>
          </div>
        </section>
        
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiHeadphones className="text-xl text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Soporte técnico</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Si tienes problemas técnicos o dudas sobre el uso de la plataforma, puedes contactar al equipo de soporte:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li className="text-gray-600 dark:text-gray-300">Correo electrónico: <a href="mailto:soporte@asistenciapp.com" className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">soporte@asistenciapp.com</a></li>
            <li className="text-gray-600 dark:text-gray-300">Teléfono: <span className="font-medium">(123) 456-7890</span></li>
            <li className="text-gray-600 dark:text-gray-300">Horario de atención: <span className="font-medium">Lunes a viernes de 9:00 a 18:00</span></li>
          </ul>
        </section>
      </div>
    </div>
  );

  // Contenido para padres
  const ContenidoAyudaPadre = () => (
    <div className="flex-1 w-full h-full flex flex-col">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl mb-6">
        <div className="flex items-center gap-3">
          <FiHelpCircle className="text-3xl text-blue-500 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ayuda para padres</h1>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Guía para el seguimiento del desempeño escolar de sus hijos.</p>
      </div>
      
      <div className="flex-1 space-y-6 overflow-auto pb-6">
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiCalendar className="text-xl text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Seguimiento de asistencia</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo ver la asistencia de mi hijo/a?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Para ver la asistencia de tu hijo/a, selecciona su perfil desde la página principal y luego haz clic en Asistencia. Podrás ver un registro completo de su asistencia por materia y fecha.</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo exportar el registro de asistencia?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">En la página de asistencia de tu hijo/a, encontrarás un botón Exportar PDF que te permitirá descargar un informe completo de asistencia para tus registros.</p>
            </div>
          </div>
        </section>
        
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiClipboard className="text-xl text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Tareas y calificaciones</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo ver las tareas asignadas a mi hijo/a?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Selecciona el perfil de tu hijo/a y haz clic en Tareas. Podrás ver todas las tareas asignadas, sus fechas de entrega y calificaciones.</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white">¿Cómo recibir notificaciones sobre nuevas tareas?</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">En la sección Mi cuenta, puedes configurar las notificaciones para recibir alertas por correo electrónico cuando se asignen nuevas tareas a tu hijo/a.</p>
            </div>
          </div>
        </section>
        
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <FiHeadphones className="text-xl text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Soporte técnico</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Si tienes problemas técnicos o dudas sobre el uso de la plataforma, puedes contactar al equipo de soporte:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li className="text-gray-600 dark:text-gray-300">Correo electrónico: <a href="mailto:soporte@asistenciapp.com" className="text-blue-600 dark:text-blue-400 hover:underline transition-colors">soporte@asistenciapp.com</a></li>
            <li className="text-gray-600 dark:text-gray-300">Teléfono: <span className="font-medium">(123) 456-7890</span></li>
            <li className="text-gray-600 dark:text-gray-300">Horario de atención: <span className="font-medium">Lunes a viernes de 9:00 a 18:00</span></li>
          </ul>
        </section>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full mb-4 flex items-center justify-center">
            <div className="w-10 h-10 bg-blue-500/40 rounded-full"></div>
          </div>
          <div className="text-blue-600 dark:text-blue-400 font-medium">Cargando...</div>
        </div>
      </div>
    );
  }

  // Renderizar el layout correcto según el rol
  if (rol === 'padre') {
    return <LayoutPadre><ContenidoAyudaPadre /></LayoutPadre>;
  } else if (rol === 'maestro') {
    return <LayoutMaestro><ContenidoAyudaMaestro /></LayoutMaestro>;
  } else if (rol === 'alumno') {
    return <LayoutAlumno><ContenidoAyudaAlumno /></LayoutAlumno>;
  } else if (rol === 'director') {
    return <Layout><ContenidoAyudaDirector /></Layout>;
  } else {
    // Fallback para cualquier otro rol no contemplado
    return <Layout><ContenidoAyudaMaestro /></Layout>;
  }
}