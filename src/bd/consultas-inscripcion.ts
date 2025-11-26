// archivo-crud-alumnos.ts

// 1. ⬇️ Reemplazamos 'mssql' por 'pg' para el tipo Pool
import { Pool, QueryResult } from "pg"; 
import { getAlumnoPool } from "./conecciones-bd.js";


/* ===============================
   📌 1. Obtener todas las materias que pertenecen al plan de estudios y tiene aprobadas las correlativas
   =============================== */
export async function obtenerMateriasInscribibles(lu: string) {
    // 2. ⬇️ getAlumnoPool ahora devuelve un pg.Pool
    const pool: Pool = await getAlumnoPool();

    // 3. ⬇️ Cambiamos la sintaxis de la consulta:
    //      - Usamos comillas dobles ("") para tablas/columnas (PostgreSQL)
    //      - Reemplazamos @lu por $1
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

    // 4. ⬇️ Ejecutamos la consulta con pool.query(query, [params])
    const result: QueryResult = await pool.query(query, [lu]);
    
    // 5. ⬇️ Devolvemos result.rows
    return result.rows;
}

/* ===============================================
   📌 2. Obtener la cursada más reciente de una materia
   =============================================== */
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

    // 7. ⬇️ Devolvemos el primer registro de result.rows, si existe
    return result.rows[0] ?? null;
}

/* ======================================================================
   📌 3. Obtener todas las materias en las que está inscripto un alumno (tabla CURSA)
   ====================================================================== */
export async function obtenerInscripcionesAlumno(lu: string) {
    const pool: Pool = await getAlumnoPool();

    const query = `
        SELECT 
            c."MateriaId",
            c."Cuatrimestre",
            m.nombre,
            m.descripcion
        FROM "aida"."cursa" c
        INNER JOIN "aida"."materias" m ON m."MateriaId" = c."MateriaId"
        WHERE c.lu = $1
        ORDER BY m."Nombre" ASC;
    `;

    const result: QueryResult = await pool.query(query, [lu]);

    return result.rows;
}