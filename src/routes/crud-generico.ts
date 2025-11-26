import { Router } from "express";
import { verificarTokenMiddleware, requireRole } from "../auth.js";
import { obtenerMetadataTabla } from "../bd/metadata.js";
import { getOwnerPool } from "../bd/conecciones-bd.js";
import sql from "mssql";
import {
    buildSelectAllQuery,
    //buildSelectQuery,
    buildWherePk,
    buildInsertQuery,
    buildUpdateQuery,
    buildDeleteQuery
} from "../bd/queries-genericas.js"

const router = Router();


// async function egresarAlumnoAutomaticamente(lu:string){

//     const pool = await getAdminPool();

//     const carrera = pool.request().query(`SELECT CarreraId FROM aida.estudiante_de WHERE lu = ${lu}`)

//     const materiasFaltantesAlumno = pool.request().query(`(SELECT MateriaId 
//         FROM aida.plan_de_estudios 
//         WHERE CarreraId = ${(await carrera).recordset[0]}) 
//         EXCEPT (
//         SELECT MateriaId
//         FROM aida.cursa
//         WHERE lu = ${lu} AND NotaFinal >= 4
//         )`) 

//     if ((await materiasFaltantesAlumno).recordset.length == 0){
//         pool.request().query(`UPDATE aida.alumnos 
//         SET egreso = GETDATE(), titulo_en_tramite = GETDATE()
//         WHERE lu = ${lu}`)
//     }
// }

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
router.get("/:tabla/:plural", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        if (!tabla) {
        return res.status(400).json({ error: "Falta el nombre de la tabla" });
        }

        const pool = await getOwnerPool();
        const result = await pool.request().query(buildSelectAllQuery(tabla));

        return res.json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registros" });
    }
});

router.get("/:tabla/:singular/:id", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const id = req.params.id?.split("__").map(decodeURIComponent);

        if (!tabla) {
        return res.status(400).json({ error: "Falta el nombre de la tabla" });
        }

        const meta = await obtenerMetadataTabla(tabla);
        const pk = meta.pk;

        const pool = await getOwnerPool();

        const request = await pool.request();
            //.input("pk", sql.NVarChar, id)
            //.query(`${buildSelectAllQuery(tabla)} ${buildWherePk(pk)}`);
        
        pk.forEach((p,indice) => request.input(p.pk, sql.NVarChar, id?.[indice]));
        let stringQuery = `${buildSelectAllQuery(tabla)}`;
        pk.forEach(p => stringQuery.concat(` ${buildWherePk(p.pk, p.pk)}`));
        const result = await request.query(stringQuery);

        if (!result.recordset.length)
            return res.status(404).json({ error: "No encontrado" });

        return res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registro" });
    }
});

router.post("/:tabla/:singular", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
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

        const pool = await getOwnerPool();

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

router.put("/:tabla/:singular/:id", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const id = req.params.id?.split('__').map(decodeURIComponent);
        const body = req.body;

        if (!tabla) {
        return res.status(400).json({ error: "Falta el nombre de la tabla" });
        }

        const meta = await obtenerMetadataTabla(tabla);
        const pk = meta.pk.map(p => p.pk);

        const columnasEditables = meta.columns
            .filter(c => !pk.includes(c.name))
            .map(c => c.name);

        const pool = await getOwnerPool();
        const request = pool.request();

        // request.input("pk", sql.NVarChar, id);

        pk.forEach((p,indice) => request.input(p, sql.NVarChar, id?.[indice]));
        columnasEditables.forEach(c => {
            request.input(c, sql.NVarChar, body[c] ?? null);
        });

        await request.query(buildUpdateQuery(tabla, columnasEditables, pk));

        if (tabla == 'cursa'){
            console.log(id)
        }

        return res.json({ mensaje: "Registro actualizado" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al actualizar registro" });
    }
});

router.delete("/:tabla/:plural/:id", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const id = req.params.id?.split('__').map(decodeURIComponent);

        if (!tabla) {
        return res.status(400).json({ error: "Falta el nombre de la tabla" });
        }

        const meta = await obtenerMetadataTabla(tabla);
        const pk = meta.pk;


        const pool = await getOwnerPool();
        const request = await pool.request()

        pk.forEach((p,indice) => request.input(p.pk, sql.NVarChar, id?.[indice]));

        await request.query(buildDeleteQuery(tabla, pk.map(p => p.pk)));
        return res.json({ mensaje: "Registro eliminado" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al eliminar registro" });
    }
});

export default router;
