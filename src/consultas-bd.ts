import sql from 'mssql';
import dbConfigAdmin from './aida-config-admin.js';
import { ERRORES } from "./constantes/errores.js";


export async function obtenerDatosAlumnoPorFecha(fecha: string) {
    // Conectarse al SQL Server
    const pool = await sql.connect(dbConfigAdmin);

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
    } finally {
        await pool.close();
    }
}

export async function obtenerDatosAlumnoPorLU(lu: string) {
    // Conectarse al SQL Server
    const pool = await sql.connect(dbConfigAdmin);
    
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
    } finally {
        await pool.close();
    }
}

export async function obtenerTablaAlumnos() {
    // Conectarse al SQL Server
    const pool = await sql.connect(dbConfigAdmin);
    
    try {
        // Obtener el alumno
        const tablaAlumnos = await pool.request()
            .query('SELECT * FROM aida.alumnos');
        
        // Devolver la tabla
        return tablaAlumnos.recordset;
    } catch (error:any) {
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    } finally {
        await pool.close();
    }
}