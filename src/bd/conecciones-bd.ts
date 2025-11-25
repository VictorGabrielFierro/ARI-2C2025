// conecciones-bd.ts
import sql, { config as SqlConfig, ConnectionPool } from 'mssql';

// ------------------ CONFIGURACIONES ------------------

// Pool para usuario admin
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

// Pool para usuario logging (solo tiene permisos de SELECT sobre usuarios)
const dbConfigLogging: SqlConfig = {
    user: 'aida_logging',
    password: 'Logging2025',
    server: 'localhost',
    database: 'aida_db',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

// ------------------ POOLS ------------------

let adminPool: ConnectionPool | null = null;
let loggingPool: ConnectionPool | null = null;

// ------------------ FUNCIONES DE CONEXIÓN ------------------

export async function getAdminPool(): Promise<ConnectionPool> {
    if (!adminPool) {
        adminPool = await new sql.ConnectionPool(dbConfigAdmin).connect();
    }
    return adminPool;
}

export async function getLoggingPool(): Promise<ConnectionPool> {
    if (!loggingPool) {
        loggingPool = await new sql.ConnectionPool(dbConfigLogging).connect();
    }
    return loggingPool;
}
