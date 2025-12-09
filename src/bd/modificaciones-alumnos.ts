import { Pool } from 'pg';
import { ERRORES } from '../constantes/errores.js';
import { obtenerPoolPorRol } from './conecciones-bd.js';

const pool: Pool = await obtenerPoolPorRol('administrador'); 

export async function cargarJSON(alumnos: any[]) {
    try {
        if (!Array.isArray(alumnos) || alumnos.length === 0) {
            throw new Error(ERRORES.ARCHIVO_INVALIDO);
        }
        
        for (const alumno of alumnos) {
            await pool.query(
                `INSERT INTO "aida"."alumnos" 
                 (lu, apellido, nombres, titulo, titulo_en_tramite, egreso)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    alumno.lu, 
                    alumno.apellido, 
                    alumno.nombres, 
                    alumno.titulo, 
                    alumno.titulo_en_tramite || null,
                    alumno.egreso || null
                ]
            );
        }
    } catch (err:any) {
        if (err.message === ERRORES.ARCHIVO_INVALIDO) {
            throw err; 
        }
        console.error("Error al cargar JSON:", err);
        throw new Error(ERRORES.INTERNO);
    }
}