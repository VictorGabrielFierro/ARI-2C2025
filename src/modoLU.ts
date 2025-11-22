import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { obtenerDatosAlumnoPorLU } from './obtener-datos-alumno-por-LU.js';
import { generarTitulo } from './imprimir-titulo.js';

function validarLU(input: string): boolean {
    const regex = /^[1-9][0-9]{0,3}\/[0-9]{2}$/;

    return regex.test(input);
}

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
    const alumno = await obtenerDatosAlumnoPorLU(LU)
    if(alumno != null){
        await generarTitulo(alumno);
    }
}

export { iniciarModoLU };