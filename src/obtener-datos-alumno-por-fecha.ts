import sql from 'mssql';
import dbConfigAdmin from './aida-config-admin.js';


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
        console.log(`No se egreso ningun alumno en: ${fecha}`);
        return null;
    }
    return alumnos.recordset; // devolver todos los alumnos

    
  } catch (err) {
    console.error('Error conectando o ejecutando el script:', err);
    return null;
  } finally {
    await pool.close();
  }
}