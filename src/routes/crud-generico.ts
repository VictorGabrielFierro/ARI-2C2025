import { Router } from "express";
import { verificarTokenMiddleware, requireRole } from "../auth.js";
import { obtenerMetadataTabla } from "../bd/metadata.js";
import { obtenerPoolPorRol } from "../bd/conecciones-bd.js";
import sql, { ConnectionPool } from "mssql";
import {
    buildSelectAllQuery,
    buildSelectBaseQuery, // IMPORTANTE: Agregada esta importación
    buildInsertQuery,
    buildUpdateQuery,
    buildDeleteQuery
} from "../bd/queries-genericas.js"
import { generarTituloPorLU } from "../certificados.js"

const router = Router();

async function egresarAlumnoAutomaticamente(lu:string, pool:ConnectionPool){
    // ... (Tu lógica de egreso se mantiene igual) ...
    const carrera = pool.request().
    input('lu', sql.NVarChar, lu).
    query(`SELECT CarreraId FROM aida.estudiante_de WHERE lu = @lu`)

    // Ojo: Valida que exista alumno antes de acceder a [0]
    if ((await carrera).recordset.length === 0) return;

    const carreraId = (await carrera).recordset[0].CarreraId;

    const materiasFaltantesAlumno = await pool.request()
    .input("carreraId", sql.Int, carreraId)
    .input("lu", sql.NVarChar, lu)
    .query(`(SELECT MateriaId 
        FROM aida.plan_de_estudios 
        WHERE CarreraId = @carreraId) 
        EXCEPT (
        SELECT MateriaId
        FROM aida.cursa
        WHERE lu = @lu AND NotaFinal >= 4
        )`) 

    if ((await materiasFaltantesAlumno).recordset.length == 0){
        pool.request()
        .input("lu", sql.NVarChar, lu)
        .query(`UPDATE aida.alumnos 
        SET egreso = GETDATE(), titulo_en_tramite = GETDATE()
        WHERE lu = @lu`);
        generarTituloPorLU(lu ,"/certificados");
    }
}

/**
 * RUTAS CRUD
 */

// ---------------- GET ALL ----------------
router.get("/:tabla/:plural", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const userRole = req.user?.rol;
        const pool = await obtenerPoolPorRol(userRole);
        
        if (!pool) return res.status(500).json({ error: "No hay conexión a BD disponible" });
        if (!tabla) return res.status(400).json({ error: "Falta el nombre de la tabla" });

        // 1. Obtenemos metadata para saber cuál es la PK y poder ORDENAR
        const meta = await obtenerMetadataTabla(tabla);
        const pkNames = meta.pk.map(p => p.pk);
        
        // 2. Pasamos los nombres de PK para que la query arme el ORDER BY correcto
        const query = buildSelectAllQuery(tabla, pkNames);
        const result = await pool.request().query(query);

        return res.json(result.recordset);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener registros" });
    }
});

