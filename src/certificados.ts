import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { obtenerDatosAlumnoPorLU, obtenerDatosAlumnoPorFecha } from './bd/consultas-alumnos.js';
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
        throw error;
   }
}

export async function generarTituloPorLU(LU:string, salida:string) {
    try {
        const alumno = await obtenerDatosAlumnoPorLU(LU)
        const resultados = await generarTitulo(alumno, salida);
        return resultados
        
    } catch (error) {
        throw error;
    }
    
}

export async function generarTitulo(alumno: Alumno, carpetaSalida: string) {
    let resultadoTitulo: ResultadoTitulo = {lu: alumno.lu, archivo: null, error: null}

    if (!alumno.egreso) {
        resultadoTitulo.error = ERRORES.ALUMNO_NO_EGRESADO
        return resultadoTitulo
    }
    try {
        const outputDir = path.join(process.cwd(), carpetaSalida);
        await fs.mkdir(outputDir, { recursive: true });

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        console.log("filename: " + __filename)
        console.log("dirname: " + __dirname)

        const plantillaPath = path.join(__dirname, '..', 'recursos', 'plantilla-certificado-titulo.html');
        let html = await fs.readFile(plantillaPath, 'utf8');

        console.log("Plantilla leida correctamente")

        // Reemplazo los datos que obtuve
        html = html.replace(/\[NOMBRE\]/g, alumno.nombres)
                    .replace(/\[APELLIDO\]/g, alumno.apellido)
                    .replace(/\[TITULO\]/g, alumno.titulo!)
                    .replace(/\[FECHA\]/g, new Date().toLocaleDateString());

        // Sanitizar LU. Evito el / del LU y lo cambio por -
        const LUsanitizado = alumno.lu.replace('/', '-');

        const nombreArchivo = `titulo_${LUsanitizado}.html`
        const filePath = path.join(__dirname, '..', carpetaSalida, nombreArchivo);
        
        console.log("Generando archivo en: " + filePath)

        await fs.writeFile(filePath, html);
        resultadoTitulo.archivo = path.join(carpetaSalida, nombreArchivo);

        console.log("Archivo generado correctamente: " + resultadoTitulo.archivo)

        return resultadoTitulo

    } catch (error) {
        resultadoTitulo.error = ERRORES.FALLA_AL_GENERAR_CERTIFICADO
        return resultadoTitulo
    }
    
    
}

