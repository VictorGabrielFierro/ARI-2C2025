import path from 'path';
import fs from 'fs/promises';
import { ERRORES } from './constantes/errores.js';
import { CamposAlumno, ReglasValidacion } from "./tipos/index.js";

export function validarFecha(fecha: string): boolean {
    // Patrón: 4 dígitos año, 2 dígitos mes, 2 dígitos día, separados por guiones
    const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = fecha.match(regex);

    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (month < 1 || month > 12) return false;

    const diasPorMes = [31, (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day < 1 || day > diasPorMes[month - 1]!) return false;

    return true;
}

export function validarLU(lu: string | null | undefined): boolean {
    if (!lu) {
        console.log('3')
        return false
    }
    const regex = /^[1-9][0-9]{0,3}\/[0-9]{2}$/;
    return regex.test(lu);
}

export async function validarCSV(carpetaBase: string, nombre: string): Promise<string> {
    if (nombre.includes('..') || path.isAbsolute(nombre)) {
        throw new Error(ERRORES.ARCHIVO_INVALIDO)
    }

    const archivoAbsoluto = path.resolve(path.join(carpetaBase, nombre));

    const carpetaSegura = path.resolve(carpetaBase);
    if (!archivoAbsoluto.startsWith(carpetaSegura + path.sep)) {
        throw new Error(ERRORES.ARCHIVO_INVALIDO)
    }

    if (path.extname(nombre).toLowerCase() !== '.csv') {
        throw new Error(ERRORES.ARCHIVO_INVALIDO)
    }

    try {
        const stats = await fs.stat(archivoAbsoluto);
        if (!stats.isFile()) {
            throw new Error(ERRORES.ARCHIVO_INVALIDO)
        }
    } catch (err) {
        throw new Error(ERRORES.ARCHIVO_INVALIDO)
    }

    return archivoAbsoluto;
}

// Validar nombre, apellido, título: puede ser varias palabras separadas por espacios, solo letras
export function validarNombreApellidoTitulo(valor: string | null | undefined): boolean {
    if (!valor) return true;
    const titulo = valor.trim();
    if (!titulo) return false;
    // Permite varias palabras separadas por un espacio, solo letras
    return /^([A-Za-z]+ ?)+$/.test(titulo);
}

export function validarAlumno(
    campos: CamposAlumno,
    opcional: ReglasValidacion
): { valido: boolean; error?: string } {
    const { lu, apellido, nombres, titulo, titulo_en_tramite, egreso } = campos;

    if (!opcional.lu && !validarLU(lu)) {
        return { valido: false, error: ERRORES.LU_INVALIDA };
    }
    if (!opcional.apellido && !validarNombreApellidoTitulo(apellido)) {
        return { valido: false, error: ERRORES.APELLIDO_INVALIDO };
    }
    if (!opcional.nombres && !validarNombreApellidoTitulo(nombres)) {
        return { valido: false, error: ERRORES.NOMBRES_INVALIDOS };
    }
    if (!opcional.titulo && titulo && !validarNombreApellidoTitulo(titulo)) {
        return { valido: false, error: ERRORES.TITULO_INVALIDO };
    }
    if (!opcional.titulo_en_tramite && titulo_en_tramite && !validarFecha(titulo_en_tramite)) {
        return { valido: false, error: ERRORES.TITULO_EN_TRAMITE_INVALIDO };
    }
    if (!opcional.egreso && egreso && !validarFecha(egreso)) {
        return { valido: false, error: ERRORES.EGRESO_INVALIDO };
    }
    return { valido: true };
}