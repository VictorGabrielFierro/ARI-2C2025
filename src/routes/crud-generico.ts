import { Router } from "express";
import { verificarTokenMiddleware, requireRole } from "../auth.js";
import { obtenerMetadataTabla } from "../bd/metadata.js";
// 1. ⬇️ Reemplazamos la importación de `ConnectionPool` de mssql por `Pool` de pg
import { obtenerPoolPorRol } from "../bd/conecciones-bd.js"; 
import { Pool } from "pg"; 
// 2. ⬇️ Eliminamos la importación de 'mssql' ya que no usamos sus tipos
// import sql, { ConnectionPool } from "mssql";
import {
    buildSelectAllQuery,
    buildSelectBaseQuery, 
    buildInsertQuery,
    buildUpdateQuery,
    buildDeleteQuery
} from "../bd/queries-genericas.js"
import { generarTituloPorLU } from "../certificados.js"

const router = Router();

// 3. ⬇️ La función ahora espera un `Pool` de 'pg'
async function egresarAlumnoAutomaticamente(lu: string, pool: Pool) {
    // La lógica de egreso debe cambiar para usar `pg.Pool.query` con $1, $2, etc.

    // 1. Obtener CarreraId
    const carreraResult = await pool.query(
        // Cambiamos @lu por $1 y eliminamos el prefijo 'aida.' si no es necesario o ajustamos al esquema de PG
        `SELECT "CarreraId" FROM "aida"."estudiante_de" WHERE lu = $1`, 
        [lu]
    );

    // Ojo: Valida que exista alumno antes de acceder a [0]
    if (carreraResult.rows.length === 0) return;

    const carreraId = carreraResult.rows[0].CarreraId;

    // 2. Materias Faltantes
    const materiasFaltantesResult = await pool.query(
        // Usamos $1 y $2. PostgreSQL soporta EXCEPT
        `(SELECT "MateriaId" 
            FROM "aida"."plan_de_estudios" 
            WHERE "CarreraId" = $1) 
        EXCEPT (
            SELECT "MateriaId"
            FROM "aida"."cursa"
            WHERE lu = $2 AND "NotaFinal" >= 4
        )`,
        [carreraId, lu]
    ); 

    // 3. Egresar si no faltan materias
    if (materiasFaltantesResult.rows.length === 0) {
        // Usamos NOW() o CURRENT_TIMESTAMP en PostgreSQL en lugar de GETDATE()
        await pool.query(
            `UPDATE "aida"."alumnos" 
            SET egreso = NOW(), titulo_en_tramite = NOW()
            WHERE lu = $1`,
            [lu]
        );
        generarTituloPorLU(lu ,"/certificados");
    }
}

// ---
// ⚠️ NOTA IMPORTANTE sobre `queries-genericas.js`:
// Estas funciones ahora deben generar SQL compatible con PostgreSQL (p. ej., usando comillas
// dobles "nombre_columna" en lugar de corchetes [nombre_columna] y usando $1, $2, etc.
// para los placeholders, en lugar de @nombre).
// ---

/**
 * RUTAS CRUD
 */

// ---------------- GET ALL ----------------
router.get("/:tabla/:plural", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const userRole = req.user?.rol;
        // 4. ⬇️ El pool es ahora un objeto `pg.Pool`
        const pool = await obtenerPoolPorRol(userRole);
        
        if (!pool) return res.status(500).json({ error: "No hay conexión a BD disponible" });
        if (!tabla) return res.status(400).json({ error: "Falta el nombre de la tabla" });

        // 1. Obtenemos metadata para saber cuál es la PK y poder ORDENAR
        const meta = await obtenerMetadataTabla(tabla);
        const pkNames = meta.pk.map(p => p.pk);
        
        // 2. Pasamos los nombres de PK para que la query arme el ORDER BY correcto
        const query = buildSelectAllQuery(tabla, pkNames);
        // 5. ⬇️ Ejecución directa con pool.query()
        const result = await pool.query(query); 

        // 6. ⬇️ Accedemos a los resultados con `result.rows`
        return res.json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registros" });
    }
});

