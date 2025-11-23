import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { obtenerDatosAlumnoPorLU, obtenerDatosAlumnoPorFecha } from './consultas-bd.js';
import { ResultadoTitulo, Alumno } from "./tipos/index.js";
import { ERRORES } from "./constantes/errores.js";



export async function generarTituloPorFecha(fecha: string, salida: string){
   try {
        const resultados: ResultadoTitulo[] = [];
        const alumnos = await obtenerDatosAlumnoPorFecha(fecha);
        for (const alumno of alumnos) {
            const resultadoTitulo = await generarTitulo(alumno, salida)
            resultados.push(resultadoTitulo)
        }
        return resultados
   } catch (error) {
        // Si ejecuta esto no hay alumnos egresados en esa fecha o problema al consultar base de datos
        throw error;
   }
}

export async function generarTituloPorLU(LU:string, salida:string) {
    try {
        const alumno = await obtenerDatosAlumnoPorLU(LU)
        const resultados = await generarTitulo(alumno, salida);
        return resultados
        
    } catch (error) {
        // Si ejecuta esto no hay alumno con ese LU o problema al consultar base de datos
        throw error;
    }
    
}

export async function generarTitulo(alumno: Alumno, carpetaSalida: string) {
    let resultadoTitulo: ResultadoTitulo = {lu: alumno.lu, archivo: null, error: null}

    // Verificar que el alumno esté egresado
    if (!alumno.egreso) {
        resultadoTitulo.error = ERRORES.ALUMNO_NO_EGRESADO
        return resultadoTitulo
    }
    try {
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

        // Sanitizar LU. Evito el / del LU y lo cambio por -
        const sanitizedLU = alumno.lu.replace('/', '-');

        // Ruta completa del archivo a guardar
        const nombreArchivo = `titulo_${sanitizedLU}.html`
        const filePath = path.join(__dirname, '..', carpetaSalida, nombreArchivo);
        
        // Guardar el HTML
        await fs.writeFile(filePath, html);
        resultadoTitulo.archivo = path.join(carpetaSalida, nombreArchivo);

        return resultadoTitulo

    } catch (error) {
        resultadoTitulo.error = ERRORES.FALLA_AL_GENERAR_CERTIFICADO
        return resultadoTitulo
    }
    
    
}

