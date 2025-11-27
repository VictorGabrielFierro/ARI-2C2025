import { Pool, QueryResult } from "pg"; 
import { getAlumnoPool } from "./conecciones-bd.js";


// Esta funcion obtiene las materias pertenecientes al plan de estudios del alumno
// y que tiene las correlativas aprobadas
export async function obtenerMateriasInscribibles(lu: string) {
    const pool: Pool = await getAlumnoPool();

    const query = `
        SELECT m."MateriaId", m."Nombre", m."Descripcion"
        FROM "aida"."estudiante_de" e 
        INNER JOIN "aida"."plan_de_estudios" p ON e."CarreraId" = p."CarreraId" 
        INNER JOIN "aida"."materias" m ON p."MateriaId" = m."MateriaId"
        WHERE e.lu = $1 
        AND NOT EXISTS (
            SELECT 1
            FROM "aida"."correlativas" cor
            WHERE cor."MateriaId" = m."MateriaId" 
            AND NOT EXISTS (
                    SELECT 1
                    FROM "aida"."cursa" cur
                    WHERE cur.lu = $1 -- ⚠️ Usamos $1 nuevamente ya que es el único parámetro
                    AND cur."MateriaId" = cor."MateriaCorrelativaId"
                    AND cur."NotaFinal" >= 4
                )
        );
    `;

    const result: QueryResult = await pool.query(query, [lu]);
    return result.rows;
}

export async function obtenerCursadaMasReciente(materiaId: number) {
    const pool: Pool = await getAlumnoPool();

    const query = `
        -- 6. ⬇️ En PostgreSQL, reemplazamos 'SELECT TOP 1 *' por 'SELECT * ... LIMIT 1'
        SELECT *
        FROM "aida"."cursadas"
        WHERE "MateriaId" = $1
        ORDER BY "Cuatrimestre" DESC
        LIMIT 1;
    `;

    const result: QueryResult = await pool.query(query, [materiaId]);
    return result.rows[0] ?? null;
}

export async function obtenerInscripcionesAlumno(lu: string) {
    const pool: Pool = await getAlumnoPool();

    const query = `
        SELECT 
            c."MateriaId",
            c."Cuatrimestre",
            m."Nombre",
            m."Descripcion"
        FROM "aida"."cursa" c
        INNER JOIN "aida"."materias" m ON m."MateriaId" = c."MateriaId"
        WHERE c.lu = $1 AND c."Cuatrimestre" = (
            SELECT MAX("cur"."Cuatrimestre")
            FROM "aida"."cursadas" cur
        )
        ORDER BY m."Nombre" ASC;
    `;

    const result: QueryResult = await pool.query(query, [lu]);

    return result.rows;
}