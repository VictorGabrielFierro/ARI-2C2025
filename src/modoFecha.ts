import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { obtenerDatosAlumnoPorFecha } from "./obtener-datos-alumno-por-fecha.js";
import { generarTitulo } from './imprimir-titulo.js';

export function validarFecha(fecha: string): boolean {
    // Patrón: 4 dígitos año, 2 dígitos mes, 2 dígitos día, separados por guiones
    const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = fecha.match(regex);

    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    // Verificar mes válido
    if (month < 1 || month > 12) return false;

    // Verificar día válido según el mes
    const diasPorMes = [31, (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day < 1 || day > diasPorMes[month - 1]!) return false;

    return true;
}

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

    const alumnos = await obtenerDatosAlumnoPorFecha(fecha);
    if(alumnos != null){
        for (const alumno of alumnos) {
            generarTitulo(alumno)
        }
    }
    
}

export { iniciarModoFecha };