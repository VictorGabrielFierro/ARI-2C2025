import path from "path";
import { stdin as input, stdout as output } from "node:process";
import { validarCSV } from '../validaciones.js';
import { cargarCSV } from '../modificaciones-bd.js';
import { carpetaDelArchivoActual } from '../utils.js';
import readline from "node:readline/promises";
import { ERRORES } from "../constantes/errores.js";
import { EXITOS } from "../constantes/exitos.js";

// Busco carpera actual
const __dirname = carpetaDelArchivoActual();
// Defino la ruta a carpeta certificados
const carpeta_recursos = path.join(__dirname, '..', 'recursos');


async function solicitarRutaAlArchivoCSV(): Promise<string> {
    const rl = readline.createInterface({ input, output });
    try {
        const nombreCSV = (await rl.question("Ingrese el nombre del CSV: ")).trim();
        const ruta = await validarCSV(carpeta_recursos, nombreCSV);
        return ruta
    } catch (error) {
        throw error
    } finally {
        rl.close();
    }
}

async function iniciarModoCarga() {
    console.log('Usted a ingresado al modo CARGA');
    
    try{
        const ruta = await solicitarRutaAlArchivoCSV();
        await cargarCSV(ruta);
        console.log(EXITOS.DATOS_CARGADOS_CORRECTAMENTE);
    } catch(err:any){
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.ARCHIVO_INVALIDO) {
            console.log(ERRORES.ARCHIVO_INVALIDO)
        } else if (mensaje === ERRORES.INTERNO){
            console.log(ERRORES.INTERNO)
        } else {
            console.log(ERRORES.FALLA_AL_CARGAR_DATOS)
        } 
    }
}

export { iniciarModoCarga };