import sql from "mssql";
import { getAdminPool } from "./conecciones-bd.js";

/* ===============================
   📌 1. Obtener todas las materias
   =============================== */
export async function obtenerTodasLasMaterias() {
    const pool = await getAdminPool();

    const query = `
        SELECT MateriaId, Nombre, Descripcion
        FROM aida.materias;
    `;

    const result = await pool.request().query(query);
    return result.recordset;
}

/* ===============================================
   📌 2. Obtener la cursada más reciente de una materia
   =============================================== */
export async function obtenerCursadaMasReciente(materiaId: number) {
    const pool = await getAdminPool();

    const query = `
        SELECT TOP 1 *
        FROM aida.cursadas
        WHERE MateriaId = @materiaId
        ORDER BY Cuatrimestre DESC;
    `;

    const result = await pool.request()
        .input("materiaId", sql.Int, materiaId)
        .query(query);

    return result.recordset[0] ?? null;
}

/* ======================================================================
   📌 3. Obtener todas las materias en las que está inscripto un alumno (tabla CURSA)
   ====================================================================== */
export async function obtenerInscripcionesAlumno(lu: string) {
    const pool = await getAdminPool();

    const query = `
        SELECT 
            c.MateriaId,
            c.Cuatrimestre,
            m.nombre,
            m.descripcion
        FROM aida.cursa c
        INNER JOIN aida.materias m ON m.MateriaId = c.MateriaId
        WHERE c.lu = @lu
        ORDER BY m.Nombre ASC;
    `;

    const result = await pool.request()
        .input("lu", sql.VarChar, lu)
        .query(query);

    return result.recordset;
}