// ---------------- GET ONE ----------------
router.get("/:tabla/:singular/:id", verificarTokenMiddleware, async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const pool = await obtenerPoolPorRol('administrador');
        
        // Decodificamos ID compuesto
        const idParts = req.params.id?.split("__").map(decodeURIComponent);
        if (idParts?.includes('actualLU')){
            idParts[0] = req.user?.lu ?? ''
        }
        
        if (!pool) return res.status(500).json({ error: "No hay conexión a BD" });
        if (!tabla) return res.status(400).json({ error: "Falta tabla" });

        const meta = await obtenerMetadataTabla(tabla);
        const pkInfo = meta.pk; // Array de objetos { pk: "nombreCol" }

        // Validación de cantidad de parámetros
        if (!idParts || idParts.length !== pkInfo.length) {
            return res.status(400).json({ error: "ID incorrecto para esta tabla" });
        }
        
        // 7. ⬇️ Ahora no usamos `pool.request()`. Armamos la query con placeholders $1, $2, etc.
        const whereConditions: string[] = [];
        const params: (string | null | undefined)[] = []; // Array para los valores de los parámetros

        // Inyectamos valores y preparamos condiciones WHERE (col = $n)
        idParts.forEach((id, index) => {
            const pkName = pkInfo[index].pk;
            params.push(id);
            // El placeholder en PostgreSQL es posicional ($1, $2, ...)
            whereConditions.push(`"${pkName}" = $${index + 1}`); 
        });

        // Usamos SelectBase (SIN Order By) + WHERE construído con AND
        // Se asume que buildSelectBaseQuery genera SQL de PostgreSQL
        const stringQuery = `${buildSelectBaseQuery(tabla)} WHERE ${whereConditions.join(" AND ")}`;
        
        // 8. ⬇️ Ejecutamos la query pasando el array de parámetros
        const result = await pool.query(stringQuery, params);

        // Retornamos el array de objetos, o solo el primer elemento si quieres un objeto único
        // if (!result.rows.length) return res.status(404).json({ error: "No encontrado" });
        return res.json(result.rows); 
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registro" });
    }
});

// ---------------- POST ----------------
router.post("/:tabla/:singular", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const userRole = req.user?.rol;
        const pool = await obtenerPoolPorRol(userRole);
        const body = req.body;

        if (!pool) return res.status(500).json({ error: "No hay conexión" });
        if (!tabla) return res.status(400).json({ error: "Falta tabla" });

        const meta = await obtenerMetadataTabla(tabla);

        const columnasInsertables = meta.columns
            .filter(c => !c.identity)
            .map(c => c.name);

        // 9. ⬇️ Creamos los arrays para los valores y los placeholders
        const values: (any)[] = [];
        const placeholders: string[] = [];
        
        columnasInsertables.forEach((c, index) => {
            values.push(body[c] ?? null);
            // Placeholder posicional: $1, $2, $3...
            placeholders.push(`$${index + 1}`); 
        });

        // Se asume que buildInsertQuery recibe los nombres de las columnas y los placeholders
        const insertQuery = buildInsertQuery(tabla, columnasInsertables, placeholders);

        // 10. ⬇️ Ejecutamos la query
        await pool.query(insertQuery, values);

        if (tabla === 'aida.cursa'){ // Se usa triple igual para mayor consistencia
            egresarAlumnoAutomaticamente(body['lu'], pool).catch(console.error);
        }

        return res.status(201).json({ mensaje: "Registro creado" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al insertar registro" });
    }
});

