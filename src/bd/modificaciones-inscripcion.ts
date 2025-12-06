import { Pool, QueryResult } from "pg";
import { obtenerPoolPorRol } from "./conecciones-bd.js";

export async function inscribirAlumno(lu: string, materiaId: number, cuatrimestre: number) {
    const pool: Pool = await obtenerPoolPorRol('usuario');
    const checkQuery = `
        SELECT 1 
        FROM "aida"."cursa"
        WHERE lu = $1 AND "MateriaId" = $2 AND "Cuatrimestre" = $3;
    `;

    const check: QueryResult = await pool.query(checkQuery, [lu, materiaId, cuatrimestre]);

    if (check.rows.length > 0) {
        throw new Error("YA_INSCRIPTO");
    }

    const insertQuery = `
        INSERT INTO "aida"."cursa" (lu, "MateriaId", "Cuatrimestre", "FechaInscripcion")
        -- 5. Usamos $1, $2, $3 y la función NOW() de PostgreSQL
        VALUES ($1, $2, $3, NOW()); 
    `;

    await pool.query(insertQuery, [lu, materiaId, cuatrimestre]);
}

export async function desinscribirAlumno(lu: string, materiaId: number, cuatrimestre: number) {
    const pool: Pool = await obtenerPoolPorRol('usuario');

    const deleteQuery = `
        DELETE FROM "aida"."cursa"
        WHERE lu = $1 AND "MateriaId" = $2 AND "Cuatrimestre" = $3;
    `;

    await pool.query(deleteQuery, [lu, materiaId, cuatrimestre]);
}