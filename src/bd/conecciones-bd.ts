// conecciones-bd.ts
import dotenv from 'dotenv';
dotenv.config()
dotenv.config({
  path: process.env.ENV_FILE === '.env.production'
    ? '.env.production'
    : '.env.development'
});
import { Pool, PoolConfig } from 'pg';

// ------------------ CONFIGURACIÓN ------------------

const isProduction = process.env.NODE_ENV === 'production';

// Config base (dinámico por env)
const baseConfig: PoolConfig = {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    max: 10,
    idleTimeoutMillis: 30000,
    ssl: isProduction
        ? { rejectUnauthorized: false }
        : undefined, // en local → sin SSL
};

// ------------------ POOLS ------------------

let adminPool: Pool | null = null;
let loginPool: Pool | null = null;
let ownerPool: Pool | null = null;
let alumnoPool: Pool | null = null;

// ------------------ FUNCIONES DE CONEXIÓN ------------------

export async function getAdminPool(): Promise<Pool> {
    if (!adminPool) {
        adminPool = new Pool({
            ...baseConfig,
            user: process.env.ADMIN_USER,
            password: process.env.ADMIN_PASS,
        });
    }
    return adminPool;
}

export async function getLoginPool(): Promise<Pool> {
    console.log("DEBUG ENV LOCAL:", {
    ADMIN_USER: process.env.ADMIN_USER,
    ADMIN_PASS: process.env.ADMIN_PASS,
    });
    if (!loginPool) {
        loginPool = new Pool({
            ...baseConfig,
            user: process.env.LOGIN_USER,
            password: process.env.LOGIN_PASS,
        });
    }
    return loginPool;
}

export async function getOwnerPool(): Promise<Pool> {
    if (!ownerPool) {
        ownerPool = new Pool({
            ...baseConfig,
            user: process.env.OWNER_USER,
            password: process.env.OWNER_PASS,
        });
    }
    return ownerPool;
}

export async function getAlumnoPool(): Promise<Pool> {
    if (!alumnoPool) {
        alumnoPool = new Pool({
            ...baseConfig,
            user: process.env.ALUMNO_USER,
            password: process.env.ALUMNO_PASS,
        });
    }
    return alumnoPool;
}

// Función Selectora por Rol
export async function obtenerPoolPorRol(rol?: string): Promise<Pool> {
    switch (rol) {
        case 'administrador':
            return getAdminPool();

        case 'owner':
            return getOwnerPool();

        case 'usuario':
            return getAlumnoPool();

        default:
            return getLoginPool();
    }
}
