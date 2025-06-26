import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';

export default function ModalMaestro({ visible, onClose, onSave }) {
  const [nombre, setNombre] = useState('');
  const [materia, setMateria] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!nombre.trim()) {
      setError('El nombre del maestro es obligatorio');
      return;
    }
    
    // Enviar datos al componente padre
    onSave({
      nombre: nombre.trim(),
      materia: materia.trim()
    });
    
    // Limpiar formulario
    setNombre('');
    setMateria('');
    setError('');
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-700 dark:text-indigo-300">
              <FaChalkboardTeacher size={20} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Crear Nuevo Maestro</h3>
          </div>
          <button 
            onClick={onClose}
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
              Nombre del Maestro
            </label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              placeholder="Ejemplo: Juan Pérez"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="materia">
              Materia Principal (opcional)
            </label>
            <input
              type="text"
              id="materia"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              placeholder="Ejemplo: Matemáticas"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium shadow-sm hover:shadow transition-all duration-200"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}