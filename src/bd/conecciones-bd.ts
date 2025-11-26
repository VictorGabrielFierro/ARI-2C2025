// conecciones-bd.ts

// 1. ⬇️ Reemplazamos las importaciones de 'mssql' por 'pg'
import { Pool, PoolConfig } from 'pg'; 

// ------------------ CONFIGURACIONES ------------------

// 2. ⬇️ El objeto de configuración (PoolConfig) es más simple en pg
// Los parámetros 'encrypt' y 'trustServerCertificate' son específicos de MS SQL Server
// y se eliminan o se reemplazan por la configuración SSL de PostgreSQL si es necesario.
// Usaremos la configuración básica.

const baseConfig: PoolConfig = {
    host: 'localhost',
    database: 'aida_db',
    port: 5432, // Puerto estándar de PostgreSQL
    max: 10,     // Opcional: número máximo de clientes en el pool
    idleTimeoutMillis: 30000, // Opcional: cuánto tiempo un cliente puede estar inactivo antes de ser desconectado
};

// Pool para usuario admin
const dbConfigAdmin: PoolConfig = {
    ...baseConfig,
    user: 'aida_admin',
    password: 'Admin2025',
};

// Pool para usuario logging
const dbConfigLogging: PoolConfig = {
    ...baseConfig,
    user: 'aida_login',
    password: 'Login2025',
};

// Pool para usuario owner
const dbConfigOwner: PoolConfig = {
    ...baseConfig,
    user: 'aida_owner',
    password: 'Owner2025',
};

// Pool para usuario alumno
const dbConfigAlumno: PoolConfig = {
    ...baseConfig,
    user: 'aida_alumno',
    password: 'Alumno2025',
};

// ------------------ POOLS ------------------

// 3. ⬇️ El tipo de Pool es `Pool` de 'pg'
let adminPool: Pool | null = null;
let loginPool: Pool | null = null;
let ownerPool: Pool | null = null;
let alumnoPool: Pool | null = null;

// ------------------ FUNCIONES DE CONEXIÓN ------------------

// 4. ⬇️ La conexión se establece directamente al instanciar el Pool en 'pg'
// No se usa un método `.connect()` asíncrono; el Pool gestiona las conexiones bajo demanda.

export async function getAdminPool(): Promise<Pool> {
    if (!adminPool) {
        // En `pg`, el Pool se instancia y se inicializa. Las conexiones se obtienen al hacer .query()
        adminPool = new Pool(dbConfigAdmin);
        // Opcional: Una prueba de conexión para asegurarse de que las credenciales son válidas.
        // await adminPool.query('SELECT 1'); 
    }
    return adminPool;
}

export async function getLoginPool(): Promise<Pool> {
    if (!loginPool) {
        loginPool = new Pool(dbConfigLogging);
    }
    return loginPool;
}

export async function getOwnerPool(): Promise<Pool> {
    if (!ownerPool) {
        ownerPool = new Pool(dbConfigOwner);
    }
    return ownerPool;
}

export async function getAlumnoPool(): Promise<Pool> {
    if (!alumnoPool) {
        alumnoPool = new Pool(dbConfigAlumno);
    }
    return alumnoPool;
}

// Funcion Selectora de Pool
// 5. ⬇️ El tipo de retorno es `Pool`
export async function obtenerPoolPorRol(rol?: string): Promise<Pool> {
    switch (rol) {
        case 'administrador': 
            return await getAdminPool(); 
            
        case 'owner':
            return await getOwnerPool();

        case 'usuario':
            return await getAlumnoPool();

        default:
            return await getLoginPool();
    }
}