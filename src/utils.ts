import path from 'path';
import { fileURLToPath } from 'url';

export function carpetaDelArchivoActual(){
    // Busco la ruta del archivo actual
    const __filename = fileURLToPath(import.meta.url);
    // Busco la carpeta del archivo actual
    const __dirname = path.dirname(__filename);
    return __dirname
}