import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export interface Alumno {
  lu: string;
  apellido: string;
  nombres: string;
  titulo: string;
  titulo_en_tramite: string;
  egreso: string;
}

export async function generarTitulo(alumno: Alumno) {
    // Verificar que el alumno esté egresado
    if (!alumno.egreso) {
      console.log(`El alumno con LU=${alumno.lu} no está egresado. No se puede generar el certificado.`);
      return;
    }
    // Busco la ruta del archivo actual
    const __filename = fileURLToPath(import.meta.url);
    // Busco la carpeta del archivo actual
    const __dirname = path.dirname(__filename);
    // Busco la carpeta padre
    const carpetaPadre = path.join(__dirname, '..');

    // Leo el html
    const plantillaPath = path.join(__dirname, '..', 'recursos', 'plantilla-certificado-titulo.html');
    let html = await fs.readFile(plantillaPath, 'utf8');

    // Reemplazo los datos que obtuve
    html = html.replace(/\[NOMBRE\]/g, alumno.nombres)
                .replace(/\[APELLIDO\]/g, alumno.apellido)
                .replace(/\[TITULO\]/g, alumno.titulo)
                .replace(/\[FECHA\]/g, new Date().toLocaleDateString());

    
    // Guardo el archivo generado en certificados
    const carpetaCertificados = path.join(carpetaPadre, 'certificados');

    // crea la carpeta si no existe
    await fs.mkdir(carpetaCertificados, { recursive: true }); 

    // Sanitizar LU. Evito el / del LU y lo cambio por -
    const sanitizedLU = alumno.lu.replace('/', '-');

    // Ruta completa del archivo a guardar
    const filePath = path.join(carpetaCertificados, `titulo_${sanitizedLU}.html`);
    
    // Guardar el HTML
    await fs.writeFile(filePath, html);

    console.log(`Certificado generado: ${filePath}`);
    
}