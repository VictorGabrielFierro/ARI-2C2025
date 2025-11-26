import { Router } from "express";
import { verificarTokenMiddleware } from "../auth.js";
import { obtenerMetadataTabla } from "../bd/metadata.js";
import { getAdminPool } from "../bd/conecciones-bd.js";
import sql from "mssql";

const router = Router();

/**
 * Helper: arma query SELECT * FROM tabla
 */
function buildSelectAllQuery(tabla: string) {
    return `SELECT * FROM ${tabla}`;
}

/**
 * Helper: arma WHERE pk = @pk
 */
function buildWherePk(pkCol: string) {
    return `WHERE ${pkCol} = @pk`;
}

/**
 * Helper: arma INSERT dinámico
 */
function buildInsertQuery(tabla: string, cols: string[]) {
    const columnas = cols.join(", ");
    const valores = cols.map(c => `@${c}`).join(", ");
    return `INSERT INTO ${tabla} (${columnas}) VALUES (${valores})`;
}

/**
 * Helper: arma UPDATE dinámico
 */
function buildUpdateQuery(tabla: string, cols: string[], pkCol: string) {
    const sets = cols.map(c => `${c} = @${c}`).join(", ");
    return `UPDATE ${tabla} SET ${sets} WHERE ${pkCol} = @pk`;
}

/**
 * Helper: DELETE
 */
function buildDeleteQuery(tabla: string, pkCol: string) {
    return `DELETE FROM ${tabla} WHERE ${pkCol} = @pk`;
}

/**
 * 🚨 RUTA GENÉRICA CRUD
 *
 * Todas las operaciones son:
 *
 * GET    /crud/:tabla/:plural
 * GET    /crud/:tabla/:singular/:id
 * POST   /crud/:tabla/:singular
 * PUT    /crud/:tabla/:singular/:id
 * DELETE /crud/:tabla/:plural/:id
 */
router.get("/:tabla/:plural", verificarTokenMiddleware, async (req, res) => {
    try {
        const tabla = req.params.tabla;
        if (!tabla) {
        return res.status(400).json({ error: "Falta el nombre de la tabla" });
        }

        const pool = await getAdminPool();
        const result = await pool.request().query(buildSelectAllQuery(tabla));

        return res.json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registros" });
    }
});

router.get("/:tabla/:singular/:id", verificarTokenMiddleware, async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const id = req.params.id;

        if (!tabla) {
        return res.status(400).json({ error: "Falta el nombre de la tabla" });
        }

        const meta = await obtenerMetadataTabla(tabla);
        const pk = meta.pk;

        const pool = await getAdminPool();

        const result = await pool.request()
            .input("pk", sql.NVarChar, id)
            .query(`${buildSelectAllQuery(tabla)} ${buildWherePk(pk)}`);

        if (!result.recordset.length)
            return res.status(404).json({ error: "No encontrado" });

        return res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registro" });
    }
});

router.post("/:tabla/:singular", verificarTokenMiddleware, async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const body = req.body;

        if (!tabla) {
        return res.status(400).json({ error: "Falta el nombre de la tabla" });
        }

        const meta = await obtenerMetadataTabla(tabla);

        const columnasInsertables = meta.columns
            .filter(c => !c.identity)
            .map(c => c.name);

        const pool = await getAdminPool();

        const request = pool.request();
        columnasInsertables.forEach(c => {
            request.input(c, sql.NVarChar, body[c] ?? null);
        });

        await request.query(buildInsertQuery(tabla, columnasInsertables));

        return res.status(201).json({ mensaje: "Registro creado" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al insertar registro" });
    }
});

router.put("/:tabla/:singular/:id", verificarTokenMiddleware, async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const id = req.params.id;
        const body = req.body;

        if (!tabla) {
        return res.status(400).json({ error: "Falta el nombre de la tabla" });
        }

        const meta = await obtenerMetadataTabla(tabla);
        const pk = meta.pk;

        const columnasEditables = meta.columns
            .filter(c => !c.identity)
            .map(c => c.name);

        const pool = await getAdminPool();
        const request = pool.request();

        request.input("pk", sql.NVarChar, id);
        columnasEditables.forEach(c => {
            request.input(c, sql.NVarChar, body[c] ?? null);
        });

        await request.query(buildUpdateQuery(tabla, columnasEditables, pk));

        return res.json({ mensaje: "Registro actualizado" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar registro" });
    }
});

router.delete("/:tabla/:plural/:id", verificarTokenMiddleware, async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const id = req.params.id;

        if (!tabla) {
        return res.status(400).json({ error: "Falta el nombre de la tabla" });
        }

        const meta = await obtenerMetadataTabla(tabla);
        const pk = meta.pk;

        const pool = await getAdminPool();
        await pool.request()
            .input("pk", sql.NVarChar, id)
            .query(buildDeleteQuery(tabla, pk));

        return res.json({ mensaje: "Registro eliminado" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar registro" });
    }
});

export default router;
