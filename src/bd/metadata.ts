import sql from "mssql";
import { getAdminPool } from "./conecciones-bd.js";

export async function obtenerMetadataTabla(nombreTabla: string) {
    const pool = await getAdminPool();

    const columnasQuery = `
        SELECT 
            c.name AS nombre,
            t.name AS tipo,
            c.is_nullable AS nullable,
            c.is_identity AS identity_column
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID(@tabla)
        ORDER BY c.column_id;
    `;

    const pkQuery = `
        SELECT COL_NAME(ic.object_id, ic.column_id) AS pk
        FROM sys.indexes i 
        INNER JOIN sys.index_columns ic 
            ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        WHERE i.is_primary_key = 1 AND i.object_id = OBJECT_ID(@tabla)
        ORDER BY ic.key_ordinal;
    `;

    const [columnasRes, pkRes] = await Promise.all([
        pool.request().input("tabla", sql.VarChar, nombreTabla).query(columnasQuery),
        pool.request().input("tabla", sql.VarChar, nombreTabla).query(pkQuery)
    ]);

    const columnas = columnasRes.recordset.map((col: any) => ({
        name: col.nombre,
        type: col.tipo,
        nullable: col.nullable === 1,
        identity: col.identity_column === 1,
        editable: col.identity_column !== 1 // Las identity se consideran no editables
    }));

    const pk = pkRes.recordset;

    return { table: nombreTabla, pk, columns: columnas };
}
