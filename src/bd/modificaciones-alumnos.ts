import { Pool, PoolClient } from 'pg';
import fs from 'fs/promises';
import { ERRORES } from '../constantes/errores.js';
import { obtenerPoolPorRol } from './conecciones-bd.js';

const pool: Pool = await obtenerPoolPorRol('administrador'); 

export async function cargarCSV(ruta: string){
    let client: PoolClient | null = null;
    try {
        const contents = await fs.readFile(ruta, 'utf8');
        const dataLines = contents.split(/\r?\n/).slice(1).filter((l: string) => l.trim() !== '');
        
        if (dataLines.length === 0) {
            throw new Error(ERRORES.ARCHIVO_INVALIDO);
        }

        client = await pool.connect();
        await client.query(`DELETE FROM "aida"."alumnos"`);

        for (const line of dataLines) {
            const values = line.split(',').map((v: string) => v === '' ? null : v);
            
            await client.query(
                `INSERT INTO "aida"."alumnos" 
                 (lu, apellido, nombres, titulo, titulo_en_tramite, egreso)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [values[0], values[1], values[2], values[3], values[4], values[5]]
            );
        }
    } catch (err:any) {
        if (err.message === ERRORES.ARCHIVO_INVALIDO) {
            throw err;
        }
        console.error("Error al cargar CSV:", err);
        throw new Error(ERRORES.INTERNO);
    } finally {
        if (client) client.release();
    }
}

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