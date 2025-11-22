import sql from 'mssql';
import dbConfigAdmin from './db-config-admin.js';


export async function obtenerDatosAlumno(lu: string) {
    // Conectarse al SQL Server
    const pool = await sql.connect(dbConfigAdmin);
    
    try {
    // Obtener el alumno
    const result = await pool.request()
        .input('lu', sql.VarChar, lu)
        .query('SELECT * FROM aida.alumnos WHERE lu = @lu');
    
    // Verificar que se encontro el alumno
    if (result.recordset.length === 0) {
        console.log(`No se encontró alumno con LU=${lu}`);
        return;
    }
    
    return result.recordset[0]; // devolver objeto alumno

    
  } catch (err) {
    console.error('Error conectando o ejecutando el script:', err);
    return null;
  } finally {
    await pool.close();
  }
}