import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { iniciarModoCarga } from "./modoCarga.js";
import { iniciarModoFecha } from "./modoFecha.js";
import { iniciarModoLU } from "./modoLU.js";

function mostrarModosAlUsuario(){
    console.log('Para modo CARGA ingrese: 1');
    console.log('Para modo FECHA ingrese: 2');
    console.log('Para modo LU    ingrese: 3');
}

async function solicitarSeleccionDeModoAlUsuario(){
    const rl = readline.createInterface({ input, output });
    
    let modoSeleccionado: number | null = null;
    while (modoSeleccionado === null) {
        const modo = await rl.question("Ingrese un modo: ");
        console.log('\n')
        switch (modo) {
        case '1':
            modoSeleccionado = 1;
            console.log('Usted ha seleccionado el modo: CARGA');
            break;
        case '2':
            modoSeleccionado = 2;
            console.log('Usted ha seleccionado el modo: FECHA');
            break;
        case '3':
            modoSeleccionado = 3;
            console.log('Usted ha seleccionado el modo: LU   ');
            break;
        default:
            console.log('El modo seleccionado no existe. Por favor seleccione entre las opciones:');
            mostrarModosAlUsuario();
            break;
        }
    }

    rl.close();
    return modoSeleccionado
}


async function main() {
    console.log('Bienvenido. Para comenzar indique un modo de uso.');
    mostrarModosAlUsuario();

    const modoSeleccionado = await solicitarSeleccionDeModoAlUsuario();
    switch (modoSeleccionado) {
        case 1:
            iniciarModoCarga();
            break;
        case 2:
            iniciarModoFecha(); 
            break;
        case 3:
            iniciarModoLU();
            break;
        default:
            break;
    }
}

main();