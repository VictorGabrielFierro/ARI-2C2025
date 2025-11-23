import path from 'path';
import fs from 'fs/promises';

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

export async function validarCSV(carpetaBase: string, nombre: string): Promise<string | null> {
    // 1. Evitar path traversal y rutas absolutas
    if (nombre.includes('..') || path.isAbsolute(nombre)) {
        console.error('Nombre de archivo inválido');
        return null;
    }

    // 2. Construir ruta absoluta del archivo
    const archivoAbsoluto = path.resolve(path.join(carpetaBase, nombre));

    // 3. Verificar que la ruta final esté dentro de la carpeta base
    const carpetaSegura = path.resolve(carpetaBase);
    if (!archivoAbsoluto.startsWith(carpetaSegura + path.sep)) {
        console.error('Intento de acceso a ruta no permitida');
        return null;
    }

    // 4. Verificar extensión .csv
    if (path.extname(nombre).toLowerCase() !== '.csv') {
        console.error('El archivo debe tener extensión .csv');
        return null;
    }

    // 5. Verificar que existe y es un archivo
    try {
        const stats = await fs.stat(archivoAbsoluto);
        if (!stats.isFile()) {
            console.error('No es un archivo válido');
            return null;
        }
    } catch (err) {
        console.log(`Se busco en: ${archivoAbsoluto}`)
        console.error(`Archivo no encontrado: ${nombre}`);
        return null;
    }

    // Todo OK
    return archivoAbsoluto;
}