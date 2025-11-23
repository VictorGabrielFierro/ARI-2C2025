import sql from 'mssql';
import fs from 'fs/promises';
import dbConfigAdmin from './aida-config-admin.js'; 
import { ERRORES } from './constantes/errores.js';

export async function cargarCSV(ruta: string){

    // Conectarse al SQL Server
    const pool = await sql.connect(dbConfigAdmin);

    try {
        // Leer el CSV
        const contents = await fs.readFile(ruta, 'utf8');
        const header = contents.split(/\r?\n/)[0];
        if (!header) {
            throw new Error(ERRORES.ARCHIVO_INVALIDO);
        }
        // const columns = header.split(',').map((c: string) => c.trim());
        const dataLines = contents.split(/\r?\n/).slice(1).filter((l: string) => l.trim() !== '');


        // BORRAR tabla antes de insertar
        await pool.request().query('DELETE FROM aida.alumnos');

        // Insertar cada fila usando parámetros
        for (const line of dataLines) {
            const values = line.split(',').map((v: string) => v === '' ? null : v);

            await new sql.Request()
            .input('lu', sql.VarChar, values[0])
            .input('apellido', sql.VarChar, values[1])
            .input('nombres', sql.VarChar, values[2])
            .input('titulo', sql.VarChar, values[3])
            .input('titulo_en_tramite', sql.Date, values[4])
            .input('egreso', sql.Date, values[5])
            .query(`
                INSERT INTO aida.alumnos (lu, apellido, nombres, titulo, titulo_en_tramite, egreso)
                VALUES (@lu, @apellido, @nombres, @titulo, @titulo_en_tramite, @egreso)
            `);
        }
    } catch (err:any) {
        if (err.message === ERRORES.ARCHIVO_INVALIDO) {
            throw err; // Re-lanzás el mismo error
        }
        throw new Error(ERRORES.INTERNO);
    } finally {
    await pool.close();
    }

}

export async function cargarJSON(alumnos: any[]) {
    // Conectarse al SQL Server
    const pool = await sql.connect(dbConfigAdmin);

    try {
        if (!Array.isArray(alumnos) || alumnos.length === 0) {
            throw new Error(ERRORES.ARCHIVO_INVALIDO);
        }

        // BORRAR tabla antes de insertar (igual que en cargarCSV)
        await pool.request().query('DELETE FROM aida.alumnos');

        // Insertar cada alumno
        for (const alumno of alumnos) {
            await new sql.Request()
                .input('lu', sql.VarChar, alumno.lu)
                .input('apellido', sql.VarChar, alumno.apellido)
                .input('nombres', sql.VarChar, alumno.nombres)
                .input('titulo', sql.VarChar, alumno.titulo)
                .input('titulo_en_tramite', sql.Date, alumno.titulo_en_tramite || null)
                .input('egreso', sql.Date, alumno.egreso || null)
                .query(`
                INSERT INTO aida.alumnos (lu, apellido, nombres, titulo, titulo_en_tramite, egreso)
                VALUES (@lu, @apellido, @nombres, @titulo, @titulo_en_tramite, @egreso)
                `);
        }
    } catch (err:any) {
        if (err.message === ERRORES.ARCHIVO_INVALIDO) {
            throw err; // Re-lanzás el mismo error
        }
        throw new Error(ERRORES.INTERNO);
    } finally {
        await pool.close();
    }
}