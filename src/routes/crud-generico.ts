import { Router } from "express";
import { verificarTokenMiddleware, requireRole } from "../auth.js";
import { obtenerMetadataTabla } from "../bd/metadata.js";
import { obtenerPoolPorRol } from "../bd/conecciones-bd.js"; 
import { Pool } from "pg"; 
import {
    //buildSelectAllQuery,
    buildSelectBaseQuery,
    buildSelectWithJoins,
    buildInsertQuery,
    buildUpdateQuery,
    buildDeleteQuery
} from "../bd/queries-genericas.js"
import { generarTituloPorLU } from "../certificados.js"

const router = Router();

// Esta funcion se encarga de verificar si un alumno esta egresado
// Se ejecuta cada vez que se actualiza la tabla de cursa (a través del crud generico)
// Cumple la funcionalidad pedida en la clase 8
async function egresarAlumnoAutomaticamente(lu: string, pool: Pool) {
    const carreraResult = await pool.query(
        `SELECT "CarreraId" FROM "aida"."estudiante_de" WHERE lu = $1`, 
        [lu]
    );

    if (carreraResult.rows.length === 0) return;
    const carreraId = carreraResult.rows[0].CarreraId;

    const materiasFaltantesResult = await pool.query(
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

    if (materiasFaltantesResult.rows.length === 0) {
        await pool.query(
            `UPDATE "aida"."alumnos" 
            SET egreso = NOW(), titulo_en_tramite = NOW()
            WHERE lu = $1`,
            [lu]
        );
        generarTituloPorLU(lu ,"/certificados");
    }
}


// Obtener la tabla entera
router.get("/:tabla", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const userRole = req.user?.rol;
        const pool = await obtenerPoolPorRol(userRole);
        
        if (!pool) return res.status(500).json({ error: "No hay conexión a BD disponible" });
        if (!tabla) return res.status(400).json({ error: "Falta el nombre de la tabla" });

        const meta = await obtenerMetadataTabla(tabla);
        if(!meta) return res.status(501).json({error: "Error en el sistema, faltan los metadatos de la tabla a cargar"})
        //const pkNames = meta.pk.map(p => p.pk);
        
        const query = buildSelectWithJoins(tabla, meta);
        const result = await pool.query(query); 

        return res.json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registros" });
    }
});

// Obtener resultados filtrados de una tabla
router.get("/:tabla/:id", verificarTokenMiddleware, async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const pool = await obtenerPoolPorRol('administrador');
        
        const idParts = req.params.id?.split("__").map(decodeURIComponent);
        if (idParts?.includes('actualLU')){
            idParts[0] = req.user?.lu ?? ''
        }
        
        if (!pool) return res.status(500).json({ error: "No hay conexión a BD" });
        if (!tabla) return res.status(400).json({ error: "Falta tabla" });

        const meta = await obtenerMetadataTabla(tabla);
        if(!meta) return res.status(501).json({error: "Error en el sistema, faltan los metadatos de la tabla a cargar"})
        const pkInfo = meta.pk;

        if (!idParts) {
            return res.status(400).json({ error: "ID incorrecto para esta tabla" });
        }
        
        const whereConditions: string[] = [];
        const params: (string | null | undefined)[] = [];

        idParts.forEach((id, index) => {
            const pkName = pkInfo[index]?.pk;
            params.push(id);
            whereConditions.push(`"${pkName}" = $${index + 1}`); 
        });

        const stringQuery = `${buildSelectBaseQuery(tabla)} WHERE ${whereConditions.join(" AND ")}`;
        
        const result = await pool.query(stringQuery, params);

        return res.json(result.rows); 
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registro" });
    }
});

