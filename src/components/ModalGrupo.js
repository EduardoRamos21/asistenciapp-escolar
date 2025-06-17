import { useState } from 'react';

export default function ModalGrupo({ visible, onClose, onSave }) {
  const [nombre, setNombre] = useState('');
  const [grado, setGrado] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setError('El nombre del grupo es obligatorio');
      return;
    }

    if (!grado.trim()) {
      setError('El grado del grupo es obligatorio');
      return;
    }

    onSave({
      nombre: nombre.trim(),
      grado: grado.trim()
    });

    setNombre('');
    setGrado('');
    setError('');
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Crear Nuevo Grupo</h3>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">
              Nombre del Grupo
            </label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ejemplo: 1A, 2B, 3C"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="grado">
              Grado
            </label>
            <input
              type="text"
              id="grado"
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ejemplo: Segundo"
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
