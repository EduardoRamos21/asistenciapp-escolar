import Layout from '@/components/Layout'

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import useAsignaciones from '@/hooks/useAsignaciones';
import useMaterias from '@/hooks/useMaterias'; // Añade esta importación
import useMaestros from '@/hooks/useMaestros'; // También falta esta importación
import ModalAlumno from '@/components/ModalAlumno';
import useAlumnos from '@/hooks/useAlumnos';

export default function VistaGrupoDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const { asignaciones, loading, error, crearAsignacion, editarAsignacion } = useAsignaciones(id);
  const { materias, loading: loadingMaterias, crearMateria, editarMateria, eliminarMateria } = useMaterias();
  const { maestros, loading: loadingMaestros } = useMaestros();
  const { alumnos, loading: loadingAlumnos, crearAlumno } = useAlumnos(id); // Asegúrate de que esta línea esté aquí
  
  const [showModal, setShowModal] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [showModalAlumno, setShowModalAlumno] = useState(false); // Asegúrate de que esta línea esté aquí
  const [usuario, setUsuario] = useState(null);
  const [fecha, setFecha] = useState('');
  const [grupo, setGrupo] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [materiaEditar, setMateriaEditar] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [materiaEliminar, setMateriaEliminar] = useState(null);
  const [asignacionEditar, setAsignacionEditar] = useState(null);
  const [showEditarHorarioModal, setShowEditarHorarioModal] = useState(false);

  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('usuarios')
          .select('nombre, img')
          .eq('id', user.id)
          .single();
        setUsuario(data);
      }
    };

    const obtenerFecha = () => {
      const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
      setFecha(new Date().toLocaleDateString('es-ES', opciones));
    };

    const obtenerGrupo = async () => {
      if (id) {
        const { data, error } = await supabase
          .from('grupos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (!error && data) {
          setGrupo(data);
        }
      }
    };

    obtenerUsuario();
    obtenerFecha();
    obtenerGrupo();
  }, [id]);

  const handleSaveMateria = async (nuevaMateria) => {
    try {
      if (nuevaMateria.modoEdicion) {
        // Editar materia existente
        const resultado = await editarMateria(nuevaMateria.id, { nombre: nuevaMateria.nombre });
        
        if (resultado.success) {
          setMensajeExito('Materia actualizada correctamente');
          setTimeout(() => setMensajeExito(''), 3000);
        } else {
          throw new Error(resultado.error);
        }
      } else {
        // Crear nueva materia usando el hook useMaterias
        const resultado = await crearMateria({ nombre: nuevaMateria.nombre });
        
        if (resultado.success) {
          setMensajeExito('Materia creada correctamente');
          setTimeout(() => setMensajeExito(''), 3000);
        } else {
          throw new Error(resultado.error);
        }
      }
    } catch (error) {
      console.error('Error al gestionar materia:', error);
      setMensajeError(`Error: ${error.message}`);
      setTimeout(() => setMensajeError(''), 3000);
    }
  };

  const handleEditarMateria = (materia) => {
    setMateriaEditar(materia);
    setShowModal(true);
  };

  const handleEliminarMateria = async () => {
    if (!materiaEliminar) return;
    
    try {
      const resultado = await eliminarMateria(materiaEliminar.id);
      
      if (resultado.success) {
        setMensajeExito('Materia eliminada correctamente');
        setTimeout(() => setMensajeExito(''), 3000);
      } else {
        throw new Error(resultado.error);
      }
    } catch (error) {
      console.error('Error al eliminar materia:', error);
      setMensajeError(`Error: ${error.message}`);
      setTimeout(() => setMensajeError(''), 3000);
    } finally {
      setShowConfirmDelete(false);
      setMateriaEliminar(null);
    }
  };

  const handleConfirmDelete = (materia) => {
    setMateriaEliminar(materia);
    setShowConfirmDelete(true);
  };

  const handleAsignarProfesor = async ({ materia, profesor }) => {
    try {
      // Buscar IDs de materia y profesor
      const materiaSeleccionada = materias.find(m => m.nombre === materia);
      const maestroSeleccionado = maestros.find(m => m.nombre === profesor);

      if (!materiaSeleccionada || !maestroSeleccionado) {
        throw new Error('Materia o profesor no encontrado');
      }

      // Crear la asignación
      const resultado = await crearAsignacion({
        grupoId: id,
        materiaId: materiaSeleccionada.id,
        maestroId: maestroSeleccionado.id,
        horario: '08:00'
      });

      if (resultado.success) {
        setMensajeExito('Profesor asignado correctamente');
        setTimeout(() => setMensajeExito(''), 3000);
      } else {
        throw new Error(resultado.error);
      }
    } catch (error) {
      console.error('Error al asignar profesor:', error);
      setMensajeError(`Error al asignar profesor: ${error.message}`);
      setTimeout(() => setMensajeError(''), 3000);
    }
  };

  // Añade esta función para manejar la creación de alumnos
