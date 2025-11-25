// db/conexion.ts
import sql, { config as SqlConfig } from 'mssql';

const dbConfigAdmin: SqlConfig = {
    user: 'aida_admin',
    password: 'Admin2025',
    server: 'localhost',
    database: 'aida_db',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

let pool: sql.ConnectionPool;

export async function getPool() {
    if (!pool) {
        pool = await sql.connect(dbConfigAdmin);
    }
    return pool;
}
