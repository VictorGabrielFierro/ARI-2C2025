import bcrypt from 'bcrypt';
import { ConnectionPool } from 'mssql'; 
import { Usuario } from "./tipos/index.js";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";


export const JWT_SECRET = "clave-ultra-secreta";

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
      email: user.email,
      rol: user.rol,
      lu: user.lu || null
    };
}

// Para generar un token
export function generarToken(usuario: string): string {
  return jwt.sign({ usuario }, JWT_SECRET, { expiresIn: "2h" });
}

// Middleware para verificar token
export function verificarTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    // Attach decoded user info to request for downstream handlers
    req.user = {
      id: payload.id,
      username: payload.username,
      rol: payload.rol,
      lu: payload.lu ?? null,
    };
    return next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }
}

// Middleware factory para exigir roles
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !user.rol) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!allowedRoles.includes(user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    return next();
  };
}


// Función simple para validar token y devolver boolean
export function verificarToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
export default JWT_SECRET;