import { Pool, QueryResult } from "pg";
import { obtenerPoolPorRol } from "./conecciones-bd.js";

export async function inscribirAlumno(lu: string, materiaId: string, año: number, cuatrimestre: number) {
    const pool: Pool = await obtenerPoolPorRol('usuario');
    const checkQuery = `
        SELECT 1 
        FROM "aida"."cursa"
        WHERE lu = $1 AND "MateriaId" = $2 AND "Año" = $3 AND "Cuatrimestre" = $4;
    `;

    const check: QueryResult = await pool.query(checkQuery, [lu, materiaId, año, cuatrimestre]);

    if (check.rows.length > 0) {
        throw new Error("YA_INSCRIPTO");
    }

    const insertQuery = `
        INSERT INTO "aida"."cursa" (lu, "MateriaId", "Año", "Cuatrimestre", "FechaInscripcion")
        -- 5. Usamos $1, $2, $3 y la función NOW() de PostgreSQL
        VALUES ($1, $2, $3, $4, NOW()); 
    `;

    await pool.query(insertQuery, [lu, materiaId, año, cuatrimestre]);
}

export async function desinscribirAlumno(lu: string, materiaId: string, año: number, cuatrimestre: number) {
    const pool: Pool = await obtenerPoolPorRol('usuario');

    const deleteQuery = `
        DELETE FROM "aida"."cursa"
        WHERE lu = $1 AND "MateriaId" = $2 AND "Año" = $3 AND "Cuatrimestre" = $4;
    `;

    await pool.query(deleteQuery, [lu, materiaId, año, cuatrimestre]);
}