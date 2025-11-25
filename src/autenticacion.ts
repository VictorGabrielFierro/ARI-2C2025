import bcrypt from 'bcrypt';
import { ConnectionPool } from 'mssql'; // tu driver SQL Server
import { Usuario } from "./tipos/index.js";


// Funciones de hash y verificación
export async function verificarPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function autenticarUsuario(pool: ConnectionPool, username: string, password: string): Promise<Usuario | null> {
    const result = await pool.request()
        .input('username', username)
        .query('SELECT * FROM usuarios WHERE username = @username');

    if (result.recordset.length === 0) return null;

    const user = result.recordset[0];
    const match = await verificarPassword(password, user.password_hash);
    if (!match) return null;

    return {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
    };
}