import { useState } from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Crear Nuevo Maestro</h3>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">
              Nombre del Maestro
            </label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ejemplo: Juan Pérez"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="materia">
              Materia Principal (opcional)
            </label>
            <input
              type="text"
              id="materia"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ejemplo: Matemáticas"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}