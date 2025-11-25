import sql from 'mssql';
import { ERRORES } from "./constantes/errores.js";
import { getPool } from './coneccion-bd.js';


const pool = await getPool(); // asegurarse que el pool esté conectado


export async function obtenerDatosAlumnoPorFecha(fecha: string) {
    try {
        // Obtener los alumnos egresados en fecha
        const alumnos = await pool.request()
            .input('fecha', sql.Date, fecha)
            .query('SELECT * FROM aida.alumnos WHERE egreso = @fecha');
        
        // Verificar que se encontro el alumno
        if (alumnos.recordset.length === 0) {
            throw new Error(ERRORES.SIN_ALUMNOS_EGRESADOS_EN_FECHA_PROPORCIONADO);
        }
        return alumnos.recordset; // devolver todos los alumnos
    } catch (error:any) {
        if (error.message === ERRORES.SIN_ALUMNOS_EGRESADOS_EN_FECHA_PROPORCIONADO) {
            throw error; // Re-lanzás el mismo error
        }
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}

export async function obtenerDatosAlumnoPorLU(lu: string) {
    try {
        // Obtener el alumno
        const alumno = await pool.request()
            .input('lu', sql.VarChar, lu)
            .query('SELECT * FROM aida.alumnos WHERE lu = @lu');
        
        // Verificar que se encontro el alumno
        if (alumno.recordset.length === 0) {
            throw new Error(ERRORES.ALUMNO_NO_ENCONTRADO);
        }
        // Devolver objeto alumno
        return alumno.recordset[0]; 
    } catch (error:any) {
        if (error.message === ERRORES.ALUMNO_NO_ENCONTRADO) {
            throw error; // Re-lanzás el mismo error
        }
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}

export async function obtenerTablaAlumnos() {
    try {
        // Obtener el alumno
        const tablaAlumnos = await pool.request()
            .query('SELECT * FROM aida.alumnos');
        
        // Devolver la tabla
        return tablaAlumnos.recordset;
    } catch (error:any) {
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}