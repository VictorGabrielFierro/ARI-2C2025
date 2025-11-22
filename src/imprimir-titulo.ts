import fs from 'fs/promises';
import path from 'path';
import { obtenerDatosAlumno } from './obtener-datos-alumno.js';


export async function generarTitulo(lu: string) {
    try {
    // Obtengo datos del alumno
    const alumno = await obtenerDatosAlumno(lu)
     if (!alumno) {
        console.log(`No se encontró alumno con LU=${lu}`);
        return;
    }

     // Verificar que el alumno esté egresado
    if (!alumno.egreso) {
      console.log(`El alumno con LU=${lu} no está egresado. No se puede generar el certificado.`);
      return;
    }

    // Leo el html
    const plantillaPath = path.join(process.cwd(), 'recursos/plantilla-certificado-titulo.html');
    let html = await fs.readFile(plantillaPath, 'utf8');

    // Reemplazo los datos que obtuve
    html = html.replace(/\[NOMBRE\]/g, alumno.nombres)
                .replace(/\[APELLIDO\]/g, alumno.apellido)
                .replace(/\[TITULO\]/g, alumno.titulo)
                .replace(/\[FECHA\]/g, new Date().toLocaleDateString());

    // Guardo el archivo generado en certificados
    await fs.mkdir('certificados', { recursive: true }); // crea la carpeta si no existe
    const sanitizedLU = lu.replace('/', '-'); // evitar problemas con /
    const filePath = path.join('certificados', `titulo_${sanitizedLU}.html`);
    await fs.writeFile(filePath, html);
    console.log(`Certificado generado: ${filePath}`);
        
    } catch (err) {
        console.error('Error conectando o ejecutando el script:', err);
    } 
}