// ---------------- GET ONE ----------------
router.get("/:tabla/:singular/:id", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const userRole = req.user?.rol;
        const pool = await obtenerPoolPorRol(userRole);
        // Decodificamos ID compuesto
        const idParts = req.params.id?.split("__").map(decodeURIComponent);
        
        if (!pool) return res.status(500).json({ error: "No hay conexión a BD" });
        if (!tabla) return res.status(400).json({ error: "Falta tabla" });

        const meta = await obtenerMetadataTabla(tabla);
        const pkInfo = meta.pk; // Array de objetos { pk: "nombreCol" }

        // Validación de cantidad de parámetros
        if (!idParts || idParts.length !== pkInfo.length) {
            return res.status(400).json({ error: "ID incorrecto para esta tabla" });
        }

        const request = await pool.request();
        const whereConditions: string[] = [];

        // Inyectamos valores y preparamos condiciones WHERE (col = @col)
        pkInfo.forEach((p, index) => {
            request.input(p.pk, sql.NVarChar, idParts[index]);
            whereConditions.push(`[${p.pk}] = @${p.pk}`);
        });

        // Usamos SelectBase (SIN Order By) + WHERE construído con AND
        const stringQuery = `${buildSelectBaseQuery(tabla)} WHERE ${whereConditions.join(" AND ")}`;
        
        const result = await request.query(stringQuery);


        if (!result.recordset.length)
            return res.status(404).json({ error: "No encontrado" });

        // Retornamos el objeto solo (no array)
        return res.json(result.recordset[0]); 
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

        const request = pool.request();
        columnasInsertables.forEach(c => {
            request.input(c, sql.NVarChar, body[c] ?? null);
        });

        await request.query(buildInsertQuery(tabla, columnasInsertables));

        if (tabla == 'aida.cursa'){
            // No usamos await aquí para no bloquear la respuesta al usuario, 
            // a menos que sea critico que termine antes de responder.
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
        
        // Decodificamos el ID
        const idParts = req.params.id?.split('__').map(decodeURIComponent);
        const body = req.body; // Los datos nuevos

        if (!pool) return res.status(500).json({ error: "No hay conexión" });
        if (!tabla) return res.status(400).json({ error: "Falta tabla" });

        // 1. Obtenemos Metadata (Qué columnas existen y cuáles son PK)
        const meta = await obtenerMetadataTabla(tabla);
        const pkNames = meta.pk.map(p => p.pk); 

        // 2. FILTRO DE COLUMNAS (La parte importante)
        // Seleccionamos solo las columnas que:
        // A) No sean Clave Primaria (no se editan)
        // B) Existan en el 'body' que envió el usuario
        // C) (Opcional) Que el valor no sea null si quieres protegerte extra
        const columnasAActualizar = meta.columns
            .filter(c => !pkNames.includes(c.name)) // Excluir PKs
            .filter(c => Object.prototype.hasOwnProperty.call(body, c.name)) // Solo las que vienen en el body
            .map(c => c.name);

        if (columnasAActualizar.length === 0) {
            return res.status(400).json({ error: "No se enviaron datos válidos para actualizar." });
        }

        const request = pool.request();

        // 3. Inyectamos los valores de la PK (Para el WHERE)
        pkNames.forEach((p, indice) => {
            request.input(p, sql.NVarChar, idParts?.[indice]);
        });
        
        // 4. Inyectamos los valores del Body (Para el SET)
        columnasAActualizar.forEach(c => {
            const valor = body[c];
            // Aquí SQL Server recibirá el valor exacto que mandó el frontend
            request.input(c, sql.NVarChar, valor); 
        });

        // 5. Construimos la query SOLO con las columnas filtradas
        const query = buildUpdateQuery(tabla, columnasAActualizar, pkNames);

        // Debug (Opcional, para que veas qué query se armó)
        // console.log("Query dinámica:", query); 

        const result = await request.query(query);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "No se encontró el registro para actualizar (ID incorrecto)" });
        }

        // 6. Lógica extra (egresos)
        if (tabla == 'aida.cursa'){
             // Usamos catch para que un error en el egreso no falle la request HTTP
             if(idParts) egresarAlumnoAutomaticamente(idParts[0] ?? "", pool).catch(console.error);
        }

        return res.json({ mensaje: "Registro actualizado" });
    } catch (err) {
        console.error("❌ ERROR PUT:", err);
        // Devolvemos el mensaje detallado de SQL para facilitar el debug
        return res.status(500).json({ error: "Error al actualizar registro", detalle: (err as any).message });
    }
});


// ---------------- DELETE (Con Logs Debug) ----------------
router.delete("/:tabla/:plural/:id", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const tabla = req.params.tabla;
        const rawId = req.params.id;
        const idParts = req.params.id?.split('__').map(decodeURIComponent);

        // --- DEBUG START ---
        console.log(`\n🟠 --- INICIO DELETE DEBUG ---`);
        console.log(`1. Tabla objetivo: ${tabla}`);
        console.log(`2. ID Recibido (URL): ${rawId}`);
        console.log(`3. ID Parseado:`, idParts);
        // --- DEBUG END ---

        const userRole = req.user?.rol;
        const pool = await obtenerPoolPorRol(userRole);

        if (!pool) return res.status(500).json({ error: "No hay conexión" });
        if (!tabla) return res.status(400).json({ error: "Falta tabla" });

        const meta = await obtenerMetadataTabla(tabla);
        const pk = meta.pk; // Array de objetos

        console.log(`4. Metadata PKs:`, pk.map(p => p.pk)); // DEBUG

        // Validación extra de seguridad
        if (!idParts || idParts.length !== pk.length) {
            console.error(`❌ Error: Cantidad de IDs (${idParts?.length}) no coincide con PKs (${pk.length})`);
            return res.status(400).json({ error: "ID inválido para esta tabla" });
        }

        const request = await pool.request();

        pk.forEach((p, indice) => {
            const valor = idParts?.[indice];
            console.log(`   -> Asignando Param: @${p.pk} = '${valor}'`); // DEBUG
            request.input(p.pk, sql.NVarChar, valor);
        });

        const querySql = buildDeleteQuery(tabla, pk.map(p => p.pk));
        console.log(`5. SQL Generado: ${querySql}`); // DEBUG

        const result = await request.query(querySql);
        console.log(`6. Rows Affected:`, result.rowsAffected); // DEBUG
        console.log(`🔴 --- FIN DELETE DEBUG ---\n`);

        // Verificamos si realmente se borró algo
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "El registro no existe o no se pudo eliminar." });
        }

        return res.json({ mensaje: "Registro eliminado" });
    } catch (err) {
        console.error("❌ ERROR DELETE:", err);
        return res.status(500).json({ error: "Error al eliminar registro" });
    }
});

export default router;