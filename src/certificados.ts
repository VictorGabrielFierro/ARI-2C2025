import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { obtenerDatosAlumnoPorLU, obtenerDatosAlumnoPorFecha } from './consultas-bd.js';

export async function generarTituloPorFecha(fecha: string, salida: string){
    const alumnos = await obtenerDatosAlumnoPorFecha(fecha);
    if(alumnos != null){
        for (const alumno of alumnos) {
            generarTitulo(alumno, salida)
        }
    }
}

export async function generarTituloPorLU(LU:string, salida:string) {
    const alumno = await obtenerDatosAlumnoPorLU(LU)
    if(alumno != null){
        await generarTitulo(alumno, salida);
    }
}

interface Alumno {
  lu: string;
  apellido: string;
  nombres: string;
  titulo: string;
  titulo_en_tramite: string;
  egreso: string;
}

export async function generarTitulo(alumno: Alumno, carpetaSalida: string) {
    // Verificar que el alumno esté egresado
    if (!alumno.egreso) {
      console.log(`El alumno con LU=${alumno.lu} no está egresado. No se puede generar el certificado.`);
      return;
    }
    // Busco la ruta del archivo actual
    const __filename = fileURLToPath(import.meta.url);
    // Busco la carpeta del archivo actual
    const __dirname = path.dirname(__filename);

    // Leo el html
    const plantillaPath = path.join(__dirname, '..', 'recursos', 'plantilla-certificado-titulo.html');
    let html = await fs.readFile(plantillaPath, 'utf8');

    // Reemplazo los datos que obtuve
    html = html.replace(/\[NOMBRE\]/g, alumno.nombres)
                .replace(/\[APELLIDO\]/g, alumno.apellido)
                .replace(/\[TITULO\]/g, alumno.titulo)
                .replace(/\[FECHA\]/g, new Date().toLocaleDateString());

    
    // Guardo el archivo generado en la carpeta solicitada

    // Sanitizar LU. Evito el / del LU y lo cambio por -
    const sanitizedLU = alumno.lu.replace('/', '-');

    // Ruta completa del archivo a guardar
    const filePath = path.join(carpetaSalida, `titulo_${sanitizedLU}.html`);
    
    // Guardar el HTML
    await fs.writeFile(filePath, html);

    console.log(`Certificado generado: ${filePath}`);
    
}