const handleSaveAlumno = async (nuevoAlumno) => {
  try {
    const resultado = await crearAlumno({
      nombre: nuevoAlumno.nombre,
      email: nuevoAlumno.email,
      grupoId: id
    });
    
    if (resultado.success) {
      setMensajeExito(resultado.message || 'Alumno agregado correctamente');
      setTimeout(() => setMensajeExito(''), 3000);
      setShowModalAlumno(false);
    } else {
      throw new Error(resultado.error);
    }
  } catch (error) {
    console.error('Error al agregar alumno:', error);
    setMensajeError(`Error: ${error.message}`);
    setTimeout(() => setMensajeError(''), 3000);
  }
};
// Dentro del componente VistaGrupoDetalle, antes del return o junto a las otras funciones

// Añade esta función para manejar la edición del horario
const handleEditarHorario = (asignacion) => {
  setAsignacionEditar(asignacion);
  setShowEditarHorarioModal(true);
};

const handleSaveHorario = async (nuevoHorario) => {
  try {
    if (!asignacionEditar) return;
    
    const resultado = await editarAsignacion(asignacionEditar.id, {
      horario: nuevoHorario
    });
    
    if (resultado.success) {
      setMensajeExito('Horario actualizado correctamente');
      setTimeout(() => setMensajeExito(''), 3000);
    } else {
      throw new Error(resultado.error);
    }
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    setMensajeError(`Error: ${error.message}`);
    setTimeout(() => setMensajeError(''), 3000);
  } finally {
    setShowEditarHorarioModal(false);
    setAsignacionEditar(null);
  }
};





  return (
    <Layout>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{fecha}</h2>
        {usuario && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold">{usuario.nombre}</p>
              <p className="text-sm text-gray-500">Director</p>
            </div>
            <Image 
              src={usuario.img || "/perfil.jpg"} 
              alt="perfil" 
              width={40} 
              height={40} 
              className="rounded-full" 
            />
          </div>
        )}
      </div>

      {/* Mensajes de éxito/error */}
      {mensajeExito && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {mensajeExito}
        </div>
      )}
      {mensajeError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {mensajeError}
        </div>
      )}

      <h3 className="text-2xl font-bold mb-6">
        {grupo ? `GRUPO ${grupo.nombre}` : `Cargando grupo...`}
      </h3>

      {/* Tabla de materias */}
      {loading ? (
        <p>Cargando asignaciones...</p>
      ) : error ? (
        <p className="text-red-500">Error al cargar asignaciones: {error}</p>
      ) : (
        <div className="border border-black rounded-xl p-4 mb-6">
          <div className="grid grid-cols-4 font-bold border-b pb-2 mb-2">
            <span>Materia</span>
            <span>Profesor</span>
            <span>Horario</span>
            <span>Acciones</span>
          </div>

          {asignaciones.length === 0 ? (
            <p className="py-4 text-center text-gray-500">No hay materias asignadas a este grupo</p>
          ) : (
            asignaciones.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 items-center py-2 border-t text-sm">
                <span>{item.materiaNombre}</span>
                <span>{item.maestroNombre}</span>
                <span>
                  {item.horario}
                  <button 
                    onClick={() => handleEditarHorario(item)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    title="Editar horario"
                  >
                    ⏱️
                  </button>
                </span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditarMateria({ id: item.materiaId, nombre: item.materiaNombre })}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleConfirmDelete({ id: item.materiaId, nombre: item.materiaNombre })}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-6">
        <button
          onClick={() => {
            setMateriaEditar(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 text-lg font-semibold hover:text-purple-600"
        >
          ➕ Añadir materia
        </button>

        <button
          onClick={() => setShowAsignarModal(true)}
          className="flex items-center gap-2 text-lg font-semibold hover:text-purple-600"
        >
          ➕ Asignar profesor
        </button>
      </div>

    

      {/* Modal para añadir/editar materia */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {materiaEditar ? 'Editar Materia' : 'Añadir Nueva Materia'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const nombre = e.target.nombre.value;
              if (!nombre.trim()) return;
              
              handleSaveMateria({
                id: materiaEditar?.id,
                nombre,
                modoEdicion: !!materiaEditar
              });
              setShowModal(false);
            }}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">
                  Nombre de la Materia
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  defaultValue={materiaEditar?.nombre || ''}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {materiaEditar ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sección de Alumnos */}
<div className="bg-white rounded-xl shadow-md p-6 mb-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold">Alumnos</h2>
    <button
      onClick={() => setShowModalAlumno(true)}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
    >
      <span>Agregar Alumno</span>
    </button>
  </div>
  
  {loadingAlumnos ? (
    <p className="text-center py-4">Cargando alumnos...</p>
  ) : alumnos.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-left">Nombre</th>
            <th className="py-3 px-6 text-left">Email</th>
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm">
          {alumnos.map((alumno) => (
            <tr key={alumno.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="py-3 px-6 text-left">{alumno.nombre}</td>
              <td className="py-3 px-6 text-left">{alumno.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="text-center py-4 text-gray-500">No hay alumnos en este grupo</p>
  )}
</div>

{/* Modal para añadir alumno */}
<ModalAlumno
  visible={showModalAlumno}
  onClose={() => setShowModalAlumno(false)}
  onSave={handleSaveAlumno}
  grupoId={id}
/>

      {/* Modal para asignar profesor */}
      {showAsignarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Asignar Profesor a Materia</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const materia = e.target.materia.value;
              const profesor = e.target.profesor.value;
              
              if (!materia || !profesor) return;
              
              handleAsignarProfesor({ materia, profesor });
              setShowAsignarModal(false);
            }}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="materia">
                  Materia
                </label>
                <select
                  id="materia"
                  name="materia"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Selecciona una materia</option>
                  {materias.map((materia) => (
                    <option key={materia.id} value={materia.nombre}>
                      {materia.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="profesor">
                  Profesor
                </label>
                <select
                  id="profesor"
                  name="profesor"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Selecciona un profesor</option>
                  {maestros.map((maestro) => (
                    <option key={maestro.id} value={maestro.nombre}>
                      {maestro.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAsignarModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Confirmar eliminación</h2>
            <p className="mb-6">¿Estás seguro de que deseas eliminar la materia {materiaEliminar?.nombre}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowConfirmDelete(false);
                  setMateriaEliminar(null);
                }}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarMateria}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar horario */}
        {showEditarHorarioModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
              <h2 className="text-xl font-semibold mb-4">
                Editar Horario - {asignacionEditar?.materiaNombre}
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const horario = e.target.horario.value;
                if (!horario) return;
                
                handleSaveHorario(horario);
              }}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="horario">
                    Horario
                  </label>
                  <input
                    type="time"
                    id="horario"
                    name="horario"
                    defaultValue={asignacionEditar?.horario || '08:00'}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditarHorarioModal(false);
                      setAsignacionEditar(null);
                    }}
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}    
    </Layout>
  );
}




