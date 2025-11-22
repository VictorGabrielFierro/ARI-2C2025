import sql from 'mssql';
import fs from 'fs/promises';
import fsSync from 'fs';
import dbConfigAdmin from './aida-config-admin.js'; 
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "path";

async function solicitarRutaAlArchivoCSV(): Promise<string> {
    const rl = readline.createInterface({ input, output });
    let rutaValida = false;
    let ruta = "";

    while (!rutaValida) {
        ruta = (await rl.question("Ingrese la ruta al CSV: ")).trim();
        // Sanitizar
        if (/[;&|<>]/.test(ruta)) {
        console.log("Ruta inválida: contiene caracteres no permitidos.");
        continue;
        }

        // Normalizar
        ruta = path.resolve(ruta);

        // Verificar existencia
        if (!fsSync.existsSync(ruta)) {
        console.log("El archivo no existe. Intente nuevamente.");
        continue;
        }

        // Verificar extensión
        if (path.extname(ruta).toLowerCase() !== ".csv") {
        console.log("El archivo debe ser un CSV. Intente nuevamente.");
        continue;
        }

        rutaValida = true;
    }

    rl.close();
    return ruta
}

async function cargarCSV(ruta: string){

    // Conectarse al SQL Server
    const pool = await sql.connect(dbConfigAdmin);

    try {
    // Leer el CSV
    const contents = await fs.readFile(ruta, 'utf8');
    const header = contents.split(/\r?\n/)[0];
    if (!header) {
        throw new Error('El archivo CSV está vacío');
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

    } catch (err) {
    console.error('Error conectando o ejecutando el script:', err);
    } finally {
    await pool.close();
    }

}

async function iniciarModoCarga() {
    console.log('Usted a ingresado al modo CARGA');

    const ruta = await solicitarRutaAlArchivoCSV();
    console.log('Cargando CSV. Por favor espere.')
    await cargarCSV(ruta);

    console.log('CSV cargado con exito.')
}

export { iniciarModoCarga };