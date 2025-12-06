import { Pool, PoolClient, QueryResult } from 'pg';
import fs from 'fs/promises';
import { Alumno } from "../tipos/index.js";
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

        await pool.query(`DELETE FROM "aida"."alumnos"`);

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

export async function eliminarAlumnoPorLU(lu: string) {
    try {
        const result: QueryResult = await pool.query(
            `DELETE FROM "aida"."alumnos" WHERE lu = $1`, 
            [lu]
        );

        if (result.rowCount === 0) {
            throw new Error(ERRORES.ALUMNO_NO_ENCONTRADO);
        }
        
    } catch (error:any) {
        if (error.message === ERRORES.ALUMNO_NO_ENCONTRADO) {
            throw error;
        }
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}

export async function insertarAlumno(alumno: Alumno) {
    try {
        const result: QueryResult = await pool.query(
            `INSERT INTO "aida"."alumnos" 
             (lu, apellido, nombres, titulo, titulo_en_tramite, egreso)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                alumno.lu, 
                alumno.apellido, 
                alumno.nombres, 
                alumno.titulo || null, 
                alumno.titulo_en_tramite || null, 
                alumno.egreso || null
            ]
        );

        if (result.rowCount === 0) { 
            throw new Error(ERRORES.FALLA_AL_CARGAR_DATOS);
        }

    } catch (error: any) {
        if (error.code === '23505') { 
            throw new Error(ERRORES.LU_DUPLICADA);
        }
        if (error.message === ERRORES.FALLA_AL_CARGAR_DATOS) {
            throw error; 
        }
        console.error("Error al insertar alumno:", error);
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}

export async function editarAlumno({
    luViejo,
    luNuevo,
    apellido,
    nombres,
    titulo,
    titulo_en_tramite,
    egreso,
}: {
    luViejo: string;
    luNuevo?: string | null;
    apellido?: string | null;
    nombres?: string | null;
    titulo?: string | null;
    titulo_en_tramite?: string | null;
    egreso?: string | null;
}) {
    const finalLuNuevo = luNuevo ?? luViejo; 
    try {
        const updates: string[] = [];
        const params: (string | null | undefined)[] = [];
        let paramIndex = 1;

        if (finalLuNuevo !== luViejo) {
            params.push(finalLuNuevo);
            updates.push(`lu = $${paramIndex++}`);
        }
        
        if (apellido !== null && apellido !== undefined) {
            params.push(apellido);
            updates.push(`apellido = $${paramIndex++}`);
        }
        if (nombres !== null && nombres !== undefined) {
            params.push(nombres);
            updates.push(`nombres = $${paramIndex++}`);
        }
        if (titulo !== null && titulo !== undefined) {
            params.push(titulo);
            updates.push(`titulo = $${paramIndex++}`);
        }
        if (titulo_en_tramite !== null && titulo_en_tramite !== undefined) {
            params.push(titulo_en_tramite);
            updates.push(`titulo_en_tramite = $${paramIndex++}`);
        }
        if (egreso !== null && egreso !== undefined) {
            params.push(egreso);
            updates.push(`egreso = $${paramIndex++}`);
        }

        if (updates.length === 0) {
            return;
        }

        params.push(luViejo); 
        
        const query = `
            UPDATE "aida"."alumnos"
            SET ${updates.join(", ")}
            WHERE lu = $${paramIndex}
        `;

        const result: QueryResult = await pool.query(query, params);

        if (result.rowCount === 0) {
            throw new Error(ERRORES.ALUMNO_NO_ENCONTRADO);
        }

    } catch (error: any) {
        if (error.code === '23505') { 
            throw new Error(ERRORES.LU_DUPLICADA);
        }
        if (error.message === ERRORES.ALUMNO_NO_ENCONTRADO) {
            throw error;
        }
        console.error("Error al editar alumno:", error);
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}