// ---------------- PUT (Actualización Dinámica / Parcial) ----------------
router.put("/:tabla/:singular/:id", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const userRole = req.user?.rol;
        const pool = await obtenerPoolPorRol(userRole);
        
        const idParts = req.params.id?.split('__').map(decodeURIComponent);
        const body = req.body; 

        if (!pool) return res.status(500).json({ error: "No hay conexión" });
        if (!tabla) return res.status(400).json({ error: "Falta tabla" });

        const meta = await obtenerMetadataTabla(tabla);
        const pkNames = meta.pk.map(p => p.pk); 

        const columnasAActualizar = meta.columns
            .filter(c => !pkNames.includes(c.name)) 
            .filter(c => Object.prototype.hasOwnProperty.call(body, c.name)) 
            .map(c => c.name);

        if (columnasAActualizar.length === 0) {
            return res.status(400).json({ error: "No se enviaron datos válidos para actualizar." });
        }

        // 11. ⬇️ La lógica cambia: armamos dos sets de parámetros (SET y WHERE)
        const updateValues: (any)[] = [];
        const updateSets: string[] = [];
        let paramIndex = 1;

        // 1. Inyectamos los valores del Body (Para el SET: "col" = $1, "col2" = $2)
        columnasAActualizar.forEach(c => {
            updateValues.push(body[c]);
            updateSets.push(`"${c}" = $${paramIndex++}`); 
        });
        
        // 2. Inyectamos los valores de la PK (Para el WHERE: "pk1" = $N, "pk2" = $N+1)
        const whereConditions: string[] = [];
        pkNames.forEach((p) => {
            updateValues.push(idParts?.[updateValues.length - columnasAActualizar.length]);
            whereConditions.push(`"${p}" = $${paramIndex++}`);
        });

        // 3. Construimos la query (se asume que buildUpdateQuery usa los arrays)
        const query = buildUpdateQuery(
            tabla, 
            updateSets, // Contiene "col = $n"
            whereConditions // Contiene "pk = $n"
        ); 

        // 4. Ejecutamos
        const result = await pool.query(query, updateValues);
        
        // rowsAffected es un array de números en mssql. En pg, es una propiedad simple
        // 'rowCount' en el objeto resultado de `pg`
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "No se encontró el registro para actualizar (ID incorrecto)" });
        }

        // 5. Lógica extra (egresos)
        if (tabla === 'aida.cursa'){
             if(idParts) egresarAlumnoAutomaticamente(idParts[0] ?? "", pool).catch(console.error);
        }

        return res.json({ mensaje: "Registro actualizado" });
    } catch (err) {
        console.error("❌ ERROR PUT:", err);
        // El error de pg puede no tener la propiedad `message` de forma directa
        return res.status(500).json({ error: "Error al actualizar registro", detalle: (err as Error).message });
    }
});


// ---------------- DELETE ----------------
router.delete("/:tabla/:plural/:id", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const idParts = req.params.id?.split('__').map(decodeURIComponent);

        const userRole = req.user?.rol;
        const pool = await obtenerPoolPorRol(userRole);

        if (!pool) return res.status(500).json({ error: "No hay conexión" });
        if (!tabla) return res.status(400).json({ error: "Falta tabla" });

        const meta = await obtenerMetadataTabla(tabla);
        const pk = meta.pk;

        if (!idParts || idParts.length !== pk.length) {
            return res.status(400).json({ error: "ID inválido para esta tabla" });
        }
        
        // 12. ⬇️ Armamos los arrays para la query de DELETE
        const params: (string | null | undefined)[] = [];
        const pkConditions: string[] = [];

        // Asignación de parámetros posicionales
        pk.forEach((p, indice) => {
            params.push(idParts?.[indice]);
            pkConditions.push(`"${p.pk}" = $${indice + 1}`);
        });

        // Ejecución (asumiendo que buildDeleteQuery usa la condición WHERE)
        const querySql = buildDeleteQuery(tabla, pkConditions); // Pasamos las condiciones ya listas

        // 13. ⬇️ Ejecución y chequeo de rowCount
        const result = await pool.query(querySql, params);

        // Verificación de éxito
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "El registro no existe o no se pudo eliminar." });
        }

        return res.json({ mensaje: "Registro eliminado" });
    } catch (err) {
        console.error("Error en DELETE:", err);
        return res.status(500).json({ error: "Error al eliminar registro" });
    }
});

export default router;