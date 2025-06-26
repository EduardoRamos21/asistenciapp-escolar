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
import { HiUserGroup, HiOutlineAcademicCap, HiOutlineClock } from 'react-icons/hi';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';

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
      <div className="p-6 max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-emerald-800 dark:text-emerald-300">{fecha}</h2>
          {usuario && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{usuario.nombre}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Director</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-green-500 rounded-full opacity-70 blur-[1px]"></div>
                <Image 
                  src={usuario.img || "/perfil.jpg"} 
                  alt="perfil" 
                  width={45} 
                  height={45} 
                  className="rounded-full border-2 border-white dark:border-gray-700 relative z-10 object-cover" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Mensajes de éxito/error */}
        {mensajeExito && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 px-6 py-4 rounded-lg mb-6 shadow-sm transition-all duration-300 animate-fadeIn flex items-center">
            <div className="mr-3 text-green-500 dark:text-green-300 text-xl">✓</div>
            <p>{mensajeExito}</p>
          </div>
        )}
        {mensajeError && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg mb-6 shadow-sm transition-all duration-300 animate-fadeIn flex items-center">
            <div className="mr-3 text-red-500 dark:text-red-300 text-xl">⚠</div>
            <p>{mensajeError}</p>
          </div>
        )}

        {/* Título del grupo con icono */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-lg text-emerald-700 dark:text-emerald-300">
            <HiUserGroup size={28} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            {grupo ? `GRUPO ${grupo.nombre}` : `Cargando grupo...`}
            {grupo?.grado && (
              <span className="ml-2 text-sm bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 py-1 px-3 rounded-full">
                {grupo.grado}
              </span>
            )}
          </h3>
        </div>

        {/* Tabla de materias */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-700 dark:text-blue-300">
              <HiOutlineAcademicCap size={20} />
            </div>
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">Materias y Profesores</h4>
          </div>
          


{loading ? (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
  </div>
) : error ? (
  <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
    <p>Error al cargar asignaciones: {error}</p>
  </div>
) : (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg mb-6">
    {/* Encabezado de la tabla */}
    <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 px-6 overflow-x-auto">
      <div className="grid grid-cols-4 font-medium min-w-[600px]">
        <span>Materia</span>
        <span>Profesor</span>
        <span>Horario</span>
        <span>Acciones</span>
      </div>
    </div>

    {asignaciones.length === 0 ? (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <div className="mb-4 text-5xl opacity-30">📚</div>
        <p>No hay materias asignadas a este grupo</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <div className="divide-y divide-gray-100 dark:divide-gray-700 min-w-[600px]">
          {asignaciones.map((item, idx) => (
            <div key={idx} className="grid grid-cols-4 items-center py-4 px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
              <span className="font-medium text-gray-800 dark:text-white">{item.materiaNombre}</span>
              <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <FaChalkboardTeacher className="text-blue-500" />
                {item.maestroNombre}
              </span>
              <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                {item.horario}
                <button 
                  onClick={() => handleEditarHorario(item)}
                  className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                  title="Editar horario"
                >
                  <HiOutlineClock size={18} />
                </button>
              </span>
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleEditarMateria({ id: item.materiaId, nombre: item.materiaNombre })}
                  className="text-blue-500 hover:text-blue-700 transition-colors p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  title="Editar materia"
                >
                  <FiEdit2 size={16} />
                </button>
                <button 
                  onClick={() => handleConfirmDelete({ id: item.materiaId, nombre: item.materiaNombre })}
                  className="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                  title="Eliminar materia"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}


          {/* Acciones para materias */}
          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={() => {
                setMateriaEditar(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 text-base font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors duration-200 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg group hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            >
              <FiPlus className="text-emerald-500" size={18} /> Añadir materia
            </button>

            <button
              onClick={() => setShowAsignarModal(true)}
              className="flex items-center gap-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg group hover:bg-blue-100 dark:hover:bg-blue-900/40"
            >
              <FaChalkboardTeacher className="text-blue-500" size={18} /> Asignar profesor
            </button>
          </div>
        </div>

        {/* Sección de Alumnos */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg text-purple-700 dark:text-purple-300">
              <FaUserGraduate size={20} />
            </div>
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white">Alumnos</h4>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
            <div className="flex justify-between items-center bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-6">
              <h2 className="font-medium">Lista de Alumnos</h2>
              <button
                onClick={() => setShowModalAlumno(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-sm"
              >
                <FiPlus size={16} /> Agregar Alumno
              </button>
            </div>
            
            {loadingAlumnos ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : alumnos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase">
                      <th className="py-3 px-6 text-left font-medium">Nombre</th>
                      <th className="py-3 px-6 text-left font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {alumnos.map((alumno) => (
                      <tr key={alumno.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-3 px-6 text-left text-gray-800 dark:text-gray-200">{alumno.nombre}</td>
                        <td className="py-3 px-6 text-left text-gray-600 dark:text-gray-400">{alumno.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="mb-4 text-5xl opacity-30">👨‍🎓</div>
                <p>No hay alumnos en este grupo</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal para añadir alumno */}
        <ModalAlumno
          visible={showModalAlumno}
          onClose={() => setShowModalAlumno(false)}
          onSave={handleSaveAlumno}
          grupoId={id}
        />

        {/* Modal para añadir/editar materia */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg text-emerald-700 dark:text-emerald-300">
                  <HiOutlineAcademicCap size={20} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {materiaEditar ? 'Editar Materia' : 'Añadir Nueva Materia'}
                </h2>
              </div>
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
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="nombre">
                    Nombre de la Materia
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    defaultValue={materiaEditar?.nombre || ''}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium shadow-sm hover:shadow transition-all duration-200"
                  >
                    {materiaEditar ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para asignar profesor */}
        {showAsignarModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-700 dark:text-blue-300">
                  <FaChalkboardTeacher size={20} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Asignar Profesor a Materia</h2>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const materia = e.target.materia.value;
                const profesor = e.target.profesor.value;
                
                if (!materia || !profesor) return;
                
                handleAsignarProfesor({ materia, profesor });
                setShowAsignarModal(false);
              }}>
                <div className="mb-5">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="materia">
                    Materia
                  </label>
                  <select
                    id="materia"
                    name="materia"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
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
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="profesor">
                    Profesor
                  </label>
                  <select
                    id="profesor"
                    name="profesor"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
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
                    className="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-sm hover:shadow transition-all duration-200"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg text-red-700 dark:text-red-300">
                  <FiTrash2 size={20} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Confirmar eliminación</h2>
              </div>
              <p className="mb-6 text-gray-600 dark:text-gray-300">¿Estás seguro de que deseas eliminar la materia <span className="font-semibold text-gray-800 dark:text-white">{materiaEliminar?.nombre}</span>?</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setMateriaEliminar(null);
                  }}
                  className="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarMateria}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium shadow-sm hover:shadow transition-all duration-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar horario */}
        {showEditarHorarioModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-700 dark:text-blue-300">
                  <HiOutlineClock size={20} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Editar Horario - <span className="text-blue-600 dark:text-blue-400">{asignacionEditar?.materiaNombre}</span>
                </h2>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const horario = e.target.horario.value;
                if (!horario) return;
                
                handleSaveHorario(horario);
              }}>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="horario">
                    Horario
                  </label>
                  <input
                    type="time"
                    id="horario"
                    name="horario"
                    defaultValue={asignacionEditar?.horario || '08:00'}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditarHorarioModal(false);
                      setAsignacionEditar(null);
                    }}
                    className="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-sm hover:shadow transition-all duration-200"
                  >
                    Actualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}    
      </div>
    </Layout>
  );
}