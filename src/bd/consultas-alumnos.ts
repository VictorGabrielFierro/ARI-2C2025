import { Pool } from 'pg'; 
import { ERRORES } from "../constantes/errores.js";
import { obtenerPoolPorRol } from './conecciones-bd.js';

const pool: Pool = await obtenerPoolPorRol('administrador'); 

export async function obtenerDatosAlumnoPorFecha(fecha: string) {
    try {
        const alumnos = await pool.query(
            `SELECT * FROM "aida"."alumnos" WHERE egreso = $1`, 
            [fecha] 
        );
        
        if (alumnos.rows.length === 0) {
            throw new Error(ERRORES.SIN_ALUMNOS_EGRESADOS_EN_FECHA_PROPORCIONADO);
        }
        
        return alumnos.rows; 
    } catch (error:any) {
        if (error.message === ERRORES.SIN_ALUMNOS_EGRESADOS_EN_FECHA_PROPORCIONADO) {
            throw error;
        }
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}

export async function obtenerDatosAlumnoPorLU(lu: string) {
    try {
        const alumno = await pool.query(
            `SELECT * FROM "aida"."alumnos" WHERE lu = $1`, 
            [lu]
        );
        
        if (alumno.rows.length === 0) {
            throw new Error(ERRORES.ALUMNO_NO_ENCONTRADO);
        }
        
        return alumno.rows[0]; 
    } catch (error:any) {
        if (error.message === ERRORES.ALUMNO_NO_ENCONTRADO) {
            throw error;
        }
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}