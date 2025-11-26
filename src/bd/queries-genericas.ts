// Envoltorio de seguridad para nombres de tablas y columnas (evita errores con palabras reservadas) 
// Soporta "esquema.tabla" y "tabla"
const w = (str: string) => {
    if (str.includes('.')) {
        const parts = str.split('.');
        // Transforma 'aida.alumnos' en '"aida"."alumnos"'
        return `"${parts[0]}"."${parts[1]}"`; 
    }
    // Transforma 'columna' en '"columna"'
    return `"${str}"`; 
};

/**
 * 1. SELECT BASE
 * Solo devuelve "SELECT * FROM "esquema"."tabla"".
 * Úsala cuando vas a agregar un WHERE manualmente después.
 */
export function buildSelectBaseQuery(tabla: string) {
    return `SELECT * FROM ${w(tabla)}`;
}

/**
 * 2. SELECT ALL (Con Ordenamiento)
 * Úsala para listas completas. Requiere las PKs para ordenar.
 */
export function buildSelectAllQuery(tabla: string, pkCols: string[]) {
    const base = buildSelectBaseQuery(tabla);
    const orderBy = pkCols.map(c => w(c)).join(", ");
    return `${base} ORDER BY ${orderBy} ASC`; 
}

// 3. INSERT
/**
 * Genera la query INSERT. 
 * Ya que PostgreSQL usa parámetros posicionales ($1, $2...), se genera el número de placeholders.
 */
export function buildInsertQuery(tabla: string, cols: string[]) {
    const columnas = cols.map(c => w(c)).join(", ");
    // Genera el string de placeholders: $1, $2, $3...
    const placeholders = cols.map((_, index) => `$${index + 1}`).join(", ");
    
    return `INSERT INTO ${w(tabla)} (${columnas}) VALUES (${placeholders})`;
}

// 4. UPDATE
/**
 * Genera la query UPDATE. Requiere los arrays de SET y WHERE ya listos con placeholders.
 * ⚠️ NOTA: Esta función requiere ser llamada de forma distinta en el router.ts.
 * Se asume que las condiciones (sets y where) ya vienen con los $n listos.
 */
export function buildUpdateQuery(tabla: string, sets: string[], whereConditions: string[]) {
    const setClause = sets.join(", ");
    const whereClause = whereConditions.join(" AND ");
    
    // La sintaxis de PostgreSQL no permite la conversión automática de @param a $n,
    // por lo que esperamos que el código de llamada (router.ts) ya haya construido
    // la cláusula SET y WHERE usando $n.
    return `UPDATE ${w(tabla)} SET ${setClause} WHERE ${whereClause}`;
}

// 5. DELETE
/**
 * Genera la query DELETE.
 * Se asume que las condiciones WHERE ya vienen construidas con $n.
 */
export function buildDeleteQuery(tabla: string, whereConditions: string[]) {
    const condiciones = whereConditions.join(" AND ");
    // Se asume que la condición ya incluye el placeholder posicional ($1)
    return `DELETE FROM ${w(tabla)} WHERE ${condiciones}`;
}