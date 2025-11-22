import sql from 'mssql';
import { readFile } from 'fs/promises';
import path from 'path';

async function main() {
  const config = {
    user: 'aida_admin',
    password: 'Admin2025',
    server: 'localhost',
    database: 'aida_db',
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  };

  try {
    // Conectarse al SQL Server
    await sql.connect(config);

    // Leer el CSV
    const contents = await readFile('recursos/alumnos.csv', 'utf8');
    const header = contents.split(/\r?\n/)[0];
    const columns = header.split(',').map(c => c.trim());
    const dataLines = contents.split(/\r?\n/).slice(1).filter(l => l.trim() !== '');

    // Insertar cada fila usando parámetros
    for (const line of dataLines) {
      const values = line.split(',').map(v => v === '' ? null : v);

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
    await sql.close();
  }
}

main();