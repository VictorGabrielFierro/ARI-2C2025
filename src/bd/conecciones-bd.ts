import dotenv from 'dotenv';
dotenv.config()
import { Pool, PoolConfig } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig: PoolConfig = {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    max: 10,
    idleTimeoutMillis: 30000,
    ssl: isProduction
        ? { rejectUnauthorized: false }
        : undefined,
};

let adminPool: Pool | null = null;
let loginPool: Pool | null = null;
let ownerPool: Pool | null = null;
let alumnoPool: Pool | null = null;

async function obtenerPool(usuario: string | undefined, clave: string | undefined){
    return new Pool({
        ...baseConfig,
        user: usuario,
        password: clave
    })
}

export async function obtenerPoolPorRol(rol?: string): Promise<Pool> {
    switch (rol) {
        case 'administrador':
            if (!adminPool){
                adminPool = await obtenerPool(process.env.ADMIN_USER, process.env.ADMIN_PASS);
            }
            return adminPool

        case 'owner':
            if (!ownerPool){
                ownerPool = await obtenerPool(process.env.OWNER_USER, process.env.OWNER_PASS);
            }
            return ownerPool

        case 'usuario':
            if (!alumnoPool){
                alumnoPool = await obtenerPool(process.env.ALUMNO_USER, process.env.ALUMNO_PASS);
            }
            return alumnoPool

        default:
            if(!loginPool){
                loginPool = await obtenerPool(process.env.LOGIN_USER, process.env.LOGIN_PASS)
            }
            return loginPool
    }
}
