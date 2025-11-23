import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { generarTituloPorLU } from '../certificados.js';
import { validarLU } from "../validaciones.js";
import { carpetaDelArchivoActual } from "../utils.js";
import path from 'path';

async function solicitarLU(){
    const rl = readline.createInterface({ input, output });
    let LUValido: string | null = null;

    while (!LUValido) {
        let LU = (await rl.question("Ingrese LU: ")).trim();
        if(!validarLU(LU)){
            console.log('El LU ingresado no es valido. Por favor intente de nuevo.')
        } else{
            LUValido = LU;
        }
    }
    rl.close();
    return LUValido
}

async function iniciarModoLU() {
    console.log('Usted a ingresado al modo LU');
    const LU = await solicitarLU();

    // Ruta del archivo a guardar
    const __dirname = carpetaDelArchivoActual()
    const salida = path.join(__dirname, '..', 'certificados',);
    
    generarTituloPorLU(LU, salida);
}

export { iniciarModoLU, generarTituloPorLU };