import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { generarTituloPorLU } from '../certificados.js';
import { validarLU } from "../validaciones.js";
import { ERRORES } from "../constantes/errores.js";
import { EXITOS } from "../constantes/exitos.js";

async function solicitarLU(): Promise<string> {
    const rl = readline.createInterface({ input, output });
    let luValido: string | null = null;

    while (!luValido) {
        let LU = (await rl.question("Ingrese LU: ")).trim();
        if(!validarLU(LU)){
            console.log(ERRORES.LU_INVALIDA)
        } else{
            luValido = LU;
        }
    }
    rl.close();
    return luValido

}

async function iniciarModoLU() {
    console.log('Usted a ingresado al modo LU');
    const LU = await solicitarLU();
    const salida = '/certificados';
    try {
        const titulo = await generarTituloPorLU(LU, salida);
        console.log(`${EXITOS.CERTIFICADO_GENERADO_CORRECTAMENTE} LU: ${titulo.lu} Archivo: ${titulo.archivo}`)
        return
    } catch (err:any) {
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.ALUMNO_NO_ENCONTRADO) {
            console.log(`${ERRORES.CERTIFICADO_NO_GENERADO} LU: ${LU}. Descripcion de error: ${mensaje}`)
            return
        } else {
            console.log(`${ERRORES.INTERNO}`)
            return
        }
    }
    
}

export { iniciarModoLU, generarTituloPorLU };