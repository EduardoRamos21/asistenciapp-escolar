import LayoutAdmin from '@/components/LayoutAdmin';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiClock, FiSend, FiSettings, FiList } from 'react-icons/fi';
import { 
  enviarAnuncioEscolar,
  enviarAlertaEmergencia,
  enviarRecordatorioFestivo,
  enviarNotificacionMantenimiento,
  notificarAsistenciaBaja
} from '@/lib/notificacionesService';

export default function GestionNotificaciones() {
  const [activeTab, setActiveTab] = useState('historial');
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [programarModalVisible, setProgramarModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    tipo: 'anuncio',
    rol: '',
    url: '/',
    fecha_programada: '',
    hora_programada: ''
  });
  const [umbralAsistencia, setUmbralAsistencia] = useState(70);
  const [roles, setRoles] = useState([
    { id: 'todos', nombre: 'Todos los usuarios' },
    { id: 'alumno', nombre: 'Alumnos' },
    { id: 'padre', nombre: 'Padres' },
    { id: 'maestro', nombre: 'Maestros' },
    { id: 'director', nombre: 'Directores' }
  ]);

  useEffect(() => {
    if (activeTab === 'historial') {
      fetchNotificaciones();
    }
  }, [activeTab]);

  const fetchNotificaciones = async () => {
    setLoading(true);
    console.log('Consultando notificaciones...');
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .order('fecha_creacion', { ascending: false });
  
    if (error) {
      console.error('Error al cargar notificaciones:', error);
    } else {
      console.log('Notificaciones obtenidas:', data);
      // Imprime la estructura completa para depuración
      console.log('Estructura de datos:', JSON.stringify(data, null, 2));
      // Verificar si hay datos pero no se están mostrando correctamente
      if (data && data.length > 0) {
        console.log('Primera notificación:', data[0]);
        console.log('Campos de la primera notificación:', Object.keys(data[0]));
      }
      setNotificaciones(data || []);
    }
    setLoading(false);
  };

  const fetchConfiguracion = async () => {
    const { data, error } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'umbral_asistencia')
      .single();

    if (!error && data) {
      setUmbralAsistencia(parseInt(data.valor));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.mensaje) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      let resultado;
      
      switch (formData.tipo) {
        case 'anuncio':
          resultado = await enviarAnuncioEscolar(formData.titulo, formData.mensaje, formData.url, formData.rol);
          break;
        case 'emergencia':
          resultado = await enviarAlertaEmergencia(formData.titulo, formData.mensaje, formData.rol);
          break;
        case 'festivo':
          resultado = await enviarRecordatorioFestivo(formData.titulo, formData.mensaje, new Date().toISOString(), formData.rol);
          break;
        case 'mantenimiento':
          resultado = await enviarNotificacionMantenimiento(formData.titulo, formData.mensaje, new Date().toISOString(), new Date().toISOString(), formData.rol);
          break;
        default:
          throw new Error('Tipo de notificación no válido');
      }

      if (resultado.success) {
        alert('Notificación enviada correctamente');
        closeModal();
        if (activeTab === 'historial') {
          fetchNotificaciones();
        }
      } else {
        throw new Error(resultado.error || 'Error al enviar la notificación');
      }
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      alert('Error al enviar la notificación. Inténtalo de nuevo.');
    }
  };

  const handleProgramarSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.mensaje || !formData.fecha_programada || !formData.hora_programada) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      // Crear fecha completa combinando fecha y hora
      const fechaHora = new Date(`${formData.fecha_programada}T${formData.hora_programada}:00`);
      
      // Guardar notificación programada en la base de datos
      const { data, error } = await supabase
        .from('notificaciones_programadas')
        .insert([
          {
            titulo: formData.titulo,
            mensaje: formData.mensaje,
            tipo: formData.tipo,
            rol: formData.rol || null,
            url: formData.url || '/',
            fecha_programada: fechaHora.toISOString(),
            enviada: false
          }
        ]);

      if (error) throw error;

      alert('Notificación programada correctamente');
      closeProgramarModal();
    } catch (error) {
      console.error('Error al programar notificación:', error);
      alert('Error al programar la notificación. Inténtalo de nuevo.');
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('configuracion')
        .upsert([
          {
            clave: 'umbral_asistencia',
            valor: umbralAsistencia.toString(),
            descripcion: 'Porcentaje mínimo de asistencia para alertas'
          }
        ]);

      if (error) throw error;

      alert('Configuración guardada correctamente');
      closeConfigModal();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar la configuración. Inténtalo de nuevo.');
    }
  };

  const openModal = () => {
    setFormData({
      titulo: '',
      mensaje: '',
      tipo: 'anuncio',
      rol: '',
      url: '/'
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const openProgramarModal = () => {
    setFormData({
      titulo: '',
      mensaje: '',
      tipo: 'anuncio',
      rol: '',
      url: '/',
      fecha_programada: new Date().toISOString().split('T')[0],
      hora_programada: '12:00'
    });
    setProgramarModalVisible(true);
  };

  const closeProgramarModal = () => {
    setProgramarModalVisible(false);
  };

  const openConfigModal = () => {
    fetchConfiguracion();
    setConfigModalVisible(true);
  };

  const closeConfigModal = () => {
    setConfigModalVisible(false);
  };

  const deleteNotificacion = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta notificación?')) return;

    try {
      const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchNotificaciones();
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      alert('Error al eliminar la notificación. Inténtalo de nuevo.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoNotificacion = (tipo) => {
    // Si tipo es null o undefined, devolver un valor por defecto
    if (!tipo) return 'Desconocido';
    
    // Verificar si tipo contiene información de destinatario
    if (tipo.startsWith('rol:')) {
      return `Rol: ${tipo.replace('rol:', '')}`;
    } else if (tipo.startsWith('usuario:')) {
      return 'Usuario específico';
    } else if (tipo === 'todos') {
      return 'Todos los usuarios';
    } else {
      // Si no sigue el formato esperado, devolver el valor tal cual
      return tipo;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'historial':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Historial de Notificaciones</h3>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No hay notificaciones en el historial</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mensaje</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Destinatarios</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notificaciones.map((notificacion) => (
                    <tr key={notificacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDate(notificacion.fecha_creacion)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{notificacion.titulo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{notificacion.mensaje}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{getTipoNotificacion(notificacion.tipo)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${notificacion.enviada_push ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                    {notificacion.enviada_push ? 'Enviada' : 'No enviada'}
                    </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                    onClick={() => deleteNotificacion(notificacion.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ml-2"
                    title="Eliminar"
                    >
                    <FiTrash2 />
                    </button>
                    </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      
      case 'programadas':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Notificaciones Programadas</h3>
              <button
                onClick={openProgramarModal}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiClock /> Programar Notificación
              </button>
            </div>
            
            {/* Aquí iría la lista de notificaciones programadas */}
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Próximamente: Lista de notificaciones programadas</p>
            </div>
          </div>
        );
      
      case 'configuracion':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-6">Configuración de Notificaciones</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Umbral de Asistencia</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Porcentaje mínimo de asistencia para enviar alertas a directores
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">{umbralAsistencia}%</span>
                  <button
                    onClick={openConfigModal}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors text-sm"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <LayoutAdmin>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestión de Notificaciones</h2>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FiSend /> Enviar Notificación
        </button>
      </div>

      {/* Tabs de navegación */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('historial')}
          className={`py-3 px-4 flex items-center gap-2 ${activeTab === 'historial' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
        >
          <FiList /> Historial
        </button>
        <button
          onClick={() => setActiveTab('programadas')}
          className={`py-3 px-4 flex items-center gap-2 ${activeTab === 'programadas' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
        >
          <FiClock /> Programadas
        </button>
        <button
          onClick={() => setActiveTab('configuracion')}
          className={`py-3 px-4 flex items-center gap-2 ${activeTab === 'configuracion' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
        >
          <FiSettings /> Configuración
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      {renderTabContent()}

      {/* Modal para enviar notificación */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Enviar Notificación</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de Notificación *
                    </label>
                    <select
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      required
                    >
                      <option value="anuncio">Anuncio Escolar</option>
                      <option value="emergencia">Alerta de Emergencia</option>
                      <option value="festivo">Recordatorio Festivo</option>
                      <option value="mantenimiento">Mantenimiento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Destinatarios
                    </label>
                    <select
                      name="rol"
                      value={formData.rol}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    >
                      {roles.map(rol => (
                        <option key={rol.id} value={rol.id === 'todos' ? '' : rol.id}>
                          {rol.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Título *
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mensaje *
                    </label>
                    <textarea
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      rows="3"
                      required
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL de destino
                    </label>
                    <input
                      type="text"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      placeholder="/"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Enviar Notificación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para programar notificación */}
      {programarModalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Programar Notificación</h3>
              <form onSubmit={handleProgramarSubmit}>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de Notificación *
                    </label>
                    <select
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      required
                    >
                      <option value="anuncio">Anuncio Escolar</option>
                      <option value="emergencia">Alerta de Emergencia</option>
                      <option value="festivo">Recordatorio Festivo</option>
                      <option value="mantenimiento">Mantenimiento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Destinatarios
                    </label>
                    <select
                      name="rol"
                      value={formData.rol}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    >
                      {roles.map(rol => (
                        <option key={rol.id} value={rol.id === 'todos' ? '' : rol.id}>
                          {rol.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Título *
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mensaje *
                    </label>
                    <textarea
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      rows="3"
                      required
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL de destino
                    </label>
                    <input
                      type="text"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      placeholder="/"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha programada *
                      </label>
                      <input
                        type="date"
                        name="fecha_programada"
                        value={formData.fecha_programada}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hora programada *
                      </label>
                      <input
                        type="time"
                        name="hora_programada"
                        value={formData.hora_programada}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeProgramarModal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Programar Notificación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para configuración */}
      {configModalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Configurar Umbral de Asistencia</h3>
              <form onSubmit={handleConfigSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Porcentaje mínimo de asistencia
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={umbralAsistencia}
                    onChange={(e) => setUmbralAsistencia(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeConfigModal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </LayoutAdmin>
  );
}