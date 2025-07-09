// src/pages/director/anuncios.js
import Layout from '@/components/Layout';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';

export default function GestionAnuncios() {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnuncio, setEditingAnuncio] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    imagen_url: '',
    url_destino: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: true
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAnuncios();
  }, []);

  const fetchAnuncios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('anuncios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar anuncios:', error);
    } else {
      setAnuncios(data || []);
    }
    setLoading(false);
  };

  const openModal = (anuncio = null) => {
    if (anuncio) {
      // Editar anuncio existente
      setEditingAnuncio(anuncio);
      setFormData({
        titulo: anuncio.titulo,
        descripcion: anuncio.descripcion || '',
        imagen_url: anuncio.imagen_url,
        url_destino: anuncio.url_destino || '',
        fecha_inicio: new Date(anuncio.fecha_inicio).toISOString().split('T')[0],
        fecha_fin: new Date(anuncio.fecha_fin).toISOString().split('T')[0],
        activo: anuncio.activo
      });
      setPreviewUrl(anuncio.imagen_url);
    } else {
      // Nuevo anuncio
      setEditingAnuncio(null);
      setFormData({
        titulo: '',
        descripcion: '',
        imagen_url: '',
        url_destino: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activo: true
      });
      setPreviewUrl('');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingAnuncio(null);
    setFormData({
      titulo: '',
      descripcion: '',
      imagen_url: '',
      url_destino: '',
      fecha_inicio: '',
      fecha_fin: '',
      activo: true
    });
    setPreviewUrl('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Crear una URL para previsualización
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Subir archivo a Supabase Storage
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `anuncios/${fileName}`;

    const { data, error } = await supabase.storage
      .from('public')
      .upload(filePath, file);

    if (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen. Inténtalo de nuevo.');
    } else {
      const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(filePath);
      setFormData({
        ...formData,
        imagen_url: publicUrl
      });
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.imagen_url || !formData.fecha_inicio || !formData.fecha_fin) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      if (editingAnuncio) {
        // Actualizar anuncio existente
        const { error } = await supabase
          .from('anuncios')
          .update({
            titulo: formData.titulo,
            descripcion: formData.descripcion,
            imagen_url: formData.imagen_url,
            url_destino: formData.url_destino,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            activo: formData.activo,
            updated_at: new Date()
          })
          .eq('id', editingAnuncio.id);

        if (error) throw error;
      } else {
        // Crear nuevo anuncio
        const { error } = await supabase
          .from('anuncios')
          .insert([
            {
              titulo: formData.titulo,
              descripcion: formData.descripcion,
              imagen_url: formData.imagen_url,
              url_destino: formData.url_destino,
              fecha_inicio: formData.fecha_inicio,
              fecha_fin: formData.fecha_fin,
              activo: formData.activo
            }
          ]);

        if (error) throw error;
      }

      // Recargar anuncios y cerrar modal
      fetchAnuncios();
      closeModal();
    } catch (error) {
      console.error('Error al guardar anuncio:', error);
      alert('Error al guardar el anuncio. Inténtalo de nuevo.');
    }
  };

  const toggleAnuncioStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('anuncios')
        .update({ activo: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAnuncios();
    } catch (error) {
      console.error('Error al cambiar estado del anuncio:', error);
      alert('Error al cambiar el estado del anuncio. Inténtalo de nuevo.');
    }
  };

  const deleteAnuncio = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este anuncio?')) return;

    try {
      const { error } = await supabase
        .from('anuncios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAnuncios();
    } catch (error) {
      console.error('Error al eliminar anuncio:', error);
      alert('Error al eliminar el anuncio. Inténtalo de nuevo.');
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestión de Anuncios</h2>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FiPlus /> Nuevo Anuncio
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : anuncios.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay anuncios disponibles</p>
          <button
            onClick={() => openModal()}
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FiPlus /> Crear primer anuncio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {anuncios.map((anuncio) => (
            <div key={anuncio.id} className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
              <div className="relative h-40 w-full">
                <Image
                  src={anuncio.imagen_url}
                  alt={anuncio.titulo}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-semibold">{anuncio.titulo}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {anuncio.descripcion || 'Sin descripción'}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>Desde: {new Date(anuncio.fecha_inicio).toLocaleDateString()}</span>
                  <span>Hasta: {new Date(anuncio.fecha_fin).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${anuncio.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {anuncio.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAnuncioStatus(anuncio.id, anuncio.activo)}
                      className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      title={anuncio.activo ? 'Desactivar' : 'Activar'}
                    >
                      {anuncio.activo ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <button
                      onClick={() => openModal(anuncio)}
                      className="p-2 text-gray-600 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400"
                      title="Editar"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => deleteAnuncio(anuncio.id)}
                      className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      title="Eliminar"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear/editar anuncios */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingAnuncio ? 'Editar Anuncio' : 'Nuevo Anuncio'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      rows="2"
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL de destino
                    </label>
                    <input
                      type="url"
                      name="url_destino"
                      value={formData.url_destino}
                      onChange={handleInputChange}
                      placeholder="https://ejemplo.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de inicio *
                    </label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={formData.fecha_inicio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de fin *
                    </label>
                    <input
                      type="date"
                      name="fecha_fin"
                      value={formData.fecha_fin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      name="activo"
                      id="activo"
                      checked={formData.activo}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="activo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Anuncio activo
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Imagen *
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        disabled={uploading}
                      >
                        {uploading ? 'Subiendo...' : 'Seleccionar imagen'}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {previewUrl ? 'Imagen seleccionada' : 'Ninguna imagen seleccionada'}
                      </span>
                    </div>
                    {previewUrl && (
                      <div className="mt-4 relative h-40 w-full rounded-lg overflow-hidden">
                        <Image
                          src={previewUrl}
                          alt="Vista previa"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
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
                    disabled={uploading}
                  >
                    {editingAnuncio ? 'Guardar cambios' : 'Crear anuncio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}