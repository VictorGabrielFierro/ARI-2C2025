// metadatos.ts (Adaptado para PostgreSQL)

import { Pool, QueryResult } from "pg";
import { getOwnerPool } from "./conecciones-bd.js";

// ⚠️ NOTA: Si nombreTabla ya incluye el esquema (ej: 'aida.alumnos'), necesitamos dividirlo
// para que funcione con information_schema.

/**
 * Función que obtiene la metadata de una tabla específica (columnas y claves primarias).
 * @param nombreTabla El nombre de la tabla, puede incluir esquema (ej: 'aida.alumnos').
 */
export async function obtenerMetadataTabla(nombreTabla: string) {
    const pool: Pool = await getOwnerPool();

    // Dividir el nombre de la tabla en esquema y nombre (si aplica)
    const parts = nombreTabla.split('.');
    const schemaName = parts.length > 1 ? parts[0] : 'public';
    const tableName = parts.length > 1 ? parts[1] : parts[0];


    // 1. Consulta de Columnas (Usando information_schema.columns y pg_catalog.pg_attribute)
    // Buscamos: nombre, tipo de dato, nulabilidad, si es una columna IDENTITY/SERIAL (auto-incremento)
    const columnasQuery = `
        SELECT
            c.column_name AS nombre,
            c.data_type AS tipo,
            CASE WHEN c.is_nullable = 'YES' THEN TRUE ELSE FALSE END AS nullable,
            -- Verifica si la columna tiene una secuencia asociada (típico de SERIAL/IDENTITY en PG)
            a.attidentity = 'a' OR a.attidentity = 'd' AS identity_column
        FROM information_schema.columns c
        JOIN pg_catalog.pg_class t ON t.relname = $2
        JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace AND n.nspname = $1
        JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attname = c.column_name
        WHERE c.table_schema = $1 AND c.table_name = $2
        ORDER BY c.ordinal_position;
    `;

    // 2. Consulta de Clave Primaria (Usando information_schema.table_constraints y key_column_usage)
    // Buscamos: el nombre de la columna que compone la clave primaria
    const pkQuery = `
        SELECT kcu.column_name AS pk
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
        ORDER BY kcu.ordinal_position;
    `;

    // 3. Ejecución de Consultas (en paralelo con pool.query)
    const [columnasRes, pkRes] = await Promise.all([
        // Parámetros: $1 = schemaName, $2 = tableName
        pool.query(columnasQuery, [schemaName, tableName]), 
        pool.query(pkQuery, [schemaName, tableName])
    ]);

    // 4. Procesamiento de Resultados (uso de result.rows)
    const columnas = columnasRes.rows.map((col: any) => ({
        name: col.nombre,
        type: col.tipo,
        // PostgreSQL devuelve booleanos o 'YES'/'NO', mapeamos a boolean si es necesario
        nullable: col.nullable, 
        identity: col.identity_column,
        // La lógica de editabilidad se mantiene
        editable: !col.identity_column 
    }));

    const pk = pkRes.rows.map((row: any) => ({ pk: row.pk }));

    return { table: nombreTabla, pk, columns: columnas };
}