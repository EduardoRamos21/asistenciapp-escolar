import { parse } from 'url';
import next from 'next';
import 'dotenv/config'; // Cargar variables de entorno

// Determinar si estamos en desarrollo o producción
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Esta función será ejecutada por Vercel como una función serverless
export default async function serverlessHandler(req, res) {
  try {
    // Asegurarse de que la app de Next.js esté preparada
    if (!app.prepared) {
      await app.prepare();
    }
    
    // Parsear la URL y manejar la solicitud
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.statusCode = 500;
    res.end('Error interno del servidor');
  }
}