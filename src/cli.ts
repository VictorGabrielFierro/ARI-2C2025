import sql from 'mssql';
import fs from 'fs/promises';
import dbConfigAdmin from './db-config-admin.js'; 

async function main() {
  // Conectarse al SQL Server
  const pool = await sql.connect(dbConfigAdmin);

  try {
    // Leer el CSV
    const contents = await fs.readFile('recursos/alumnos.csv', 'utf8');
    const header = contents.split(/\r?\n/)[0];
    if (!header) {
      throw new Error('El archivo CSV está vacío');
    }
    // const columns = header.split(',').map((c: string) => c.trim());
    const dataLines = contents.split(/\r?\n/).slice(1).filter((l: string) => l.trim() !== '');

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

      console.log(`Insertada fila LU=${values[0]}`);
    }

    // Mostrar tabla completa
    const result = await new sql.Request().query('SELECT * FROM aida.alumnos');
    console.log('Contenido de la tabla alumnos:', result.recordset);

  } catch (err) {
    console.error('Error conectando o ejecutando el script:', err);
  } finally {
    await pool.close();
  }
}

main();