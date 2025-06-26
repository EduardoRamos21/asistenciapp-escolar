import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FaUserGraduate } from 'react-icons/fa';

export default function ModalAlumno({ visible, onClose, onSave, grupoId }) {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    // El email se generará automáticamente en el backend
    onSave({ nombre, grupoId });
    setNombre('');
    setError('');
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg text-purple-700 dark:text-purple-300">
              <FaUserGraduate size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Agregar Alumno</h2>
          </div>
          <button 
            onClick={() => {
              setNombre('');
              setError('');
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6 animate-fadeIn">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="nombre">
              Nombre completo
            </label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              placeholder="Nombre del alumno"
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setNombre('');
                setError('');
                onClose();
              }}
              className="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-sm hover:shadow transition-all duration-200"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}