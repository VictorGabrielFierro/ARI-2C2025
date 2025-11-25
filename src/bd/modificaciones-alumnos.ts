import sql from 'mssql';
import fs from 'fs/promises';
import { Alumno } from "../tipos/index.js";
import { ERRORES } from '../constantes/errores.js';
import { getAdminPool } from './conecciones-bd.js';


const pool = await getAdminPool(); // asegurarse que el pool esté conectado

export async function cargarCSV(ruta: string){
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
    }
}

export async function eliminarAlumnoPorLU(lu: string) {
    try {
        // Eliminar el alumno
        const result = await pool.request()
            .input('lu', sql.NVarChar, lu)
            .query('DELETE FROM aida.alumnos WHERE lu = @lu');

        
        // Opcional: verificar cuántas filas se borraron
        if (result.rowsAffected[0] === 0) {
            throw new Error(ERRORES.ALUMNO_NO_ENCONTRADO);
        }
        
    } catch (error:any) {
        if (error.message === ERRORES.ALUMNO_NO_ENCONTRADO) {
            throw error; // Re-lanzás el mismo error
        }
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}

export async function insertarAlumno(alumno: Alumno) {
    try {
        const result = await pool.request()
            .input("lu", sql.NVarChar(50), alumno.lu)
            .input("apellido", sql.NVarChar(50), alumno.apellido)
            .input("nombres", sql.NVarChar(50), alumno.nombres)
            .input("titulo", sql.NVarChar(100), alumno.titulo || null)
            .input("titulo_en_tramite", sql.Date, alumno.titulo_en_tramite || null)
            .input("egreso", sql.Date, alumno.egreso || null)
            .query(`
                INSERT INTO aida.alumnos 
                (lu, apellido, nombres, titulo, titulo_en_tramite, egreso)
                VALUES (@lu, @apellido, @nombres, @titulo, @titulo_en_tramite, @egreso)
            `);

        // Si se insertó correctamente
        if (result.rowsAffected[0] === 0) {
            throw new Error(ERRORES.FALLA_AL_CARGAR_DATOS);
        }

    } catch (error: any) {
        // Si la LU ya existe (clave primaria duplicada)
        if (error.number === 2627) {  // Código de error SQL Server para PK duplicada
            throw new Error(ERRORES.LU_DUPLICADA);
        }
        if (error.message === ERRORES.FALLA_AL_CARGAR_DATOS) {
            throw error; // Re-lanzás el mismo error
        }
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
    if (!luNuevo) {
        luNuevo = luViejo;
    }

    try {
        const request = pool.request()
            .input("luViejo", sql.NVarChar(50), luViejo);

        const updates: string[] = [];
        if (luNuevo !== null) {
            request.input("luNuevo", sql.NVarChar(50), luNuevo);
            updates.push("lu = @luNuevo");
        }
        if (apellido !== null && apellido !== undefined) {
            request.input("apellido", sql.NVarChar(50), apellido);
            updates.push("apellido = @apellido");
        }
        if (nombres !== null && nombres !== undefined) {
            request.input("nombres", sql.NVarChar(50), nombres);
            updates.push("nombres = @nombres");
        }
        if (titulo !== null && titulo !== undefined) {
            request.input("titulo", sql.NVarChar(100), titulo);
            updates.push("titulo = @titulo");
        }
        if (titulo_en_tramite !== null && titulo_en_tramite !== undefined) {
            request.input("titulo_en_tramite", sql.Date, titulo_en_tramite);
            updates.push("titulo_en_tramite = @titulo_en_tramite");
        }
        if (egreso !== null && egreso !== undefined) {
            request.input("egreso", sql.Date, egreso);
            updates.push("egreso = @egreso");
        }

        if (updates.length === 0) {
            // No hay cambios
            return;
        }

        const query = `
            UPDATE aida.alumnos
            SET ${updates.join(", ")}
            WHERE lu = @luViejo
        `;

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            throw new Error(ERRORES.ALUMNO_NO_ENCONTRADO);
        }

    } catch (error: any) {
        if (error.number === 2627) {
            throw new Error(ERRORES.LU_DUPLICADA);
        }
        if (error.message === ERRORES.ALUMNO_NO_ENCONTRADO) {
            throw error;
        }
        if (error.message === ERRORES.FALLA_AL_CARGAR_DATOS) {
            throw error;
        }
        throw new Error(ERRORES.FALLA_AL_CONSULTAR_BD);
    }
}
