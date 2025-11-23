import path from 'path';
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { generarTituloPorFecha } from '../certificados.js';
import { validarFecha } from "../validaciones.js";
import { carpetaDelArchivoActual } from "../utils.js";

async function solicitarFecha(): Promise<string> {
    const rl = readline.createInterface({ input, output });
    let fechaValida: string | null = null;

    while (!fechaValida) {
        let fecha = (await rl.question("Ingrese Fecha aaaa-mm-dd: ")).trim();
        if(!validarFecha(fecha)){
            console.log('La fecha ingresada no es valida. Por favor intente de nuevo.')
        } else{
            fechaValida = fecha;
        }
    }
    rl.close();
    return fechaValida

}

async function iniciarModoFecha() {
    console.log('Usted a ingresado al modo FECHA');
    const fecha = await solicitarFecha();

    // Ruta del archivo a guardar
    const __dirname = carpetaDelArchivoActual()
    const salida = path.join(__dirname, '..', 'certificados',);

    generarTituloPorFecha(fecha, salida)
    
}

export { iniciarModoFecha, generarTituloPorFecha };