// Insertar un valor en la tabla
router.post("/:tabla", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const userRole = req.user?.rol;
        const pool = await obtenerPoolPorRol(userRole);
        const body = req.body;

        if (!pool) return res.status(500).json({ error: "No hay conexión" });
        if (!tabla) return res.status(400).json({ error: "Falta tabla" });

        const meta = await obtenerMetadataTabla(tabla);
        if(!meta) return res.status(501).json({error: "Error en el sistema, faltan los metadatos de la tabla a cargar"})

        const columnasInsertables = meta.columns
            .filter(c => !c.identity)
            .map(c => c.name);

        const values: (any)[] = [];
        const placeholders: string[] = [];
        
        columnasInsertables.forEach((c, index) => {
            values.push(body[c] ?? null);
            placeholders.push(`$${index + 1}`); 
        });

        const insertQuery = buildInsertQuery(tabla, columnasInsertables);

        await pool.query(insertQuery, values);

        if (tabla === 'aida.cursa'){
            egresarAlumnoAutomaticamente(body['lu'], pool).catch(console.error);
        }

        return res.status(201).json({ mensaje: "Registro creado" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al insertar registro" });
    }
});

// Actualizamos una entrada
router.put("/:tabla/:id", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const userRole = req.user?.rol;
        const pool = await obtenerPoolPorRol(userRole);
        
        const idParts = req.params.id?.split('__').map(decodeURIComponent);
        const body = req.body; 

        if (!pool) return res.status(500).json({ error: "No hay conexión" });
        if (!tabla) return res.status(400).json({ error: "Falta tabla" });

        const meta = await obtenerMetadataTabla(tabla);
        if(!meta) return res.status(501).json({error: "Error en el sistema, faltan los metadatos de la tabla a cargar"})
        const pkNames = meta.pk.map(p => p.pk); 

        const columnasAActualizar = meta.columns
            .filter(c => !pkNames.includes(c.name)) 
            .filter(c => Object.prototype.hasOwnProperty.call(body, c.name)) 
            .map(c => c.name);

        if (columnasAActualizar.length === 0) {
            return res.status(400).json({ error: "No se enviaron datos válidos para actualizar." });
        }

        const updateValues: (any)[] = [];
        const updateSets: string[] = [];
        let paramIndex = 1;

        columnasAActualizar.forEach(c => {
            updateValues.push(body[c]);
            updateSets.push(`"${c}" = $${paramIndex++}`); 
        });
        
        const whereConditions: string[] = [];
        pkNames.forEach((p) => {
            updateValues.push(idParts?.[updateValues.length - columnasAActualizar.length]);
            whereConditions.push(`"${p}" = $${paramIndex++}`);
        });

        const query = buildUpdateQuery(
            tabla, 
            updateSets,
            whereConditions
        ); 

        const result = await pool.query(query, updateValues);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "No se encontró el registro para actualizar (ID incorrecto)" });
        }

        if (tabla === 'aida.cursa'){
             if(idParts) egresarAlumnoAutomaticamente(idParts[0] ?? "", pool).catch(console.error);
        }

        return res.json({ mensaje: "Registro actualizado" });
    } catch (err) {
        console.error("ERROR PUT:", err);
        return res.status(500).json({ error: "Error al actualizar registro", detalle: (err as Error).message });
    }
});


// Eliminar una entrada
router.delete("/:tabla/:id", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const idParts = req.params.id?.split('__').map(decodeURIComponent);

        const userRole = req.user?.rol;
        const pool = await obtenerPoolPorRol(userRole);

        if (!pool) return res.status(500).json({ error: "No hay conexión" });
        if (!tabla) return res.status(400).json({ error: "Falta tabla" });

        const meta = await obtenerMetadataTabla(tabla);
        if(!meta) return res.status(501).json({error: "Error en el sistema, faltan los metadatos de la tabla a cargar"})
        const pk = meta.pk;

        if (!idParts || idParts.length !== pk.length) {
            return res.status(400).json({ error: "ID inválido para esta tabla" });
        }
        
        const params: (string | null | undefined)[] = [];
        const pkConditions: string[] = [];

        pk.forEach((p, indice) => {
            params.push(idParts?.[indice]);
            pkConditions.push(`"${p.pk}" = $${indice + 1}`);
        });

        const querySql = buildDeleteQuery(tabla, pkConditions);
        const result = await pool.query(querySql, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "El registro no existe o no se pudo eliminar." });
        }

        return res.json({ mensaje: "Registro eliminado" });
    } catch (err) {
        console.error("Error en DELETE:", err);
        return res.status(500).json({ error: "Error al eliminar registro", 
            code: Number((err as any).code), 
            tableWithError: String((err as any).table)});
    }
});

export default router;