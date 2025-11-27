import { Pool, PoolClient, QueryResult } from 'pg'; // ⬅️ Reemplazamos 'mssql' por 'pg'
import fs from 'fs/promises';
import { Alumno } from "../tipos/index.js";
import { ERRORES } from '../constantes/errores.js';
import { getAdminPool } from './conecciones-bd.js';

// El pool ahora es de tipo pg.Pool
const pool: Pool = await getAdminPool(); 

/**
 * Nota sobre `pool.close()`/`pool.end()`: 
 * Si el pool es global y se usa en toda la aplicación, NO debería cerrarse 
 * después de cada operación. Se asume que getAdminPool() devuelve el pool global.
 * He reemplazado `pool.close()` por `pool.end()`, pero se comenta.
 */

// Función auxiliar para manejar la ejecución de consultas.
// Obtiene un cliente para usar Transacciones o copia masiva si fuera necesario, 
// pero aquí nos enfocamos en el uso simple de pool.query.

export async function cargarCSV(ruta: string){
    let client: PoolClient | null = null;
    try {
        const contents = await fs.readFile(ruta, 'utf8');
        const dataLines = contents.split(/\r?\n/).slice(1).filter((l: string) => l.trim() !== '');
        
        if (dataLines.length === 0) {
            throw new Error(ERRORES.ARCHIVO_INVALIDO);
        }

        // 1. Obtener cliente para ejecutar transacciones o queries
        client = await pool.connect();
        
        // BORRAR tabla antes de insertar
        // Usamos pool.query o client.query
        await client.query(`DELETE FROM "aida"."alumnos"`);

        // Insertar cada fila usando parámetros
        for (const line of dataLines) {
            const values = line.split(',').map((v: string) => v === '' ? null : v);
            
            // 2. Usamos client.query con $1, $2, ...
            // El tipo Date se infiere automáticamente si el valor es un string de fecha válido.
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
        // PostgreSQL (pg) añade un campo `code` a los errores de la DB, que podemos usar
        // para identificar errores de sintaxis o de integridad.
        console.error("Error al cargar CSV:", err);
        throw new Error(ERRORES.INTERNO);
    } finally {
        // 3. Liberamos el cliente obtenido, NO cerramos el pool global
        if (client) client.release();
        // if (client) await client.release(); // ⚠️ En una aplicación real, probablemente NO querrías cerrar el pool.
        // await pool.end(); 
    }
}

export async function cargarJSON(alumnos: any[]) {
    try {
        if (!Array.isArray(alumnos) || alumnos.length === 0) {
            throw new Error(ERRORES.ARCHIVO_INVALIDO);
        }

        // BORRAR tabla antes de insertar
        await pool.query(`DELETE FROM "aida"."alumnos"`);

        // Insertar cada alumno
        for (const alumno of alumnos) {
            // 4. Usamos pool.query directamente (sin request().input())
            await pool.query(
                `INSERT INTO "aida"."alumnos" 
                 (lu, apellido, nombres, titulo, titulo_en_tramite, egreso)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    alumno.lu, 
                    alumno.apellido, 
                    alumno.nombres, 
                    alumno.titulo, 
                    alumno.titulo_en_tramite || null, // null si el valor es falsy
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

        // 5. ⬇️ Verificamos result.rowCount en lugar de result.rowsAffected[0]
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

        // 6. ⬇️ La comprobación de inserción es indirecta, pero se puede verificar si la fila fue afectada
        if (result.rowCount === 0) { 
            throw new Error(ERRORES.FALLA_AL_CARGAR_DATOS);
        }

    } catch (error: any) {
        // 7. ⬇️ El código de error de PostgreSQL para clave primaria duplicada es '23505'
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
    // Si luNuevo no se pasa, toma el valor de luViejo para la actualización
    const finalLuNuevo = luNuevo ?? luViejo; 

    try {
        const updates: string[] = [];
        const params: (string | null | undefined)[] = [];
        let paramIndex = 1;

        // 8. ⬇️ Construcción dinámica de la query usando parámetros posicionales
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

        // El último parámetro es siempre luViejo, para la cláusula WHERE
        params.push(luViejo); 
        
        const query = `
            UPDATE "aida"."alumnos"
            SET ${updates.join(", ")}
            WHERE lu = $${paramIndex}
        `;

        const result: QueryResult = await pool.query(query, params);

        // 9. ⬇️ Verificamos result.rowCount
        if (result.rowCount === 0) {
            throw new Error(ERRORES.ALUMNO_NO_ENCONTRADO);
        }

    } catch (error: any) {
        // 10. ⬇️ Código de error de PostgreSQL para clave primaria duplicada es '23505'
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