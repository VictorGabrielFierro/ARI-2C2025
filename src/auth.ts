import bcrypt from 'bcrypt';
import { ConnectionPool } from 'mssql'; 
import { Usuario } from "./tipos/index.js";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";



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

export const verificarToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No token" });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; rol: string };
        req.user = payload;
        return next();
    } catch (err) {
        return res.status(403).json({ error: "Token inválido" });
    }
};
