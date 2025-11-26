// arma query SELECT
export function buildSelectQuery(tabla: string, columnas: string){
    return `SELECT ${columnas} FROM ${tabla}`
}

// arma query SELECT * FROM tabla
export function buildSelectAllQuery(tabla: string) {
    return buildSelectQuery(tabla, '*');
}

// arma WHERE pk = @pk
export function buildWherePk(pkCol: string, pkVar: string) {
    return `WHERE ${pkCol} = @${pkVar}`;
}

// arma INSERT dinámico
export function buildInsertQuery(tabla: string, cols: string[]) {
    const columnas = cols.join(", ");
    const valores = cols.map(c => `@${c}`).join(", ");
    return `INSERT INTO ${tabla} (${columnas}) VALUES (${valores})`;
}

// arma UPDATE dinámico
export function buildUpdateQuery(tabla: string, cols: string[], pkCol: string[]) {
    const sets = cols.map(c => `${c} = @${c}`).join(", ");
    const condiciones = pkCol.map(p => `${p} = @${p}`).join(" AND ")
    return `UPDATE ${tabla} SET ${sets} WHERE ${condiciones}`;
}

// DELETE
export function buildDeleteQuery(tabla: string, pkCol: string[]) {
    const condiciones = pkCol.map(p => `${p} = @${p}`).join(" AND ")
    return `DELETE FROM ${tabla} WHERE ${condiciones}`;
}
