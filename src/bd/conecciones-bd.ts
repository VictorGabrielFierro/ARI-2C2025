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
    user: 'aida_login',
    password: 'Login2025',
    server: 'localhost',
    database: 'aida_db',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

// Pool para usuario owner
const dbConfigOwner: SqlConfig = {
    user: 'aida_owner',
    password: 'Owner2025',
    server: 'localhost',
    database: 'aida_db',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

// ------------------ POOLS ------------------

let adminPool: ConnectionPool | null = null;
let loginPool: ConnectionPool | null = null;
let ownerPool: ConnectionPool | null = null;

// ------------------ FUNCIONES DE CONEXIÓN ------------------

export async function getAdminPool(): Promise<ConnectionPool> {
    if (!adminPool) {
        adminPool = await new sql.ConnectionPool(dbConfigAdmin).connect();
    }
    return adminPool;
}

export async function getLoginPool(): Promise<ConnectionPool> {
    if (!loginPool) {
        loginPool = await new sql.ConnectionPool(dbConfigLogging).connect();
    }
    return loginPool;
}

export async function getOwnerPool(): Promise<ConnectionPool> {
    if (!ownerPool) {
        ownerPool = await new sql.ConnectionPool(dbConfigOwner).connect();
    }
    return ownerPool;
}


