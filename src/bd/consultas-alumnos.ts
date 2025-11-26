// archivo-llamador-corregido.ts

// 1. ⬇️ Cambiamos la importación de 'mssql' por 'pg' para los tipos de Pool
import { Pool } from 'pg'; 
import { ERRORES } from "../constantes/errores.js";
import { getAdminPool } from './conecciones-bd.js';

// 2. ⬇️ El pool ahora es de tipo `pg.Pool`
const pool: Pool = await getAdminPool(); 


export async function obtenerDatosAlumnoPorFecha(fecha: string) {
    try {
        // Obtener los alumnos egresados en fecha
        // Usamos pool.query(query, params)
        const alumnos = await pool.query(
            // Cambiamos @fecha por $1
            `SELECT * FROM "aida"."alumnos" WHERE egreso = $1`, 
            // ⬇️ PostgreSQL generalmente infiere el tipo de la fecha/string, no es necesario especificar `sql.Date`
            [fecha] 
        );
        
        // 3. ⬇️ Usamos result.rows.length en lugar de result.recordset.length
        if (alumnos.rows.length === 0) {
            throw new Error(ERRORES.SIN_ALUMNOS_EGRESADOS_EN_FECHA_PROPORCIONADO);
        }
        
        // 4. ⬇️ Devolvemos result.rows en lugar de result.recordset
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
        // Obtener el alumno
        const alumno = await pool.query(
            // Cambiamos @lu por $1
            `SELECT * FROM "aida"."alumnos" WHERE lu = $1`, 
            [lu]
        );
        
        // Verificar que se encontro el alumno
        if (alumno.rows.length === 0) {
            throw new Error(ERRORES.ALUMNO_NO_ENCONTRADO);
        }
        
        // Devolver objeto alumno (el primer registro)
        return alumno.rows[0]; 
    } catch (error:any) {
        if (error.message === ERRORES.ALUMNO_NO_ENCONTRADO) {
            throw error;
        }
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}

export async function obtenerTablaAlumnos() {
    try {
        // Obtener la tabla
        const tablaAlumnos = await pool.query(
            // Consulta sin parámetros
            `SELECT * FROM "aida"."alumnos"` 
        );
        
        // Devolver la tabla completa
        return tablaAlumnos.rows;
    } catch (error:any) {
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}