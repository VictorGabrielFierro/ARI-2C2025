import { Pool, QueryResult } from "pg"; // ⬅️ Reemplazamos 'mssql' por 'pg'
import { getAlumnoPool } from "./conecciones-bd.js";

/* =======================
   📌 Inscribir alumno
   ======================= */
export async function inscribirAlumno(lu: string, materiaId: number, cuatrimestre: number) {
    const pool: Pool = await getAlumnoPool();

    // 1. Verificar si ya existe la inscripción
    const checkQuery = `
        SELECT 1 
        FROM "aida"."cursa"
        WHERE lu = $1 AND "MateriaId" = $2 AND "Cuatrimestre" = $3;
    `;

    // 2. Ejecutamos la consulta usando pool.query(query, [params])
    // Cuatrimestre es un número, por lo que el tipo es numérico en la DB, no Date.
    const check: QueryResult = await pool.query(checkQuery, [lu, materiaId, cuatrimestre]);

    // 3. Verificamos result.rows.length
    if (check.rows.length > 0) {
        throw new Error("YA_INSCRIPTO");
    }

    // 4. Insertar inscripción
    const insertQuery = `
        INSERT INTO "aida"."cursa" (lu, "MateriaId", "Cuatrimestre", "FechaInscripcion")
        -- 5. Usamos $1, $2, $3 y la función NOW() de PostgreSQL
        VALUES ($1, $2, $3, NOW()); 
    `;

    await pool.query(insertQuery, [lu, materiaId, cuatrimestre]);
}

/* ==========================
   📌 Desinscribir alumno
   ========================== */
export async function desinscribirAlumno(lu: string, materiaId: number, cuatrimestre: number) {
    const pool: Pool = await getAlumnoPool();

    const deleteQuery = `
        DELETE FROM "aida"."cursa"
        WHERE lu = $1 AND "MateriaId" = $2 AND "Cuatrimestre" = $3;
    `;

    // 6. Ejecutamos la consulta DELETE
    await pool.query(deleteQuery, [lu, materiaId, cuatrimestre]);
}