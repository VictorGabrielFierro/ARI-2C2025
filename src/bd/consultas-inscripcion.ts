import sql from "mssql";
import { getAlumnoPool } from "./conecciones-bd.js";

/* ===============================
   📌 1. Obtener todas las materias que pertenecen al plan de estudios y tiene aprobadas las correlativas
   =============================== */
export async function obtenerMateriasInscribibles(lu:string) {
    const pool = await getAlumnoPool();

    const query = `
        SELECT m.MateriaId, m.Nombre, m.Descripcion
        FROM aida.estudiante_de e INNER JOIN aida.plan_de_estudios p
        ON e.CarreraId = p.CarreraId INNER JOIN aida.materias m
        ON p.MateriaId = m.MateriaId
        WHERE e.lu = @lu AND NOT EXISTS (
            SELECT 1
            FROM aida.correlativas cor
            WHERE cor.MateriaId = m.MateriaId AND NOT EXISTS (
                    SELECT 1
                    FROM aida.cursa cur
                    WHERE cur.lu = @lu
                    AND cur.MateriaId = cor.MateriaCorrelativaId
                    AND cur.NotaFinal >= 4      -- considera aprobada la nota >= 4
                )
        );
    `;

    const result = await pool.request().input('lu', sql.NVarChar, lu).query(query);
    return result.recordset;
}

/* ===============================================
   📌 2. Obtener la cursada más reciente de una materia
   =============================================== */
export async function obtenerCursadaMasReciente(materiaId: number) {
    const pool = await getAlumnoPool();

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
    const pool = await getAlumnoPool();

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
