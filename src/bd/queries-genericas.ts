const w = (str: string) => {
    if (str.includes('.')) {
        const parts = str.split('.');
        return `"${parts[0]}"."${parts[1]}"`; 
    }
    return `"${str}"`; 
};

export function buildSelectBaseQuery(tabla: string) {
    return `SELECT * FROM ${w(tabla)}`;
}

export function buildSelectAllQuery(tabla: string, pkCols: string[]) {
    const base = buildSelectBaseQuery(tabla);
    const orderBy = pkCols.map(c => w(c)).join(", ");
    return `${base} ORDER BY ${orderBy} ASC`; 
}


export function buildInsertQuery(tabla: string, cols: string[]) {
    const columnas = cols.map(c => w(c)).join(", ");
    const placeholders = cols.map((_, index) => `$${index + 1}`).join(", ");
    return `INSERT INTO ${w(tabla)} (${columnas}) VALUES (${placeholders})`;
}

export function buildUpdateQuery(tabla: string, sets: string[], whereConditions: string[]) {
    const setClause = sets.join(", ");
    const whereClause = whereConditions.join(" AND ");
    return `UPDATE ${w(tabla)} SET ${setClause} WHERE ${whereClause}`;
}

export function buildDeleteQuery(tabla: string, whereConditions: string[]) {
    const condiciones = whereConditions.join(" AND ");
    return `DELETE FROM ${w(tabla)} WHERE ${condiciones}`;
}