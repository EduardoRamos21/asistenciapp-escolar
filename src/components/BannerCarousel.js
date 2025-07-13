// src/components/BannerCarousel.js
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function BannerCarousel() {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cargar anuncios desde Supabase
  useEffect(() => {
    // Usar una variable para controlar si el componente está montado
    let isMounted = true;
    
    const fetchAnuncios = async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('anuncios')
        .select('*')
        .eq('activo', true)
        .lte('fecha_inicio', now)
        .gte('fecha_fin', now);
  
      if (error) {
        console.error('Error al cargar anuncios:', error);
      } else if (isMounted) { // Solo actualizar el estado si el componente sigue montado
        console.log('Anuncios cargados:', data);
        setAnuncios(data || []);
      }
      if (isMounted) setLoading(false);
    };
  
    fetchAnuncios();
  
    // Limpiar al desmontar
    return () => {
      isMounted = false;
    };
  }, []);

  // Rotación automática simple cada 5 segundos
  useEffect(() => {
    if (anuncios.length <= 4) return; // No rotar si hay 4 o menos anuncios
    
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        // Calcular el siguiente índice, asegurando que no exceda el número de anuncios
        const nextIndex = prevIndex + 4;
        return nextIndex >= anuncios.length ? 0 : nextIndex;
      });
    }, 10000); // Cambiar cada 10 segundos
  
    return () => clearInterval(interval);
  }, [anuncios.length]);

  // Determinar cuántos anuncios mostrar según el ancho de la pantalla
  const getVisibleAnuncios = () => {
    // Si hay 4 o menos anuncios, mostrarlos todos
    if (anuncios.length <= 4) return anuncios;
    
    // Si hay más de 4, mostrar 4 a la vez, comenzando desde el índice actual
    const endIndex = Math.min(currentIndex + 4, anuncios.length);
    const visibleAnuncios = anuncios.slice(currentIndex, endIndex);
    
    // Si no tenemos 4 completos al final, tomar algunos del principio
    if (visibleAnuncios.length < 4) {
      const remainingCount = 4 - visibleAnuncios.length;
      const remainingAnuncios = anuncios.slice(0, remainingCount);
      return [...visibleAnuncios, ...remainingAnuncios];
    }
    
    return visibleAnuncios;
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-3">
        <div className="flex overflow-x-auto gap-4 w-full max-w-6xl mx-auto pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse h-20 min-w-[250px] flex-shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (anuncios.length === 0) {
    return (
      <div className="w-full px-4 py-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex items-center justify-center h-20 text-gray-500 max-w-6xl mx-auto">
          No hay anuncios disponibles
        </div>
      </div>
    );
  }

  const visibleAnuncios = getVisibleAnuncios();

  return (
    <div className="w-full px-4 md:px-8 py-3"> 
      <div className="max-w-6xl mx-auto">
        <div className="flex overflow-x-auto gap-4 w-full pb-2 scrollbar-hide">
          {visibleAnuncios.map((anuncio) => (
            <div 
              key={anuncio.id} 
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100 dark:border-blue-800 rounded-lg shadow-sm overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.02] h-20 min-w-[250px] flex-shrink-0 lg:flex-shrink lg:min-w-0 lg:w-1/4"
            >
              <a 
                href={anuncio.url_destino || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-full w-full"
              >
                <div className="relative h-full w-1/4">
                  <Image 
                    src={anuncio.imagen_url} 
                    alt={anuncio.titulo} 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div className="p-2 flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-0.5 line-clamp-1">{anuncio.titulo}</h3>
                  <p className="text-[10px] text-gray-700 dark:text-gray-300 line-clamp-1">{anuncio.descripcion}</p>
                </div>
              </a>
            </div>
          ))}
        </div>
        
        {/* Indicadores simples de página */}
        {anuncios.length > 4 && (
          <div className="flex justify-center mt-2 gap-1">
            {Array.from({ length: Math.ceil(anuncios.length / 4) }).map((_, index) => (
              <div 
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === Math.floor(currentIndex / 4) ? 'bg-blue-500 w-3' : 'bg-gray-300 dark:bg-gray-600'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}