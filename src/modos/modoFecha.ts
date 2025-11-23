import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { generarTituloPorFecha } from '../certificados.js';
import { validarFecha } from "../validaciones.js";
import { ERRORES } from "../constantes/errores.js";
import { EXITOS } from "../constantes/exitos.js";

async function solicitarFecha(): Promise<string> {
    const rl = readline.createInterface({ input, output });
    let fechaValida: string | null = null;

    while (!fechaValida) {
        let fecha = (await rl.question("Ingrese Fecha aaaa-mm-dd: ")).trim();
        if(!validarFecha(fecha)){
            console.log(ERRORES.FECHA_INVALIDA)
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
    const salida = '/certificados'

    try {
        const titulos = await generarTituloPorFecha(fecha, salida);
        for (const titulo of titulos) {
            if (titulo.error == null){
                console.log(`${EXITOS.CERTIFICADO_GENERADO_CORRECTAMENTE} LU: ${titulo.lu} Archivo: ${titulo.archivo}`)
            } else {
                console.log(`${ERRORES.CERTIFICADO_NO_GENERADO} LU: ${titulo.lu}. Descripcion de error: ${titulo.error}`)
            }
        }
    } catch (err:any) {
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.SIN_ALUMNOS_EGRESADOS_EN_FECHA_PROPORCIONADO) {
            console.log(`${ERRORES.CERTIFICADO_NO_GENERADO} Fecha: ${fecha}. Descripcion de error: ${mensaje}`)
        } else {
            console.log(`${ERRORES.INTERNO}`)
        }
    }
}

export { iniciarModoFecha, generarTituloPorFecha };
