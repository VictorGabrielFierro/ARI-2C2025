// Envoltorio de seguridad para nombres de tablas y columnas (evita errores con palabras reservadas) Soporta "tabla" y "esquema.tabla"
const w = (str: string) => {
    if (str.includes('.')) {
        const parts = str.split('.');
        return `[${parts[0]}].[${parts[1]}]`; // Transforma 'aida.alumnos' en '[aida].[alumnos]'
    }
    return `[${str}]`;
};

/**
 * 1. SELECT BASE
 * Solo devuelve "SELECT * FROM [tabla]".
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

<<<<<<< HEAD
// arma WHERE pk = @pk
export function buildWherePk(pkCol: string, pkVar: string) {
    return ` WHERE ${pkCol} = @${pkVar}`;
}

// arma INSERT dinámico
=======
// 3. INSERT
>>>>>>> refactorizando-CRUD-generico
export function buildInsertQuery(tabla: string, cols: string[]) {
    const columnas = cols.map(c => w(c)).join(", ");
    const valores = cols.map(c => `@${c}`).join(", ");
    return `INSERT INTO ${w(tabla)} (${columnas}) VALUES (${valores})`;
}

// 4. UPDATE
export function buildUpdateQuery(tabla: string, cols: string[], pkCol: string[]) {
    const sets = cols.map(c => `${w(c)} = @${c}`).join(", ");
    const condiciones = pkCol.map(p => `${w(p)} = @${p}`).join(" AND ");
    
    return `UPDATE ${w(tabla)} SET ${sets} WHERE ${condiciones}`;
}

// 5. DELETE
export function buildDeleteQuery(tabla: string, pkCol: string[]) {
    const condiciones = pkCol.map(p => `${w(p)} = @${p}`).join(" AND ");
    return `DELETE FROM ${w(tabla)} WHERE ${condiciones}`;
}