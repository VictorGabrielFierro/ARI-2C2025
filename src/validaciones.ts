import path from 'path';
import fs from 'fs/promises';
import { ERRORES } from './constantes/errores.js';

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

export function validarLU(input: string): boolean {
    const regex = /^[1-9][0-9]{0,3}\/[0-9]{2}$/;
    return regex.test(input);
}

export async function validarCSV(carpetaBase: string, nombre: string): Promise<string> {
    // 1. Evitar path traversal y rutas absolutas
    if (nombre.includes('..') || path.isAbsolute(nombre)) {
        throw new Error(ERRORES.ARCHIVO_INVALIDO)
    }

    // 2. Construir ruta absoluta del archivo
    const archivoAbsoluto = path.resolve(path.join(carpetaBase, nombre));

    // 3. Verificar que la ruta final esté dentro de la carpeta base
    const carpetaSegura = path.resolve(carpetaBase);
    if (!archivoAbsoluto.startsWith(carpetaSegura + path.sep)) {
        throw new Error(ERRORES.ARCHIVO_INVALIDO)
    }

    // 4. Verificar extensión .csv
    if (path.extname(nombre).toLowerCase() !== '.csv') {
        throw new Error(ERRORES.ARCHIVO_INVALIDO)
    }

    // 5. Verificar que existe y es un archivo
    try {
        const stats = await fs.stat(archivoAbsoluto);
        if (!stats.isFile()) {
            throw new Error(ERRORES.ARCHIVO_INVALIDO)
        }
    } catch (err) {
        throw new Error(ERRORES.ARCHIVO_INVALIDO)
    }

    // Todo OK
    return archivoAbsoluto;
}

// Validar nombre, apellido, título: puede ser varias palabras separadas por espacios, solo letras
export function validarNombreApellidoTitulo(valor: string | null): boolean {
    if (valor === null) return true; // Permitir nulo
    const titulo = valor.trim();
    if (!titulo) return false; // No vacío
    // Permite varias palabras separadas por un espacio, solo letras
    return /^([A-Za-z]+ ?)+$/.test(titulo);
}