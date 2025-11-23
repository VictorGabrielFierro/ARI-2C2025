import path from "path";
import { stdin as input, stdout as output } from "node:process";
import { validarCSV } from '../validaciones.js';
import { cargarCSV } from '../modificaciones-bd.js';
import { carpetaDelArchivoActual } from '../utils.js';
import readline from "node:readline/promises";

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
        console.log('Cargando CSV. Por favor espere.')
        await cargarCSV(ruta);
        console.log('CSV cargado con éxito.');
    } catch(err:any){
        console.log('Ocurrió un error al cargar el CSV:', err.message);
    }
}

export { iniciarModoCarga, cargarCSV };